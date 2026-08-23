import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.application import (
    ApplicationDraftSave,
    ApplicationResponse,
    CandidateApplicationListItem,
    CandidateApplicationDetail,
)
from app.services import application as application_service

router = APIRouter(tags=["Candidate Applications"])


# ---------------------------------------------------------------------------
# Job Application Draft & Submit Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/jobs/{job_id}/applications/draft",
    response_model=Optional[ApplicationResponse],
)
def get_job_application_draft(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve existing application draft for job posting if any."""
    draft = application_service.get_or_create_draft(db, current_user, job_id)
    return draft


@router.post(
    "/jobs/{job_id}/applications/draft",
    response_model=ApplicationResponse,
)
def save_job_application_draft(
    job_id: uuid.UUID,
    payload: ApplicationDraftSave,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save or update application draft progress."""
    return application_service.save_draft(db, current_user, job_id, payload)


@router.post(
    "/jobs/{job_id}/applications",
    status_code=status.HTTP_201_CREATED,
    response_model=ApplicationResponse,
)
async def submit_job_application(
    job_id: uuid.UUID,
    resume: UploadFile = File(...),
    cover_note: Optional[str] = Form(None),
    consent_accuracy: bool = Form(...),
    consent_privacy: bool = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Final application submission with mandatory resume, cover note, and consents."""
    file_bytes = await resume.read()
    app = application_service.submit_application(
        db=db,
        user=current_user,
        requisition_id=job_id,
        resume_bytes=file_bytes,
        filename=resume.filename or "resume.pdf",
        content_type=resume.content_type or "application/pdf",
        cover_note=cover_note,
        consent_accuracy=consent_accuracy,
        consent_privacy=consent_privacy,
    )
    return app


# ---------------------------------------------------------------------------
# Candidate "My Applications" Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/me/applications",
    response_model=List[CandidateApplicationListItem],
)
def list_candidate_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all job applications submitted by the current candidate."""
    apps = application_service.get_candidate_applications(db, current_user)
    result = []
    for app in apps:
        result.append(
            CandidateApplicationListItem(
                id=app.id,
                application_code=app.application_code,
                requisition_id=app.requisition_id,
                requisition_title=app.requisition.title,
                requisition_code=app.requisition.requisition_code,
                requisition_slug=app.requisition.slug,
                department=app.requisition.department,
                location=app.requisition.location,
                employment_type=app.requisition.employment_type.value,
                status=app.status,
                submitted_at=app.submitted_at,
                created_at=app.created_at,
            )
        )
    return result


@router.get(
    "/me/applications/{application_id}",
    response_model=CandidateApplicationDetail,
)
def get_candidate_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve details and frozen profile snapshot of candidate's application."""
    app = application_service.get_candidate_application_detail(db, current_user, application_id)
    return CandidateApplicationDetail(
        id=app.id,
        application_code=app.application_code,
        requisition_id=app.requisition_id,
        requisition_title=app.requisition.title,
        requisition_code=app.requisition.requisition_code,
        requisition_slug=app.requisition.slug,
        department=app.requisition.department,
        location=app.requisition.location,
        employment_type=app.requisition.employment_type.value,
        status=app.status,
        submitted_at=app.submitted_at,
        resume_filename=app.resume_filename,
        cover_note=app.cover_note,
        snapshot_json=app.snapshot_json,
        created_at=app.created_at,
    )
