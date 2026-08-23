import io
import uuid
from datetime import date, datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.enums import UserRole, RequisitionStatus, EmploymentType, EducationLevel
from app.models.requisition import Requisition
from app.models.application import Application
from app.models.user import User
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
def candidate_a(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice@example.com",
            "mobile": "+1234567890",
            "password": "Password@1234",
        },
    )
    token = res.json()["access_token"]
    user_id = res.json()["user"]["id"]

    # Fill profile education & experience
    headers = {"Authorization": f"Bearer {token}"}
    client.put(
        "/api/v1/me/education",
        json={
            "educations": [
                {
                    "degree": "B.Tech Computer Science",
                    "institution": "IIT Bombay",
                    "year_of_passing": 2020,
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
                    "employer": "Tech Corp",
                    "job_title": "Software Engineer",
                    "start_date": "2021-01-01",
                    "is_current": True,
                }
            ],
        },
        headers=headers,
    )

    return {"token": token, "user_id": user_id, "email": "alice@example.com"}


@pytest.fixture
def candidate_b(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Bob",
            "last_name": "Jones",
            "email": "bob@example.com",
            "mobile": "+1987654321",
            "password": "Password@1234",
        },
    )
    return {"token": res.json()["access_token"], "user_id": res.json()["user"]["id"]}


@pytest.fixture
def published_job(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Full Stack Engineer",
            "department": "Engineering",
            "location": "Remote",
            "employment_type": "full_time",
            "experience_range": "3-5 years",
            "openings": 2,
            "hiring_manager": "Tech Lead",
            "description_html": "<p>Build great products.</p>",
            "status": "published",
        },
        headers=headers,
    )
    return res.json()


@pytest.fixture
def draft_job(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Internal Draft Role",
            "department": "Strategy",
            "location": "HQ",
            "employment_type": "full_time",
            "experience_range": "10+ years",
            "openings": 1,
            "hiring_manager": "Director",
            "description_html": "<p>Draft.</p>",
            "status": "draft",
        },
        headers=headers,
    )
    return res.json()


# Sample valid PDF dummy content
VALID_PDF = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF"


def test_application_draft_flow(client, candidate_a, published_job):
    headers = {"Authorization": f"Bearer {candidate_a['token']}"}
    job_id = published_job["id"]

    # Initial draft check -> should be null
    res = client.get(f"/api/v1/jobs/{job_id}/applications/draft", headers=headers)
    assert res.status_code == 200
    assert res.json() is None

    # Save draft
    save_res = client.post(
        f"/api/v1/jobs/{job_id}/applications/draft",
        json={"cover_note": "Draft cover note content", "last_active_step": 2},
        headers=headers,
    )
    assert save_res.status_code == 200
    data = save_res.json()
    assert data["status"] == "draft"
    assert data["cover_note"] == "Draft cover note content"

    # Subsequent GET returns the saved draft
    get_res = client.get(f"/api/v1/jobs/{job_id}/applications/draft", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["cover_note"] == "Draft cover note content"


def test_submit_application_success(client, candidate_a, published_job):
    headers = {"Authorization": f"Bearer {candidate_a['token']}"}
    job_id = published_job["id"]

    # Submit application multipart
    res = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={
            "cover_note": "I am excited to apply for this role!",
            "consent_accuracy": "true",
            "consent_privacy": "true",
        },
        files={"resume": ("my_resume.pdf", VALID_PDF, "application/pdf")},
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "new"
    assert data["application_code"].startswith("APP-")
    assert data["submitted_at"] is not None
    assert data["resume_filename"] == "my_resume.pdf"
    assert data["snapshot_json"] is not None
    assert data["snapshot_json"]["candidate"]["email"] == "alice@example.com"
    assert len(data["snapshot_json"]["educations"]) == 1
    assert len(data["snapshot_json"]["experiences"]) == 1

    app_id = data["id"]

    # Candidate lists my applications
    my_apps_res = client.get("/api/v1/me/applications", headers=headers)
    assert my_apps_res.status_code == 200
    my_apps = my_apps_res.json()
    assert len(my_apps) == 1
    assert my_apps[0]["id"] == app_id
    assert my_apps[0]["requisition_title"] == "Full Stack Engineer"
    assert my_apps[0]["status"] == "new"

    # Candidate gets application detail
    detail_res = client.get(f"/api/v1/me/applications/{app_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["application_code"] == data["application_code"]
    assert detail["snapshot_json"] is not None


def test_submit_duplicate_application_blocked(client, candidate_a, published_job):
    headers = {"Authorization": f"Bearer {candidate_a['token']}"}
    job_id = published_job["id"]

    # First submit
    r1 = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("resume.pdf", VALID_PDF, "application/pdf")},
        headers=headers,
    )
    assert r1.status_code == 201

    # Second submit -> 409 CONFLICT
    r2 = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("resume.pdf", VALID_PDF, "application/pdf")},
        headers=headers,
    )
    assert r2.status_code == 409
    assert r2.json()["detail"]["error"]["code"] == "CONFLICT"


