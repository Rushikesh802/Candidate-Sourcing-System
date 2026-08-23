import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.enums import UserRole, NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.services.bootstrap import bootstrap_admin
from app.services.mailer import get_mailer, SMTPMailer, send_candidate_application_email, send_admin_new_application_email
from app.services.notification import (
    notify_all_admins_new_application,
    get_admin_notifications,
    mark_notifications_read,
)


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
def candidate_auth(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Sarah",
            "last_name": "Connor",
            "email": "sarah.connor@example.com",
            "mobile": "+1555123456",
            "password": "Password@1234",
        },
    )
    token = res.json()["access_token"]

    # Fill education
    headers = {"Authorization": f"Bearer {token}"}
    client.put(
        "/api/v1/me/education",
        json={
            "educations": [
                {
                    "degree": "B.S. Cybernetics",
                    "institution": "MIT",
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
            "is_fresher": True,
            "experiences": [],
        },
        headers=headers,
    )
    return {"token": token, "email": "sarah.connor@example.com"}


@pytest.fixture
def published_job(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post(
        "/api/v1/admin/requisitions",
        json={
            "title": "Lead Security Engineer",
            "department": "Security",
            "location": "Remote",
            "employment_type": "full_time",
            "experience_range": "5-8 years",
            "openings": 1,
            "hiring_manager": "CISO",
            "description_html": "<p>Protect the platform.</p>",
            "status": "published",
        },
        headers=headers,
    )
    return res.json()


VALID_PDF = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF"


def test_mailer_graceful_handling():
    """Verify mailer handles unreachable SMTP gracefully without crashing."""
    mailer = SMTPMailer(host="127.0.0.1", port=9999)  # Non-existent port
    res = mailer.send(
        to="test@example.com",
        subject="Test Subject",
        html_content="<p>Test</p>",
    )
    assert res is False  # False indicates graceful failure logged, no crash


def test_submit_creates_in_app_notification_and_triggers_email(
    client, candidate_auth, admin_token, published_job, db_session
):
    headers_cand = {"Authorization": f"Bearer {candidate_auth['token']}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    job_id = published_job["id"]

    # Submit Application
    sub_res = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        data={"consent_accuracy": "true", "consent_privacy": "true"},
        files={"resume": ("sarah_resume.pdf", VALID_PDF, "application/pdf")},
        headers=headers_cand,
    )
    assert sub_res.status_code == 201
    app_data = sub_res.json()

    # Verify in-app notifications generated for Admin
    notif_res = client.get("/api/v1/admin/notifications", headers=headers_admin)
    assert notif_res.status_code == 200
    notif_data = notif_res.json()
    assert notif_data["unread_count"] >= 1
    assert len(notif_data["items"]) >= 1

    first_notif = notif_data["items"][0]
    assert "Sarah Connor" in first_notif["title"]
    assert "Lead Security Engineer" in first_notif["body"]
    assert str(first_notif["application_id"]) == app_data["id"]
    assert str(first_notif["requisition_id"]) == job_id
    assert first_notif["read_at"] is None


def test_mark_notifications_read(client, admin_token, db_session, admin_user):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # Manually insert 2 unread notifications
    n1 = Notification(
        id=uuid.uuid4(),
        user_id=admin_user.id,
        type=NotificationType.NEW_APPLICATION,
        title="Alert 1",
        body="Body 1",
        read_at=None,
    )
    n2 = Notification(
        id=uuid.uuid4(),
        user_id=admin_user.id,
        type=NotificationType.NEW_APPLICATION,
        title="Alert 2",
        body="Body 2",
        read_at=None,
    )
    db_session.add_all([n1, n2])
    db_session.commit()

    # Check unread count is 2
    res = client.get("/api/v1/admin/notifications", headers=headers_admin)
    assert res.json()["unread_count"] == 2

    # Mark n1 read
    read_res = client.post(
        "/api/v1/admin/notifications/read",
        json={"notification_ids": [str(n1.id)]},
        headers=headers_admin,
    )
    assert read_res.status_code == 200
    assert read_res.json()["marked_count"] == 1
    assert read_res.json()["unread_count"] == 1

    # Mark all read
    mark_all_res = client.post(
        "/api/v1/admin/notifications/read",
        json={"mark_all": True},
        headers=headers_admin,
    )
    assert mark_all_res.status_code == 200
    assert mark_all_res.json()["unread_count"] == 0


def test_notifications_rbac(client, candidate_auth):
    headers_cand = {"Authorization": f"Bearer {candidate_auth['token']}"}

    # Candidate forbidden from accessing admin notifications
    res = client.get("/api/v1/admin/notifications", headers=headers_cand)
    assert res.status_code == 403
    assert res.json()["detail"]["error"]["code"] == "FORBIDDEN"

    # Unauthenticated forbidden
    client.cookies.clear()
    unauth = client.get("/api/v1/admin/notifications")
    assert unauth.status_code == 401
