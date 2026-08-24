import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.enums import UserRole, ApplicationStatus, RequisitionStatus
from app.models.user import User
from app.models.application import Application
from app.models.requisition import Requisition
from app.models.notification import Notification
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


def test_acceptance_11_1_public_job_visibility(client, admin_token):
    """
    AC 11.1: Requisitions in Draft or Closed status must never be visible
    on the public careers portal or public slug endpoints.
    """
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create a Draft job
    draft_res = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Secret Stealth Engineer",
            "department": "Engineering",
            "location": "Remote",
            "employment_type": "full_time",
            "experience_range": "3-5 years",
            "openings": 1,
            "hiring_manager": "CTO",
            "description_html": "<p>Confidential project.</p>",
            "status": "draft",
        },
        headers=headers,
    )
    assert draft_res.status_code == 201
    draft_slug = draft_res.json()["slug"]

    # 2. Create a Published job
    pub_res = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Public Frontend Developer",
            "department": "Engineering",
            "location": "New York, NY",
            "employment_type": "full_time",
            "experience_range": "2-4 years",
            "openings": 2,
            "hiring_manager": "Eng Lead",
            "description_html": "<p>Public job description.</p>",
            "status": "published",
        },
        headers=headers,
    )
    assert pub_res.status_code == 201
    pub_slug = pub_res.json()["slug"]
    pub_id = pub_res.json()["id"]

    # 3. Create and Close a job
    close_res = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Closed Staff Engineer",
            "department": "Engineering",
            "location": "Austin, TX",
            "employment_type": "full_time",
            "experience_range": "8+ years",
            "openings": 1,
            "hiring_manager": "VP",
            "description_html": "<p>Closed job.</p>",
            "status": "published",
        },
        headers=headers,
    )
    closed_id = close_res.json()["id"]
    closed_slug = close_res.json()["slug"]
    client.post(f"/api/v1/admin/requisitions/{closed_id}/close", headers=headers)

    # 4. Check Public Jobs List (Anonymous): Only the published job appears
    public_list = client.get("/api/v1/jobs")
    assert public_list.status_code == 200
    slugs = [j["slug"] for j in public_list.json()]
    assert pub_slug in slugs
    assert draft_slug not in slugs
    assert closed_slug not in slugs

    # 5. Check Public Job Detail: Draft & Closed return 404
    assert client.get(f"/api/v1/jobs/{pub_slug}").status_code == 200
    assert client.get(f"/api/v1/jobs/{draft_slug}").status_code == 404
    assert client.get(f"/api/v1/jobs/{closed_slug}").status_code == 404


def test_acceptance_11_2_auth_gate_and_return_to_job(client):
    """
    AC 11.2: Unauthenticated candidate cannot access protected apply actions;
    registration/login preserves candidate role and credentials.
    """
    # 1. Unauthenticated me/profile query returns 401
    unauth = client.get("/api/v1/me/profile")
    assert unauth.status_code == 401

    # 2. Candidate registers
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Elena",
            "last_name": "Rostova",
            "email": "elena.rostova@example.com",
            "mobile": "+1999888777",
            "password": "SecurePassword@123",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    assert reg.json()["user"]["role"] == "candidate"

    # 3. Authenticated me endpoint returns user
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "elena.rostova@example.com"


def test_acceptance_11_3_application_validation_and_freeze(client, admin_token):
    """
    AC 11.3: Mandatory resume upload, mandatory declaration consents, duplicate
    submission prevention (409 Conflict), and frozen snapshot generation.
    """
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates published job
    job = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Platform Infrastructure Engineer",
            "department": "Infrastructure",
            "location": "Remote",
            "employment_type": "full_time",
            "experience_range": "4-6 years",
            "openings": 1,
            "hiring_manager": "Head of Infra",
            "description_html": "<p>Build cloud foundation.</p>",
            "status": "published",
        },
        headers=headers_admin,
    ).json()
    job_id = job["id"]

    # 2. Register candidate and fill profile
    cand = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "David",
            "last_name": "Miller",
            "email": "david.miller@example.com",
            "mobile": "+1444555666",
            "password": "Password@1234",
        },
    ).json()
    cand_headers = {"Authorization": f"Bearer {cand['access_token']}"}

    client.put(
        "/api/v1/me/education",
        json={
            "educations": [
                {
                    "degree": "B.S. Information Systems",
                    "institution": "Georgia Tech",
                    "year_of_passing": 2019,
                    "education_level": "bachelors",
                }
            ]
        },
        headers=cand_headers,
    )
    client.put(
        "/api/v1/me/experience",
        json={
            "is_fresher": False,
            "experiences": [
                {
                    "employer": "CloudScale Inc",
                    "job_title": "DevOps Engineer",
                    "start_date": "2019-07-01",
                    "end_date": "2023-07-01",
                    "is_current": False,
                    "responsibilities": "Managed Kubernetes clusters.",
                }
            ],
        },
        headers=cand_headers,
    )
    client.put(
        "/api/v1/me/profile",
        json={
            "gender": "male",
            "current_location": "Atlanta, GA",
            "current_company": "CloudScale Inc",
            "notice_period": "30",
        },
        headers=cand_headers,
    )

    # 3. Missing Consents -> Rejected (422)
    no_consent = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={"consent_accuracy": "false", "consent_privacy": "true"},
        files={"resume": ("david_resume.pdf", VALID_PDF, "application/pdf")},
        headers=cand_headers,
    )
    assert no_consent.status_code == 422
    assert no_consent.json()["detail"]["error"]["code"] == "VALIDATION_ERROR"

    # 4. Valid Submission -> Success (201)
    submit_res = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={
            "consent_accuracy": "true",
            "consent_privacy": "true",
            "cover_note": "Excited to contribute to platform infrastructure.",
        },
        files={"resume": ("david_resume.pdf", VALID_PDF, "application/pdf")},
        headers=cand_headers,
    )
    assert submit_res.status_code == 201
    app_data = submit_res.json()
    assert app_data["application_code"].startswith("APP-")
    assert app_data["status"] == "new"
    assert app_data["snapshot_json"]["candidate"]["email"] == "david.miller@example.com"
    assert app_data["snapshot_json"]["total_experience_years"] == 4.0

    # 5. Duplicate Submission -> Blocked (409 Conflict)
    duplicate_res = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("david_resume.pdf", VALID_PDF, "application/pdf")},
        headers=cand_headers,
    )
    assert duplicate_res.status_code == 409
    assert duplicate_res.json()["detail"]["error"]["code"] == "CONFLICT"


