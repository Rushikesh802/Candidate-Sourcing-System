import logging
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, CandidateProfile, Education, Experience
from app.models.requisition import Requisition
from app.models.enums import (
    UserRole,
    Gender,
    NoticePeriod,
    EducationLevel,
    EmploymentType,
    RequisitionStatus,
)

logger = logging.getLogger(__name__)


def bootstrap_admin(db: Session) -> User:
    """Idempotently bootstrap the default admin user from environment variables."""
    admin_email = settings.ADMIN_EMAIL.strip().lower()
    admin = db.query(User).filter(User.email == admin_email).first()

    if not admin:
        logger.info(f"Creating default admin user: {admin_email}")
        admin = User(
            email=admin_email,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            first_name="System",
            last_name="Administrator",
            mobile="+1234567890",
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        logger.info("Default admin user created successfully.")
    else:
        # Ensure role is admin
        if admin.role != UserRole.ADMIN:
            admin.role = UserRole.ADMIN
            db.commit()
            db.refresh(admin)
        logger.info(f"Admin user already exists: {admin_email}")

    return admin


def seed_demo_data(db: Session, admin_user: User = None) -> None:
    """Optional idempotent demo data seeder for test candidate and sample jobs."""
    # 1. Seed demo candidate
    cand_email = "priya@example.com"
    candidate = db.query(User).filter(User.email == cand_email).first()

    if not candidate:
        logger.info(f"Creating seed candidate: {cand_email}")
        candidate = User(
            email=cand_email,
            password_hash=get_password_hash("Candidate@123"),
            role=UserRole.CANDIDATE,
            first_name="Priya",
            last_name="Sharma",
            mobile="+919876543210",
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(candidate)
        db.flush()

        # Candidate Profile
        profile = CandidateProfile(
            user_id=candidate.id,
            gender=Gender.FEMALE,
            date_of_birth=date(1996, 5, 14),
            current_location="Bangalore, India",
            current_company="Tech Solutions Ltd",
            notice_period=NoticePeriod.DAYS_30,
            current_address="123 Indiranagar, Bangalore 560038",
            is_fresher=False,
            total_experience_years=Decimal("4.5"),
        )
        db.add(profile)

        # Educations
        edu1 = Education(
            user_id=candidate.id,
            degree="Bachelor of Technology",
            specialization="Computer Science & Engineering",
            institution="National Institute of Technology",
            year_of_passing=2018,
            grade="8.8 CGPA",
            education_level=EducationLevel.BACHELORS,
            sort_order=1,
        )
        db.add(edu1)

        # Experience
        exp1 = Experience(
            user_id=candidate.id,
            employer="Tech Solutions Ltd",
            job_title="Senior Software Engineer",
            start_date=date(2021, 1, 15),
            end_date=None,
            is_current=True,
            responsibilities="Architecting high-scale Python microservices and React web applications.",
        )
        exp2 = Experience(
            user_id=candidate.id,
            employer="StartUp Labs",
            job_title="Software Developer",
            start_date=date(2018, 7, 1),
            end_date=date(2020, 12, 31),
            is_current=False,
            responsibilities="Full stack web development using Python, PostgreSQL, and JavaScript.",
        )
        db.add_all([exp1, exp2])
        db.commit()
        logger.info("Demo candidate created.")

    # 2. Seed published sample jobs
    admin_id = admin_user.id if admin_user else None

    req1_code = "REQ-2026-00101"
    req1 = db.query(Requisition).filter(Requisition.requisition_code == req1_code).first()
    if not req1:
        req1 = Requisition(
            requisition_code=req1_code,
            slug="senior-full-stack-engineer-2026-00101",
            title="Senior Full Stack Engineer",
            department="Engineering",
            location="Remote / Bangalore",
            employment_type=EmploymentType.FULL_TIME,
            experience_range="4-8 years",
            openings=3,
            hiring_manager="Alex Morgan (Director of Engineering)",
            description_html="""<h3>About the Role</h3>
<p>We are looking for an experienced Senior Full Stack Engineer to lead development on our core enterprise platforms.</p>
<h4>Key Responsibilities:</h4>
<ul>
<li>Design and build scalable RESTful APIs using Python and FastAPI.</li>
<li>Develop responsive web interfaces with Next.js, React, and Tailwind CSS.</li>
<li>Collaborate with cross-functional teams to deliver critical product features.</li>
</ul>
<h4>Requirements:</h4>
<ul>
<li>4+ years of hands-on software development experience.</li>
<li>Strong proficiency with modern Python and TypeScript.</li>
<li>Experience with PostgreSQL, Docker, and cloud deployments.</li>
</ul>""",
            max_salary_budget=Decimal("3500000.00"),
            hiring_complete_by=date(2026, 11, 30),
            status=RequisitionStatus.PUBLISHED,
            posted_at=datetime.now(timezone.utc),
            created_by=admin_id,
        )
        db.add(req1)

    req2_code = "REQ-2026-00102"
    req2 = db.query(Requisition).filter(Requisition.requisition_code == req2_code).first()
    if not req2:
        req2 = Requisition(
            requisition_code=req2_code,
            slug="lead-product-designer-2026-00102",
            title="Lead Product Designer",
            department="Design",
            location="Bangalore",
            employment_type=EmploymentType.FULL_TIME,
            experience_range="5-9 years",
            openings=1,
            hiring_manager="Sophia Vance (VP Product)",
            description_html="""<h3>About the Role</h3>
<p>Lead end-to-end user experience and interface design for our candidate and recruiter sourcing suite.</p>
<h4>Requirements:</h4>
<ul>
<li>5+ years of digital product design experience.</li>
<li>Mastery of Figma, design systems, and rapid prototyping.</li>
<li>Strong portfolio showcasing user journeys and UI design craft.</li>
</ul>""",
            max_salary_budget=Decimal("3000000.00"),
            hiring_complete_by=date(2026, 10, 15),
            status=RequisitionStatus.PUBLISHED,
            posted_at=datetime.now(timezone.utc),
            created_by=admin_id,
        )
        db.add(req2)

    db.commit()
    logger.info("Sample requisitions seeded.")


def init_db(db: Session) -> None:
    """Run all database bootstrap routines."""
    admin = bootstrap_admin(db)
    seed_demo_data(db, admin)
