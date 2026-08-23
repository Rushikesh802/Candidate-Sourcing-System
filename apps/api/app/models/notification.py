import uuid
from sqlalchemy import (
    Column,
    DateTime,
    Text,
    ForeignKey,
    Enum as SQLEnum,
    Index,
    desc,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import NotificationType


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(
        SQLEnum(NotificationType, name="notification_type", native_enum=False),
        nullable=False,
        default=NotificationType.NEW_APPLICATION,
    )
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    requisition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("requisitions.id", ondelete="SET NULL"),
        nullable=True,
    )
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Indexes
    __table_args__ = (
        Index(
            "ix_notifications_user_read_created",
            "user_id",
            "read_at",
            desc("created_at"),
        ),
    )

    # Relationships
    user = relationship("User", back_populates="notifications")
    requisition = relationship("Requisition")
    application = relationship("Application")
