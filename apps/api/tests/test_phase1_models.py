import pytest
from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.security import get_password_hash, verify_password
from app.models import (
    User,
    CandidateProfile,
    Education,
    Experience,
    Requisition,
    Application,
    Notification,
    PasswordResetToken,
    UserRole,
    Gender,
    NoticePeriod,
    EducationLevel,
    RequisitionStatus,
    EmploymentType,
    ApplicationStatus,
    NotificationType,
)
from app.services.bootstrap import bootstrap_admin, seed_demo_data


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_password_hashing():
    raw_password = "SecretPassword@123"
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_user_and_profile_creation(db_session):
    user = User(
        email="test.candidate@example.com",
        password_hash=get_password_hash("Pass@123"),
        role=UserRole.CANDIDATE,
        first_name="John",
        last_name="Doe",
        mobile="+1234567890",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.role == UserRole.CANDIDATE

    profile = CandidateProfile(
        user_id=user.id,
        gender=Gender.MALE,
        date_of_birth=date(1995, 1, 1),
        current_location="San Francisco, CA",
        current_company="Acme Corp",
        notice_period=NoticePeriod.DAYS_30,
        current_address="100 Market St",
        is_fresher=False,
        total_experience_years=Decimal("3.5"),
    )
    db_session.add(profile)
    db_session.commit()

    # Verify relationship
    assert user.profile is not None
    assert user.profile.current_location == "San Francisco, CA"
    assert user.profile.user.email == "test.candidate@example.com"


def test_education_and_experience_relationships(db_session):
    user = User(
        email="student@example.com",
        password_hash=get_password_hash("Pass@123"),
        role=UserRole.CANDIDATE,
        first_name="Jane",
        last_name="Smith",
        mobile="+1987654321",
    )
    db_session.add(user)
    db_session.commit()

    edu = Education(
        user_id=user.id,
        degree="B.S. in Computer Science",
        institution="Stanford University",
        year_of_passing=2020,
        education_level=EducationLevel.BACHELORS,
        sort_order=1,
    )
    exp = Experience(
        user_id=user.id,
        employer="Google",
        job_title="Software Engineer",
        start_date=date(2020, 6, 1),
        is_current=True,
    )
    db_session.add_all([edu, exp])
    db_session.commit()
    db_session.refresh(user)

    assert len(user.educations) == 1
    assert user.educations[0].degree == "B.S. in Computer Science"
    assert len(user.experiences) == 1
    assert user.experiences[0].employer == "Google"


def test_requisition_and_application(db_session):
    admin = User(
        email="admin@test.com",
        password_hash=get_password_hash("AdminPass@123"),
        role=UserRole.ADMIN,
        first_name="Admin",
        last_name="User",
        mobile="+1112223333",
    )
    candidate = User(
        email="candidate@test.com",
        password_hash=get_password_hash("CandPass@123"),
        role=UserRole.CANDIDATE,
        first_name="Candidate",
        last_name="User",
        mobile="+1112224444",
    )
    db_session.add_all([admin, candidate])
    db_session.commit()

    req = Requisition(
        requisition_code="REQ-2026-00001",
        slug="software-engineer-2026-00001",
        title="Software Engineer",
        department="Engineering",
        location="Remote",
        employment_type=EmploymentType.FULL_TIME,
        experience_range="2-4 years",
        openings=2,
        hiring_manager="Tech Lead",
        description_html="<p>Job description</p>",
        status=RequisitionStatus.PUBLISHED,
        created_by=admin.id,
    )
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)

    app = Application(
        application_code="APP-10001",
        requisition_id=req.id,
        candidate_id=candidate.id,
        status=ApplicationStatus.NEW,
        resume_key="resumes/resume-1.pdf",
        resume_filename="resume.pdf",
        consent_accuracy=True,
        consent_privacy=True,
        submitted_at=datetime.now(timezone.utc),
        snapshot_json={"name": "Candidate User", "experience_years": 3.0},
    )
    db_session.add(app)
    db_session.commit()
    db_session.refresh(req)

    assert len(req.applications) == 1
    assert req.applications[0].application_code == "APP-10001"
    assert req.applications[0].candidate.email == "candidate@test.com"


def test_bootstrap_admin_idempotency(db_session):
    # First bootstrap
    admin1 = bootstrap_admin(db_session)
    assert admin1.role == UserRole.ADMIN
    
    # Second bootstrap should not raise error and return existing user
    admin2 = bootstrap_admin(db_session)
    assert admin1.id == admin2.id

    users_count = db_session.query(User).filter(User.role == UserRole.ADMIN).count()
    assert users_count == 1


def test_seed_demo_data(db_session):
    admin = bootstrap_admin(db_session)
    seed_demo_data(db_session, admin)

    # Verify seed candidate exists
    candidate = db_session.query(User).filter(User.email == "priya@example.com").first()
    assert candidate is not None
    assert candidate.profile is not None
    assert len(candidate.educations) >= 1
    assert len(candidate.experiences) >= 1

    # Verify seed requisitions exist
    reqs = db_session.query(Requisition).filter(Requisition.status == RequisitionStatus.PUBLISHED).all()
    assert len(reqs) >= 2
