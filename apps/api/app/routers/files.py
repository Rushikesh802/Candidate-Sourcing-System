import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import CandidateProfile
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