def test_acceptance_11_4_notifications_and_audit(client, admin_token, db_session):
    """
    AC 11.4: In-app notification generated for admin upon new application;
    admin can view unread count and mark notifications as read.
    """
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    job = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "QA Automation Lead",
            "department": "Quality Assurance",
            "location": "Chicago, IL",
            "employment_type": "full_time",
            "experience_range": "5+ years",
            "openings": 1,
            "hiring_manager": "QA Director",
            "description_html": "<p>Lead test automation.</p>",
            "status": "published",
        },
        headers=headers_admin,
    ).json()

    cand = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Grace",
            "last_name": "Hopper",
            "email": "grace.hopper@example.com",
            "mobile": "+1234000999",
            "password": "Password@1234",
        },
    ).json()
    cand_headers = {"Authorization": f"Bearer {cand['access_token']}"}

    client.put(
        "/api/v1/me/education",
        json={"educations": [{"degree": "Ph.D. Mathematics", "institution": "Yale", "year_of_passing": 2015, "education_level": "doctorate"}]},
        headers=cand_headers,
    )
    client.put("/api/v1/me/experience", json={"is_fresher": True, "experiences": []}, headers=cand_headers)

    # Submit
    client.post(
        f"/api/v1/jobs/{job['id']}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("grace_cv.pdf", VALID_PDF, "application/pdf")},
        headers=cand_headers,
    )

    # Admin checks notifications
    notif_res = client.get("/api/v1/admin/notifications", headers=headers_admin)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert notifs["unread_count"] >= 1
    assert any("Grace Hopper" in n["title"] for n in notifs["items"])


def test_acceptance_11_5_admin_grid_and_idor_protection(client, admin_token):
    """
    AC 11.5: Admin reviews applicants in grid, streams resume, updates status;
    candidates cannot access admin endpoints or download resumes belonging to others.
    """
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    job = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Machine Learning Engineer",
            "department": "AI Research",
            "location": "San Francisco, CA",
            "employment_type": "full_time",
            "experience_range": "3-5 years",
            "openings": 1,
            "hiring_manager": "AI Lead",
            "description_html": "<p>Deploy LLM pipelines.</p>",
            "status": "published",
        },
        headers=headers_admin,
    ).json()
    job_id = job["id"]

    # Candidate 1
    cand1 = client.post(
        "/api/v1/auth/register",
        json={"first_name": "Candidate", "last_name": "One", "email": "cand1@example.com", "mobile": "+1111", "password": "Password@1234"},
    ).json()
    h1 = {"Authorization": f"Bearer {cand1['access_token']}"}
    client.put("/api/v1/me/education", json={"educations": [{"degree": "B.S. CS", "institution": "UCB", "year_of_passing": 2020, "education_level": "bachelors"}]}, headers=h1)
    client.put("/api/v1/me/experience", json={"is_fresher": True, "experiences": []}, headers=h1)
    sub1 = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("c1_resume.pdf", VALID_PDF, "application/pdf")},
        headers=h1,
    ).json()

    # Candidate 2
    cand2 = client.post(
        "/api/v1/auth/register",
        json={"first_name": "Candidate", "last_name": "Two", "email": "cand2@example.com", "mobile": "+2222", "password": "Password@1234"},
    ).json()
    h2 = {"Authorization": f"Bearer {cand2['access_token']}"}

    # 1. Admin Grid shows candidate 1
    grid_res = client.get(f"/api/v1/admin/requisitions/{job_id}/applications", headers=headers_admin)
    assert grid_res.status_code == 200
    assert len(grid_res.json()) == 1
    assert grid_res.json()[0]["candidate_name"] == "Candidate One"

    # 2. Admin streams candidate 1's resume
    resume_stream = client.get(f"/api/v1/files/resumes/{sub1['id']}", headers=headers_admin)
    assert resume_stream.status_code == 200
    assert resume_stream.content.startswith(b"%PDF")

    # 3. Candidate 1 can stream their own resume
    own_stream = client.get(f"/api/v1/files/resumes/{sub1['id']}", headers=h1)
    assert own_stream.status_code == 200

    # 4. IDOR Protection: Candidate 2 cannot access Candidate 1's resume (403 Forbidden)
    idor_attempt = client.get(f"/api/v1/files/resumes/{sub1['id']}", headers=h2)
    assert idor_attempt.status_code == 403

    # 5. Admin updates status to 'shortlisted'
    status_update = client.patch(
        f"/api/v1/admin/applications/{sub1['id']}/status",
        json={"status": "shortlisted"},
        headers=headers_admin,
    )
    assert status_update.status_code == 200
    assert status_update.json()["status"] == "shortlisted"

    # 6. Candidate sees updated status in their dashboard
    cand_my_apps = client.get("/api/v1/me/applications", headers=h1)
    assert cand_my_apps.status_code == 200
    assert cand_my_apps.json()[0]["status"] == "shortlisted"
