import uuid
import logging
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.notification import Notification
from app.models.user import User
from app.models.application import Application
from app.models.requisition import Requisition
from app.models.enums import NotificationType, UserRole

logger = logging.getLogger(__name__)


def notify_all_admins_new_application(
    db: Session,
    application: Application,
    requisition: Requisition,
    candidate: User,
) -> List[Notification]:
    """
    Create in-app notifications for all system admins when a new candidate application is submitted.
    """
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    created_notifications = []

    title = f"New application: {candidate.first_name} {candidate.last_name}"
    body = (
        f"{candidate.first_name} {candidate.last_name} submitted an application for "
        f"{requisition.title} ({requisition.requisition_code})."
    )

    for admin in admins:
        notif = Notification(
            id=uuid.uuid4(),
            user_id=admin.id,
            type=NotificationType.NEW_APPLICATION,
            title=title,
            body=body,
            requisition_id=requisition.id,
            application_id=application.id,
            read_at=None,
        )
        db.add(notif)
        created_notifications.append(notif)

    try:
        db.commit()
        logger.info(f"Created {len(created_notifications)} in-app notifications for admins.")
    except Exception as e:
        logger.warning(f"Failed to persist admin in-app notifications: {e}")
        db.rollback()

    return created_notifications


def get_admin_notifications(
    db: Session,
    admin_id: uuid.UUID,
    limit: int = 50,
) -> Tuple[List[Notification], int]:
    """Retrieve notifications list and unread count for an admin user."""
    items = (
        db.query(Notification)
        .filter(Notification.user_id == admin_id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
        .all()
    )

    unread_count = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.user_id == admin_id,
            Notification.read_at.is_(None),
        )
        .scalar()
        or 0
    )

    return items, unread_count


def mark_notifications_read(
    db: Session,
    admin_id: uuid.UUID,
    notification_ids: Optional[List[uuid.UUID]] = None,
    mark_all: bool = False,
) -> Tuple[int, int]:
    """Mark specific or all unread notifications as read for an admin."""
    query = db.query(Notification).filter(
        Notification.user_id == admin_id,
        Notification.read_at.is_(None),
    )

    if not mark_all and notification_ids:
        query = query.filter(Notification.id.in_(notification_ids))

    now = func.now()
    marked_count = query.update({Notification.read_at: now}, synchronize_session="fetch")
    db.commit()

    unread_count = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.user_id == admin_id,
            Notification.read_at.is_(None),
        )
        .scalar()
        or 0
    )

    return marked_count, unread_count
