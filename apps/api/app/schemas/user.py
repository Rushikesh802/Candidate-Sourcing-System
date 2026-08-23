import re
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import UserRole

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class UserBase(BaseModel):
    email: str = Field(..., max_length=255)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    mobile: str = Field(..., min_length=5, max_length=20)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address format")
        return v


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    id: uuid.UUID
    role: UserRole
    created_at: datetime
    email_verified_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
