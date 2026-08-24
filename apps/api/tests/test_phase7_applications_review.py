import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.enums import UserRole, ApplicationStatus
from app.models.user import User
from app.models.application import Application
from app.services.bootstrap import bootstrap_admin


VALID_PDF = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF"


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
def admin_user(db_session):
    bootstrap_admin(db_session)
    return db_session.query(User).filter(User.email == "admin@talentbridge.local").first()


@pytest.fixture
def admin_token(client, admin_user):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@talentbridge.local", "password": "Admin@12345"},
    )
    return res.json()["access_token"]


@pytest.fixture
def candidate1_auth(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice.smith@example.com",
            "mobile": "+1555111222",
            "password": "Password@1234",
        },
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    client.put(
        "/api/v1/me/education",
        json={
            "educations": [
                {
                    "degree": "B.S. Computer Science",
                    "institution": "Stanford University",
                    "year_of_passing": 2021,
                    "education_level": "bachelors",
                }
            ]
        },
        headers=headers,
    )
    client.put(
        "/api/v1/me/experience",
        json={
            "is_fresher": False,
            "experiences": [
                {
                    "employer": "TechCorp",
                    "job_title": "Software Engineer",
                    "start_date": "2021-06-01",
                    "end_date": "2023-06-01",
                    "is_current": False,
                }
            ],
        },
        headers=headers,
    )
    client.put(
        "/api/v1/me/profile",
        json={
            "gender": "female",
            "current_location": "San Francisco, CA",
            "current_company": "TechCorp",
            "notice_period": "30",
        },
        headers=headers,
    )
    return {"token": token, "email": "alice.smith@example.com"}


@pytest.fixture
def candidate2_auth(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Bob",
            "last_name": "Jones",
            "email": "bob.jones@example.com",
            "mobile": "+1555333444",
            "password": "Password@1234",
        },
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    client.put(
        "/api/v1/me/education",
        json={
            "educations": [
                {
                    "degree": "M.S. Data Science",
                    "institution": "MIT",
                    "year_of_passing": 2022,
                    "education_level": "masters",
                }
            ]
        },
        headers=headers,
    )
    client.put(
        "/api/v1/me/experience",
        json={
            "is_fresher": True,
            "experiences": [],
        },
        headers=headers,
    )
    client.put(
        "/api/v1/me/profile",
        json={
            "gender": "male",
            "current_location": "Boston, MA",
            "current_company": None,
            "notice_period": "immediate",
        },
        headers=headers,
    )
    return {"token": token, "email": "bob.jones@example.com"}


@pytest.fixture
def sample_jobs(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Job 1
    res1 = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Backend Architect",
            "department": "Engineering",
            "location": "San Francisco, CA",
            "employment_type": "full_time",
            "experience_range": "5-8 years",
            "openings": 2,
            "hiring_manager": "VP Eng",
            "description_html": "<p>Lead architecture.</p>",
            "status": "published",
        },
        headers=headers,
    )
    # Job 2
    res2 = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Data Scientist",
            "department": "AI Research",
            "location": "Boston, MA",
            "employment_type": "full_time",
            "experience_range": "0-2 years",
            "openings": 1,
            "hiring_manager": "Head of AI",
            "description_html": "<p>Research models.</p>",
            "status": "published",
        },
        headers=headers,
    )
    return {"job1": res1.json(), "job2": res2.json()}


def test_admin_applications_rbac(client, candidate1_auth, sample_jobs):
    """Ensure candidate cannot access admin application endpoints (P7-10)."""
    headers_cand = {"Authorization": f"Bearer {candidate1_auth['token']}"}
    job1_id = sample_jobs["job1"]["id"]

    # Requisition applications list
    res = client.get(f"/api/v1/admin/requisitions/{job1_id}/applications", headers=headers_cand)
    assert res.status_code == 403
    assert res.json()["detail"]["error"]["code"] == "FORBIDDEN"

    # All applications list
    res_all = client.get("/api/v1/admin/applications", headers=headers_cand)
    assert res_all.status_code == 403

    # Export CSV
    res_csv = client.get(f"/api/v1/admin/requisitions/{job1_id}/applications/export", headers=headers_cand)
    assert res_csv.status_code == 403

    # Status update
    dummy_id = str(uuid.uuid4())
    res_patch = client.patch(
        f"/api/v1/admin/applications/{dummy_id}/status",
        json={"status": "shortlisted"},
        headers=headers_cand,
    )
    assert res_patch.status_code == 403


