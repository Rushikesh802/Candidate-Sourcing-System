import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.enums import NotificationType


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    title: str
    body: str
    requisition_id: Optional[uuid.UUID] = None
    application_id: Optional[uuid.UUID] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int


class NotificationReadRequest(BaseModel):
    notification_ids: Optional[List[uuid.UUID]] = None
    mark_all: bool = False


class NotificationReadResponse(BaseModel):
    marked_count: int
    unread_count: int
