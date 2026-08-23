import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, CandidateProfile
from app.models.application import Application
from app.models.enums import UserRole
from app.services.storage import get_storage

router = APIRouter(prefix="/files", tags=["Files"])


@router.get("/photos/{user_id}")
def get_user_photo(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Serve candidate profile photo."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile or not profile.photo_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "User photo not found",
                }
            },
        )

    storage = get_storage()
    try:
        stream = storage.get(profile.photo_key)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Photo file missing from storage",
                }
            },
        )

    media_type = "image/png" if profile.photo_key.endswith(".png") else "image/jpeg"
    return StreamingResponse(
        stream,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400",
        },
    )


@router.get("/resumes/{application_id}")
def get_application_resume(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download or stream application resume file (admin or applicant owner)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Application record not found",
                }
            },
        )

    # Authz check: Admin or Application Owner
    if current_user.role != UserRole.ADMIN and application.candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You do not have permission to access this resume",
                }
            },
        )

    if not application.resume_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "No resume file associated with this application",
                }
            },
        )

    storage = get_storage()
    try:
        stream = storage.get(application.resume_key)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Resume file missing from storage backend",
                }
            },
        )

    content_type = application.resume_content_type or "application/pdf"
    filename = application.resume_filename or "resume.pdf"
    return StreamingResponse(
        stream,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "private, max-age=3600",
        },
    )
