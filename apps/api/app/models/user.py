import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Date,
    DateTime,
    Numeric,
    Text,
    Integer,
    ForeignKey,
    Enum as SQLEnum,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import UserRole, Gender, NoticePeriod, EducationLevel


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(
        SQLEnum(UserRole, name="user_role", native_enum=False),
        nullable=False,
        default=UserRole.CANDIDATE,
        index=True,
    )
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    mobile = Column(String(20), nullable=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    profile = relationship(
        "CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    educations = relationship(
        "Education", back_populates="user", cascade="all, delete-orphan", order_by="Education.sort_order"
    )
    experiences = relationship(
        "Experience", back_populates="user", cascade="all, delete-orphan", order_by="desc(Experience.start_date)"
    )
    applications = relationship(
        "Application", back_populates="candidate", cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    gender = Column(SQLEnum(Gender, name="gender", native_enum=False), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    current_location = Column(String(120), nullable=True)
    current_company = Column(String(120), nullable=True)
    notice_period = Column(
        SQLEnum(NoticePeriod, name="notice_period", native_enum=False), nullable=True
    )
    current_address = Column(Text, nullable=True)
    photo_key = Column(Text, nullable=True)
    is_fresher = Column(Boolean, nullable=False, default=False)
    total_experience_years = Column(Numeric(4, 1), nullable=False, default=0.0)

    # Relationship
    user = relationship("User", back_populates="profile")


class Education(Base):
    __tablename__ = "educations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    degree = Column(String(120), nullable=False)
    specialization = Column(String(120), nullable=True)
    institution = Column(String(200), nullable=False)
    year_of_passing = Column(Integer, nullable=False)
    grade = Column(String(40), nullable=True)
    education_level = Column(
        SQLEnum(EducationLevel, name="education_level", native_enum=False),
        nullable=False,
    )
    sort_order = Column(Integer, default=0)

    # Relationship
    user = relationship("User", back_populates="educations")


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employer = Column(String(200), nullable=False)
    job_title = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False, nullable=False)
    responsibilities = Column(String(1000), nullable=True)

    # Relationship
    user = relationship("User", back_populates="experiences")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash = Column(Text, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="password_reset_tokens")
