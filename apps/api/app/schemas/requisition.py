import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EmploymentType, RequisitionStatus


class RequisitionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=80)
    location: str = Field(..., min_length=1, max_length=120)
    employment_type: EmploymentType
    experience_range: str = Field(..., min_length=1, max_length=40)
    openings: int = Field(..., gt=0)
    hiring_manager: str = Field(..., min_length=1, max_length=120)
    description_html: str = Field(...)
    max_salary_budget: Optional[Decimal] = None
    hiring_complete_by: Optional[date] = None


class RequisitionCreate(RequisitionBase):
    status: Optional[RequisitionStatus] = RequisitionStatus.DRAFT


class RequisitionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    department: Optional[str] = Field(None, min_length=1, max_length=80)
    location: Optional[str] = Field(None, min_length=1, max_length=120)
    employment_type: Optional[EmploymentType] = None
    experience_range: Optional[str] = Field(None, min_length=1, max_length=40)
    openings: Optional[int] = Field(None, gt=0)
    hiring_manager: Optional[str] = Field(None, min_length=1, max_length=120)
    description_html: Optional[str] = None
    max_salary_budget: Optional[Decimal] = None
    hiring_complete_by: Optional[date] = None
    status: Optional[RequisitionStatus] = None


class RequisitionResponse(RequisitionBase):
    id: uuid.UUID
    requisition_code: str
    slug: str
    status: RequisitionStatus
    posted_at: Optional[datetime] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RequisitionAdminResponse(RequisitionResponse):
    application_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PublicJobListItem(BaseModel):
    id: uuid.UUID
    requisition_code: str
    slug: str
    title: str
    department: str
    location: str
    employment_type: EmploymentType
    experience_range: str
    openings: int
    posted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PublicJobDetail(BaseModel):
    id: uuid.UUID
    requisition_code: str
    slug: str
    title: str
    department: str
    location: str
    employment_type: EmploymentType
    experience_range: str
    openings: int
    description_html: str
    posted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RequisitionFilter(BaseModel):
    status: Optional[RequisitionStatus] = None
    department: Optional[str] = None
    q: Optional[str] = None
    skip: int = 0
    limit: int = 100
