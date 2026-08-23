from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationReadRequest,
    NotificationReadResponse,
    NotificationResponse,
)
from app.services import notification as notification_service

router = APIRouter(prefix="/admin/notifications", tags=["Admin Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_admin_notifications(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List in-app notifications and unread count for current administrator."""
    items, unread_count = notification_service.get_admin_notifications(
        db=db, admin_id=current_user.id, limit=limit
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        unread_count=unread_count,
    )


@router.post("/read", response_model=NotificationReadResponse)
def mark_admin_notifications_read(
    payload: NotificationReadRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Mark specific or all notifications as read."""
    marked, unread = notification_service.mark_notifications_read(
        db=db,
        admin_id=current_user.id,
        notification_ids=payload.notification_ids,
        mark_all=payload.mark_all,
    )
    return NotificationReadResponse(
        marked_count=marked,
        unread_count=unread,
    )