def test_admin_requisition_applications_grid(
    client, candidate1_auth, candidate2_auth, admin_token, sample_jobs
):
    """Test P7-01: Admin gets submitted applications grid with candidate snapshot details."""
    headers_cand1 = {"Authorization": f"Bearer {candidate1_auth['token']}"}
    headers_cand2 = {"Authorization": f"Bearer {candidate2_auth['token']}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    job1_id = sample_jobs["job1"]["id"]

    # Submit candidate 1 to job 1
    sub1 = client.post(
        f"/api/v1/jobs/{job1_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true", "cover_note": "Great fit for architecture"},
        files={"resume": ("alice_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand1,
    )
    assert sub1.status_code == 201
    app1_data = sub1.json()

    # Submit candidate 2 to job 1
    sub2 = client.post(
        f"/api/v1/jobs/{job1_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("bob_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand2,
    )
    assert sub2.status_code == 201
    app2_data = sub2.json()

    # Admin query requisition applications
    res = client.get(f"/api/v1/admin/requisitions/{job1_id}/applications", headers=headers_admin)
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 2

    # Check fields
    app_codes = [i["application_code"] for i in items]
    assert app1_data["application_code"] in app_codes
    assert app2_data["application_code"] in app_codes

    alice_item = next(i for i in items if i["application_code"] == app1_data["application_code"])
    assert alice_item["candidate_name"] == "Alice Smith"
    assert alice_item["candidate_email"] == "alice.smith@example.com"
    assert alice_item["candidate_location"] == "San Francisco, CA"
    assert alice_item["status"] == "new"
    assert alice_item["resume_filename"] == "alice_cv.pdf"
    assert alice_item["resume_url"] == f"/api/v1/files/resumes/{app1_data['id']}"
    assert alice_item["total_experience_years"] == 2.0


def test_admin_applications_search_and_filters(
    client, candidate1_auth, candidate2_auth, admin_token, sample_jobs
):
    """Test P7-07: Search by candidate name/email and filter by status."""
    headers_cand1 = {"Authorization": f"Bearer {candidate1_auth['token']}"}
    headers_cand2 = {"Authorization": f"Bearer {candidate2_auth['token']}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    job1_id = sample_jobs["job1"]["id"]

    client.post(
        f"/api/v1/jobs/{job1_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("alice_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand1,
    )
    client.post(
        f"/api/v1/jobs/{job1_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("bob_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand2,
    )

    # Search for "Alice"
    res_alice = client.get(f"/api/v1/admin/requisitions/{job1_id}/applications?q=Alice", headers=headers_admin)
    assert res_alice.status_code == 200
    assert len(res_alice.json()) == 1
    assert res_alice.json()[0]["candidate_name"] == "Alice Smith"

    # Search for "bob.jones"
    res_bob = client.get(f"/api/v1/admin/requisitions/{job1_id}/applications?q=bob.jones", headers=headers_admin)
    assert res_bob.status_code == 200
    assert len(res_bob.json()) == 1
    assert res_bob.json()[0]["candidate_name"] == "Bob Jones"

    # Filter status "shortlisted" when both are "new" -> 0
    res_short = client.get(f"/api/v1/admin/requisitions/{job1_id}/applications?status=shortlisted", headers=headers_admin)
    assert res_short.status_code == 200
    assert len(res_short.json()) == 0


def test_admin_application_detail_snapshot_and_status_update(
    client, candidate1_auth, admin_token, sample_jobs
):
    """Test P7-04 and P7-06: View full snapshot and change status."""
    headers_cand = {"Authorization": f"Bearer {candidate1_auth['token']}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    job1_id = sample_jobs["job1"]["id"]

    sub_res = client.post(
        f"/api/v1/jobs/{job1_id}/applications",
        data={
            "consent_accuracy": "true",
            "consent_privacy": "true",
            "cover_note": "I have extensive experience building scalable backends.",
        },
        files={"resume": ("alice_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand,
    )
    app_id = sub_res.json()["id"]

    # Admin get full snapshot
    detail_res = client.get(f"/api/v1/admin/applications/{app_id}", headers=headers_admin)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == app_id
    assert detail["candidate_name"] == "Alice Smith"
    assert detail["candidate_email"] == "alice.smith@example.com"
    assert detail["cover_note"] == "I have extensive experience building scalable backends."
    assert detail["requisition"]["title"] == "Backend Architect"
    assert "snapshot_json" in detail
    snapshot = detail["snapshot_json"]
    assert len(snapshot["educations"]) == 1
    assert snapshot["educations"][0]["degree"] == "B.S. Computer Science"
    assert len(snapshot["experiences"]) == 1
    assert snapshot["experiences"][0]["employer"] == "TechCorp"

    # Admin update status to 'reviewed'
    patch1 = client.patch(
        f"/api/v1/admin/applications/{app_id}/status",
        json={"status": "reviewed"},
        headers=headers_admin,
    )
    assert patch1.status_code == 200
    assert patch1.json()["status"] == "reviewed"

    # Admin update status to 'shortlisted'
    patch2 = client.patch(
        f"/api/v1/admin/applications/{app_id}/status",
        json={"status": "shortlisted"},
        headers=headers_admin,
    )
    assert patch2.status_code == 200
    assert patch2.json()["status"] == "shortlisted"

    # Verify status reflected in candidate's My Applications list
    my_apps = client.get("/api/v1/me/applications", headers=headers_cand)
    assert my_apps.status_code == 200
    assert my_apps.json()[0]["status"] == "shortlisted"

    # Admin cannot set status to 'draft'
    patch_draft = client.patch(
        f"/api/v1/admin/applications/{app_id}/status",
        json={"status": "draft"},
        headers=headers_admin,
    )
    assert patch_draft.status_code == 422


def test_cross_requisition_view_and_csv_export(
    client, candidate1_auth, candidate2_auth, admin_token, sample_jobs
):
    """Test P7-08 & P7-09: All applications cross-requisition listing and CSV export."""
    headers_cand1 = {"Authorization": f"Bearer {candidate1_auth['token']}"}
    headers_cand2 = {"Authorization": f"Bearer {candidate2_auth['token']}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    job1_id = sample_jobs["job1"]["id"]
    job2_id = sample_jobs["job2"]["id"]

    client.post(
        f"/api/v1/jobs/{job1_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("alice_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand1,
    )
    client.post(
        f"/api/v1/jobs/{job2_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("bob_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand2,
    )

    # Cross-requisition view: Should list both applications
    all_res = client.get("/api/v1/admin/applications", headers=headers_admin)
    assert all_res.status_code == 200
    all_items = all_res.json()
    assert len(all_items) == 2
    titles = [i["requisition_title"] for i in all_items]
    assert "Backend Architect" in titles
    assert "Data Scientist" in titles

    # CSV export for specific requisition
    csv_req = client.get(f"/api/v1/admin/requisitions/{job1_id}/applications/export", headers=headers_admin)
    assert csv_req.status_code == 200
    assert "text/csv" in csv_req.headers["content-type"]
    assert "Alice Smith" in csv_req.text
    assert "Bob Jones" not in csv_req.text

    # CSV export for all applications
    csv_all = client.get("/api/v1/admin/applications/export", headers=headers_admin)
    assert csv_all.status_code == 200
    assert "Alice Smith" in csv_all.text
    assert "Bob Jones" in csv_all.text
