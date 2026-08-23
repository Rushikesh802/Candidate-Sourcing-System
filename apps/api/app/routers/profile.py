import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.profile import (
    ProfileUpdate,
    ProfileResponse,
    EducationItem,
    EducationListUpdate,
    EducationListResponse,
    ExperienceListUpdate,
    ExperienceListResponse,
    ExperienceItem,
)
from app.services import profile as profile_service

router = APIRouter(prefix="/me", tags=["Candidate Profile"])

MAX_PHOTO_SIZE = 2 * 1024 * 1024  # 2 MB
ALLOWED_PHOTO_MIMES = {"image/jpeg", "image/jpg", "image/png"}


# ---------------------------------------------------------------------------
# Bio-Data Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=ProfileResponse)
def get_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve current authenticated candidate's bio-data profile."""
    return profile_service.get_profile(db, current_user)


@router.put("/profile", response_model=ProfileResponse)
def update_candidate_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update candidate bio-data profile."""
    return profile_service.update_profile(db, current_user, payload)


# ---------------------------------------------------------------------------
# Education
# ---------------------------------------------------------------------------

@router.get("/education", response_model=EducationListResponse)
def get_candidate_education(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get candidate education records."""
    educations = profile_service.get_educations(db, current_user)
    return EducationListResponse(
        educations=[EducationItem.model_validate(edu) for edu in educations]
    )


@router.put("/education", response_model=EducationListResponse)
def update_candidate_education(
    payload: EducationListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace candidate education records."""
    educations = profile_service.update_educations(db, current_user, payload.educations)
    return EducationListResponse(
        educations=[EducationItem.model_validate(edu) for edu in educations]
    )


# ---------------------------------------------------------------------------
# Experience
# ---------------------------------------------------------------------------

@router.get("/experience", response_model=ExperienceListResponse)
def get_candidate_experience(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get candidate experience history and derived total years."""
    is_fresher, total_years, experiences = profile_service.get_experiences(db, current_user)
    return ExperienceListResponse(
        is_fresher=is_fresher,
        total_experience_years=total_years,
        experiences=[ExperienceItem.model_validate(exp) for exp in experiences],
    )


@router.put("/experience", response_model=ExperienceListResponse)
def update_candidate_experience(
    payload: ExperienceListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace candidate experience records or mark as fresher."""
    is_fresher, total_years, experiences = profile_service.update_experiences(
        db, current_user, payload
    )
    return ExperienceListResponse(
        is_fresher=is_fresher,
        total_experience_years=total_years,
        experiences=[ExperienceItem.model_validate(exp) for exp in experiences],
    )


# ---------------------------------------------------------------------------
# Photo Upload
# ---------------------------------------------------------------------------

@router.post("/photo")
async def upload_candidate_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload and save candidate profile photo (JPEG/PNG <= 2MB)."""
    # Check mime type
    if file.content_type not in ALLOWED_PHOTO_MIMES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Only JPEG and PNG images are supported",
                    "fields": {"file": "Invalid image format"},
                }
            },
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_PHOTO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Photo must be less than 2 MB in size",
                    "fields": {"file": "File size exceeds 2 MB limit"},
                }
            },
        )

    # Magic byte inspection
    is_jpeg = file_bytes.startswith(b"\xff\xd8\xff")
    is_png = file_bytes.startswith(b"\x89PNG\r\n\x1a\n")

    if not (is_jpeg or is_png):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Corrupted or invalid image file content",
                    "fields": {"file": "Invalid image signatures"},
                }
            },
        )

    key, photo_url = profile_service.upload_photo(
        db, current_user, file_bytes, file.filename or "photo.jpg", file.content_type
    )

    return {
        "photo_key": key,
        "photo_url": photo_url,
        "message": "Profile photo uploaded successfully",
    }


@router.delete("/photo")
def delete_candidate_photo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove candidate profile photo."""
    profile_service.delete_photo(db, current_user)
    return {"message": "Profile photo deleted successfully"}
