import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import app
from app.models.user import User, PasswordResetToken
from app.models.enums import UserRole
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


def test_register_candidate_success(client, db_session):
    payload = {
        "first_name": "Aarav",
        "last_name": "Patel",
        "email": "aarav.patel@example.com",
        "mobile": "+919876543211",
        "password": "SecurePassword@123",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "aarav.patel@example.com"
    assert data["user"]["role"] == "candidate"
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_register_duplicate_email(client, db_session):
    payload = {
        "first_name": "Aarav",
        "last_name": "Patel",
        "email": "duplicate@example.com",
        "mobile": "+919876543211",
        "password": "SecurePassword@123",
    }
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
    assert r2.json()["detail"]["error"]["code"] == "EMAIL_ALREADY_EXISTS"


def test_login_success(client, db_session):
    # Seed admin user
    bootstrap_admin(db_session)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@talentbridge.local", "password": "Admin@12345"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"
    assert "access_token" in data
    assert "access_token" in response.cookies


def test_login_invalid_password(client, db_session):
    bootstrap_admin(db_session)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@talentbridge.local", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"]["error"]["code"] == "INVALID_CREDENTIALS"


def test_get_me_authenticated(client, db_session):
    register_payload = {
        "first_name": "Rohan",
        "last_name": "Verma",
        "email": "rohan@example.com",
        "mobile": "+919876543212",
        "password": "Password@1234",
    }
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    token = reg_res.json()["access_token"]

    # Test via Authorization Bearer header
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "rohan@example.com"
    assert me_res.json()["role"] == "candidate"


def test_get_me_unauthenticated(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"]["error"]["code"] == "UNAUTHENTICATED"


def test_logout(client):
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"


def test_forgot_and_reset_password_flow(client, db_session):
    # Register user
    reg_payload = {
        "first_name": "Test",
        "last_name": "Reset",
        "email": "reset.user@example.com",
        "mobile": "+919876543213",
        "password": "OldPassword@123",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # Request forgot password
    forgot_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset.user@example.com"},
    )
    assert forgot_res.status_code == 202

    # Check token record in DB
    token_record = db_session.query(PasswordResetToken).first()
    assert token_record is not None

    # Try invalid reset token
    invalid_reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "completely_invalid_token_12345", "new_password": "NewPassword@123"},
    )
    assert invalid_reset.status_code == 400
