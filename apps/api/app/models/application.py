import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Enum as SQLEnum,
    UniqueConstraint,
    Index,
    JSON,
    desc,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import ApplicationStatus


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_code = Column(String(20), unique=True, index=True, nullable=False)
    requisition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("requisitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    candidate_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(ApplicationStatus, name="application_status", native_enum=False),
        nullable=False,
        default=ApplicationStatus.DRAFT,
        index=True,
    )
    cover_note = Column(Text, nullable=True)
    resume_key = Column(Text, nullable=True)
    resume_filename = Column(String(255), nullable=True)
    resume_content_type = Column(String(80), nullable=True)
    consent_accuracy = Column(Boolean, nullable=False, default=False)
    consent_privacy = Column(Boolean, nullable=False, default=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    snapshot_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint("candidate_id", "requisition_id", name="uq_candidate_requisition"),
        Index("ix_applications_req_submitted", "requisition_id", desc("submitted_at")),
    )

    # Relationships
    requisition = relationship("Requisition", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
