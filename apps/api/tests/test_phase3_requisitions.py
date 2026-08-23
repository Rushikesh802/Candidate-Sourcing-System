import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.enums import UserRole, RequisitionStatus, EmploymentType
from app.services.bootstrap import bootstrap_admin


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(client, db_session):
    bootstrap_admin(db_session)
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@talentbridge.local", "password": "Admin@12345"},
    )
    return res.json()["access_token"]


@pytest.fixture
def candidate_token(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Jane",
            "last_name": "Candidate",
            "email": "jane.candidate@example.com",
            "mobile": "+919876543299",
            "password": "Password@1234",
        },
    )
    return res.json()["access_token"]


def test_admin_create_requisition_draft_and_published(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create Draft Requisition
    payload_draft = {
        "title": "Senior Frontend Developer",
        "department": "Engineering",
        "location": "Bengaluru, India (Hybrid)",
        "employment_type": "full_time",
        "experience_range": "4-7 years",
        "openings": 2,
        "hiring_manager": "Tech Lead",
        "description_html": "<p>We are looking for a <strong>Senior Frontend</strong> engineer.</p>",
        "max_salary_budget": 3000000.00,
        "status": "draft",
    }
    r1 = client.post("/api/v1/admin/requisitions", json=payload_draft, headers=headers)
    assert r1.status_code == 201
    data1 = r1.json()
    assert data1["requisition_code"].startswith("REQ-")
    assert "senior-frontend-developer" in data1["slug"]
    assert data1["status"] == "draft"
    assert data1["posted_at"] is None
    assert data1["application_count"] == 0

    # 2. Create Published Requisition
    payload_pub = {
        "title": "Backend Python Lead",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "full_time",
        "experience_range": "6-10 years",
        "openings": 1,
        "hiring_manager": "Engineering Director",
        "description_html": "<p>Join our core backend team.</p>",
        "status": "published",
    }
    r2 = client.post("/api/v1/admin/requisitions", json=payload_pub, headers=headers)
    assert r2.status_code == 201
    data2 = r2.json()
    assert data2["status"] == "published"
    assert data2["posted_at"] is not None


def test_admin_crud_workflow(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create Draft
    create_payload = {
        "title": "DevOps Engineer",
        "department": "Infrastructure",
        "location": "Remote",
        "employment_type": "contract",
        "experience_range": "3-5 years",
        "openings": 1,
        "hiring_manager": "Infra Lead",
        "description_html": "<p>DevOps Role</p>",
    }
    create_res = client.post("/api/v1/admin/requisitions", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    req_id = create_res.json()["id"]

    # Get Requisition Details
    get_res = client.get(f"/api/v1/admin/requisitions/{req_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "DevOps Engineer"

    # Update Requisition
    patch_payload = {
        "title": "Senior DevOps Engineer",
        "openings": 3,
    }
    patch_res = client.patch(f"/api/v1/admin/requisitions/{req_id}", json=patch_payload, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Senior DevOps Engineer"
    assert patch_res.json()["openings"] == 3
    assert "senior-devops-engineer" in patch_res.json()["slug"]

    # Publish Requisition
    pub_res = client.post(f"/api/v1/admin/requisitions/{req_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"
    assert pub_res.json()["posted_at"] is not None

    # Close Requisition
    close_res = client.post(f"/api/v1/admin/requisitions/{req_id}/close", headers=headers)
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"

    # Duplicate Requisition
    dup_res = client.post(f"/api/v1/admin/requisitions/{req_id}/duplicate", headers=headers)
    assert dup_res.status_code == 201
    dup_data = dup_res.json()
    assert dup_data["id"] != req_id
    assert dup_data["title"] == "Senior DevOps Engineer (Copy)"
    assert dup_data["status"] == "draft"
    assert dup_data["posted_at"] is None


def test_public_jobs_published_only_and_slug(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create Draft job
    client.post("/api/v1/admin/requisitions", json={
        "title": "Secret Internal Role",
        "department": "Strategy",
        "location": "HQ",
        "employment_type": "full_time",
        "experience_range": "10+ years",
        "openings": 1,
        "hiring_manager": "CEO",
        "description_html": "<p>Internal</p>",
        "status": "draft",
    }, headers=headers)

    # Create Published job 1
    r_pub = client.post("/api/v1/admin/requisitions", json={
        "title": "AI Research Scientist",
        "department": "AI Labs",
        "location": "Bengaluru",
        "employment_type": "full_time",
        "experience_range": "3-6 years",
        "openings": 2,
        "hiring_manager": "AI Head",
        "description_html": "<p>Research and model development</p>",
        "status": "published",
    }, headers=headers)
    pub_slug = r_pub.json()["slug"]

    # Create Closed job
    r_closed = client.post("/api/v1/admin/requisitions", json={
        "title": "Old Archived Position",
        "department": "Ops",
        "location": "Mumbai",
        "employment_type": "part_time",
        "experience_range": "1-3 years",
        "openings": 1,
        "hiring_manager": "Ops Lead",
        "description_html": "<p>Old</p>",
        "status": "draft",
    }, headers=headers)
    closed_id = r_closed.json()["id"]
    client.post(f"/api/v1/admin/requisitions/{closed_id}/close", headers=headers)
    closed_slug = r_closed.json()["slug"]

    # Query Public Jobs
    public_res = client.get("/api/v1/jobs")
    assert public_res.status_code == 200
    job_list = public_res.json()
    slugs = [j["slug"] for j in job_list]
    assert pub_slug in slugs
    assert "secret-internal-role" not in slugs
    assert closed_slug not in slugs

    # Query by Slug
    slug_res = client.get(f"/api/v1/jobs/{pub_slug}")
    assert slug_res.status_code == 200
    assert slug_res.json()["title"] == "AI Research Scientist"

    # Query Draft or Closed slug -> 404
    assert client.get(f"/api/v1/jobs/{closed_slug}").status_code == 404
    assert client.get("/api/v1/jobs/non-existent-slug-12345").status_code == 404


def test_public_search_and_filters(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/v1/admin/requisitions", json={
        "title": "Full Stack Engineer",
        "department": "Product Engineering",
        "location": "Bengaluru, India",
        "employment_type": "full_time",
        "experience_range": "3-5 years",
        "openings": 2,
        "hiring_manager": "Engineering Manager",
        "description_html": "<p>React and FastAPI skills required.</p>",
        "status": "published",
    }, headers=headers)

    # Search by q
    res_q = client.get("/api/v1/jobs?q=FastAPI")
    assert res_q.status_code == 200
    assert len(res_q.json()) == 1

    # Filter by department
    res_dep = client.get("/api/v1/jobs?department=Product")
    assert res_dep.status_code == 200
    assert len(res_dep.json()) == 1

    # Filter by non-matching location
    res_loc = client.get("/api/v1/jobs?location=London")
    assert res_loc.status_code == 200
    assert len(res_loc.json()) == 0


def test_admin_auth_and_rbac(client, candidate_token):
    # Unauthenticated request (clear cookies first)
    client.cookies.clear()
    unauth_res = client.get("/api/v1/admin/requisitions")
    assert unauth_res.status_code == 401
    assert unauth_res.json()["detail"]["error"]["code"] == "UNAUTHENTICATED"

    # Candidate forbidden request
    cand_res = client.get(
        "/api/v1/admin/requisitions",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert cand_res.status_code == 403
    assert cand_res.json()["detail"]["error"]["code"] == "FORBIDDEN"


def test_html_sanitization(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    dirty_html = (
        '<p>Job Description with <script>alert("xss")</script>'
        '<b onclick="steal()">Bold text</b> and <iframe src="evil.com"></iframe>'
        '<a href="javascript:alert(1)">Bad Link</a> and '
        '<a href="https://example.com" target="_blank">Good Link</a></p>'
    )
    res = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Sanitization Test Role",
            "department": "Security",
            "location": "Remote",
            "employment_type": "full_time",
            "experience_range": "2-4 years",
            "openings": 1,
            "hiring_manager": "Security Lead",
            "description_html": dirty_html,
            "status": "published",
        },
        headers=headers,
    )
    assert res.status_code == 201
    sanitized = res.json()["description_html"]
    assert "<script>" not in sanitized
    assert "alert" not in sanitized
    assert "<iframe>" not in sanitized
    assert "onclick" not in sanitized
    assert "javascript:" not in sanitized
    assert "<b>Bold text</b>" in sanitized
    assert '<a href="https://example.com" target="_blank">Good Link</a>' in sanitized
