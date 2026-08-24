import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from app.models.enums import ApplicationStatus


class ApplicationDraftSave(BaseModel):
    cover_note: Optional[str] = None
    last_active_step: Optional[int] = 1


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    application_code: str
    requisition_id: uuid.UUID
    candidate_id: uuid.UUID
    status: ApplicationStatus
    cover_note: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_content_type: Optional[str] = None
    consent_accuracy: bool
    consent_privacy: bool
    submitted_at: Optional[datetime] = None
    snapshot_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateApplicationListItem(BaseModel):
    id: uuid.UUID
    application_code: str
    requisition_id: uuid.UUID
    requisition_title: str
    requisition_code: str
    requisition_slug: str
    department: str
    location: str
    employment_type: str
    status: ApplicationStatus
    submitted_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateApplicationDetail(BaseModel):
    id: uuid.UUID
    application_code: str
    requisition_id: uuid.UUID
    requisition_title: str
    requisition_code: str
    requisition_slug: str
    department: str
    location: str
    employment_type: str
    status: ApplicationStatus
    submitted_at: Optional[datetime] = None
    resume_filename: Optional[str] = None
    cover_note: Optional[str] = None
    snapshot_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminApplicationListItem(BaseModel):
    id: uuid.UUID
    application_code: str
    requisition_id: uuid.UUID
    requisition_title: str
    requisition_code: str
    candidate_id: uuid.UUID
    candidate_name: str
    candidate_email: str
    candidate_mobile: Optional[str] = None
    candidate_location: Optional[str] = None
    total_experience_years: float = 0.0
    status: ApplicationStatus
    resume_filename: Optional[str] = None
    resume_url: str
    submitted_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RequisitionSummary(BaseModel):
    id: uuid.UUID
    title: str
    requisition_code: str
    slug: str
    department: str
    location: str
    employment_type: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class AdminApplicationDetail(BaseModel):
    id: uuid.UUID
    application_code: str
    requisition_id: uuid.UUID
    requisition: RequisitionSummary
    candidate_id: uuid.UUID
    candidate_name: str
    candidate_email: str
    candidate_mobile: Optional[str] = None
    candidate_location: Optional[str] = None
    total_experience_years: float = 0.0
    status: ApplicationStatus
    cover_note: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_content_type: Optional[str] = None
    resume_url: str
    consent_accuracy: bool
    consent_privacy: bool
    submitted_at: Optional[datetime] = None
    snapshot_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus

