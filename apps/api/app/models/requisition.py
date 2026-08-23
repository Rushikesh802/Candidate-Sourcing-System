import uuid
from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Numeric,
    Text,
    Integer,
    ForeignKey,
    Enum as SQLEnum,
    CheckConstraint,
    Index,
    desc,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import RequisitionStatus, EmploymentType


class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requisition_code = Column(String(20), unique=True, index=True, nullable=False)
    slug = Column(String(160), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    department = Column(String(80), nullable=False)
    location = Column(String(120), nullable=False)
    employment_type = Column(
        SQLEnum(EmploymentType, name="employment_type", native_enum=False),
        nullable=False,
    )
    experience_range = Column(String(40), nullable=False)
    openings = Column(Integer, nullable=False)
    hiring_manager = Column(String(120), nullable=False)
    description_html = Column(Text, nullable=False)
    max_salary_budget = Column(Numeric(12, 2), nullable=True)
    hiring_complete_by = Column(Date, nullable=True)
    status = Column(
        SQLEnum(RequisitionStatus, name="requisition_status", native_enum=False),
        nullable=False,
        default=RequisitionStatus.DRAFT,
        index=True,
    )
    posted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Table constraints and indexes
    __table_args__ = (
        CheckConstraint("openings > 0", name="ck_requisitions_openings_positive"),
        Index("ix_requisitions_status_posted_at", "status", desc("posted_at")),
    )

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    applications = relationship(
        "Application", back_populates="requisition", cascade="all, delete-orphan"
    )
