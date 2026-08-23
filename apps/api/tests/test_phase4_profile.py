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
from app.models.user import User, CandidateProfile, Education, Experience
from app.models.enums import UserRole, Gender, NoticePeriod, EducationLevel
from app.services.profile import calculate_experience_years


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
def candidate_auth(client):
    reg_payload = {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@example.com",
        "mobile": "+1234567890",
        "password": "Password@1234",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    return {
        "user_id": data["user"]["id"],
        "token": data["access_token"],
        "email": "jane.doe@example.com",
    }


def test_experience_years_calculation():
    # Test single experience of 1 year
    class MockExp:
        def __init__(self, start, end, is_current=False):
            self.start_date = start
            self.end_date = end
            self.is_current = is_current

    # 1 year (365 days)
    exp1 = MockExp(date(2022, 1, 1), date(2023, 1, 1))
    assert calculate_experience_years([exp1]) == 1.0

    # Overlapping 2 experiences: (2020-01-01 to 2021-01-01) and (2020-06-01 to 2022-01-01) = 2 years total
    exp_a = MockExp(date(2020, 1, 1), date(2021, 1, 1))
    exp_b = MockExp(date(2020, 6, 1), date(2022, 1, 1))
    assert calculate_experience_years([exp_a, exp_b]) == 2.0

    # Empty
    assert calculate_experience_years([]) == 0.0


def test_get_profile_unauthenticated(client):
    client.cookies.clear()
    response = client.get("/api/v1/me/profile")
    assert response.status_code == 401
    assert response.json()["detail"]["error"]["code"] == "UNAUTHENTICATED"


def test_get_and_update_candidate_profile(client, candidate_auth):
    headers = {"Authorization": f"Bearer {candidate_auth['token']}"}

    # GET profile
    res = client.get("/api/v1/me/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == candidate_auth["email"]
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Doe"
    assert data["is_fresher"] is False

    # PUT profile
    update_payload = {
        "first_name": "Janet",
        "last_name": "Smith",
        "mobile": "+9876543210",
        "gender": "female",
        "date_of_birth": "1998-05-15",
        "current_location": "Bangalore, India",
        "current_company": "Tech Corp",
        "notice_period": "30",
        "current_address": "123 Tech Park, Whitefield",
    }
    res = client.put("/api/v1/me/profile", json=update_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["first_name"] == "Janet"
    assert data["last_name"] == "Smith"
    assert data["mobile"] == "+9876543210"
    assert data["gender"] == "female"
    assert data["date_of_birth"] == "1998-05-15"
    assert data["current_location"] == "Bangalore, India"
    assert data["notice_period"] == "30"


def test_profile_validation_errors(client, candidate_auth):
    headers = {"Authorization": f"Bearer {candidate_auth['token']}"}

    # Future date of birth
    future_date = f"{datetime.now().year + 1}-01-01"
    res = client.put("/api/v1/me/profile", json={"date_of_birth": future_date}, headers=headers)
    assert res.status_code == 422

    # Invalid mobile format
    res = client.put("/api/v1/me/profile", json={"mobile": "invalid-phone!!"}, headers=headers)
    assert res.status_code == 422


def test_education_crud_and_validation(client, candidate_auth):
    headers = {"Authorization": f"Bearer {candidate_auth['token']}"}

    # PUT education
    edu_payload = {
        "educations": [
            {
                "degree": "B.Tech in Computer Science",
                "specialization": "Software Engineering",
                "institution": "National Institute of Technology",
                "year_of_passing": 2021,
                "grade": "8.8 CGPA",
                "education_level": "bachelors",
                "sort_order": 0,
            },
            {
                "degree": "Higher Secondary (12th)",
                "specialization": "Science PCM",
                "institution": "Delhi Public School",
                "year_of_passing": 2017,
                "grade": "92%",
                "education_level": "high_school",
                "sort_order": 1,
            },
        ]
    }
    res = client.put("/api/v1/me/education", json=edu_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["educations"]) == 2
    assert data["educations"][0]["degree"] == "B.Tech in Computer Science"
    assert data["educations"][1]["education_level"] == "high_school"

    # GET education
    res = client.get("/api/v1/me/education", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["educations"]) == 2

    # Validation: future passing year
    invalid_edu = {
        "educations": [
            {
                "degree": "MS",
                "institution": "Stanford",
                "year_of_passing": datetime.now().year + 5,
                "education_level": "masters",
            }
        ]
    }
    res = client.put("/api/v1/me/education", json=invalid_edu, headers=headers)
    assert res.status_code == 422


def test_experience_crud_derived_years_and_fresher(client, candidate_auth):
    headers = {"Authorization": f"Bearer {candidate_auth['token']}"}

    # PUT experience with 2 roles
    exp_payload = {
        "is_fresher": False,
        "experiences": [
            {
                "employer": "Acme Software",
                "job_title": "Software Engineer",
                "start_date": "2022-01-01",
                "end_date": "2024-01-01",
                "is_current": False,
                "responsibilities": "Building scalable REST APIs",
            },
            {
                "employer": "Tech Innovations",
                "job_title": "Senior Engineer",
                "start_date": "2024-01-02",
                "is_current": True,
                "responsibilities": "Leading backend infrastructure",
            },
        ],
    }
    res = client.put("/api/v1/me/experience", json=exp_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_fresher"] is False
    assert len(data["experiences"]) == 2
    assert data["total_experience_years"] >= 2.0

    # GET experience
    res = client.get("/api/v1/me/experience", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["experiences"]) == 2

    # GET profile verifies derived years
    res = client.get("/api/v1/me/profile", headers=headers)
    assert res.status_code == 200
    assert res.json()["total_experience_years"] >= 2.0

    # Switch to Fresher
    fresher_payload = {"is_fresher": True, "experiences": []}
    res = client.put("/api/v1/me/experience", json=fresher_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_fresher"] is True
    assert data["total_experience_years"] == 0.0
    assert len(data["experiences"]) == 0


def test_experience_validation_dates(client, candidate_auth):
    headers = {"Authorization": f"Bearer {candidate_auth['token']}"}

    # End date before start date
    invalid_dates = {
        "is_fresher": False,
        "experiences": [
            {
                "employer": "Acme",
                "job_title": "Dev",
                "start_date": "2023-05-01",
                "end_date": "2022-05-01",
                "is_current": False,
            }
        ],
    }
    res = client.put("/api/v1/me/experience", json=invalid_dates, headers=headers)
    assert res.status_code == 422

    # Future start date
    future_start = {
        "is_fresher": False,
        "experiences": [
            {
                "employer": "Acme",
                "job_title": "Dev",
                "start_date": f"{datetime.now().year + 1}-01-01",
                "is_current": True,
            }
        ],
    }
    res = client.put("/api/v1/me/experience", json=future_start, headers=headers)
    assert res.status_code == 422


def test_photo_upload_retrieve_delete(client, candidate_auth):
    headers = {"Authorization": f"Bearer {candidate_auth['token']}"}

    # 1. Upload valid 1x1 PNG image
    png_1x1 = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06"
        b"\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
        b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    res = client.post(
        "/api/v1/me/photo",
        files={"file": ("avatar.png", png_1x1, "image/png")},
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "photo_url" in data
    assert f"/api/v1/files/photos/{candidate_auth['user_id']}" in data["photo_url"]

    # 2. Retrieve photo from public/file endpoint
    photo_res = client.get(f"/api/v1/files/photos/{candidate_auth['user_id']}")
    assert photo_res.status_code == 200
    assert photo_res.headers["content-type"] == "image/png"
    assert len(photo_res.content) == len(png_1x1)

    # 3. Invalid photo upload (text file with fake mime type)
    bad_res = client.post(
        "/api/v1/me/photo",
        files={"file": ("fake.png", b"Hello this is not png", "image/png")},
        headers=headers,
    )
    assert bad_res.status_code == 422
    assert bad_res.json()["detail"]["error"]["code"] == "VALIDATION_ERROR"

    # 4. Delete photo
    del_res = client.delete("/api/v1/me/photo", headers=headers)
    assert del_res.status_code == 200

    # 5. File endpoint now returns 404
    after_del = client.get(f"/api/v1/files/photos/{candidate_auth['user_id']}")
    assert after_del.status_code == 404