def test_submit_validation_failures(client, candidate_a, published_job, draft_job):
    headers = {"Authorization": f"Bearer {candidate_a['token']}"}
    pub_id = published_job["id"]
    draft_id = draft_job["id"]

    # 1. Missing consents
    r_no_consent = client.post(
        f"/api/v1/jobs/{pub_id}/applications",
        data={"consent_accuracy": "false", "consent_privacy": "true"},
        files={"resume": ("resume.pdf", VALID_PDF, "application/pdf")},
        headers=headers,
    )
    assert r_no_consent.status_code == 422

    # 2. Applying to a draft / closed job
    r_draft = client.post(
        f"/api/v1/jobs/{draft_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("resume.pdf", VALID_PDF, "application/pdf")},
        headers=headers,
    )
    assert r_draft.status_code == 422
    assert r_draft.json()["detail"]["error"]["code"] == "REQUISITION_NOT_OPEN"

    # 3. Invalid resume file (plain text pretending to be pdf)
    r_invalid_file = client.post(
        f"/api/v1/jobs/{pub_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("fake.pdf", b"This is plain text and not PDF", "application/pdf")},
        headers=headers,
    )
    assert r_invalid_file.status_code == 422


def test_resume_download_and_idor_protection(
    client, candidate_a, candidate_b, admin_token, published_job
):
    # Candidate A applies
    headers_a = {"Authorization": f"Bearer {candidate_a['token']}"}
    job_id = published_job["id"]

    sub_res = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("alice_cv.pdf", VALID_PDF, "application/pdf")},
        headers=headers_a,
    )
    assert sub_res.status_code == 201
    app_id = sub_res.json()["id"]

    # 1. Candidate A downloads own resume -> 200 OK
    res_a = client.get(f"/api/v1/files/resumes/{app_id}", headers=headers_a)
    assert res_a.status_code == 200
    assert res_a.headers["content-type"] == "application/pdf"
    assert len(res_a.content) == len(VALID_PDF)

    # 2. Admin downloads Candidate A resume -> 200 OK
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    res_admin = client.get(f"/api/v1/files/resumes/{app_id}", headers=headers_admin)
    assert res_admin.status_code == 200
    assert len(res_admin.content) == len(VALID_PDF)

    # 3. Candidate B attempts to download Candidate A resume -> 403 FORBIDDEN (IDOR Blocked)
    headers_b = {"Authorization": f"Bearer {candidate_b['token']}"}
    res_b = client.get(f"/api/v1/files/resumes/{app_id}", headers=headers_b)
    assert res_b.status_code == 403
    assert res_b.json()["detail"]["error"]["code"] == "FORBIDDEN"

    # 4. Anonymous user attempts download -> 401 UNAUTHENTICATED
    client.cookies.clear()
    res_anon = client.get(f"/api/v1/files/resumes/{app_id}")
    assert res_anon.status_code == 401
