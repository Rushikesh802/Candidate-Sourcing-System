from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.requisition import PublicJobListItem, PublicJobDetail
from app.services import requisition as requisition_service

router = APIRouter(
    prefix="/jobs",
    tags=["Public Jobs"],
)


@router.get(
    "",
    response_model=List[PublicJobListItem],
    summary="List all published jobs with search & filters",
)
def list_public_jobs(
    q: Optional[str] = Query(None, description="Search query across title, department, location, description"),
    department: Optional[str] = Query(None, description="Filter by department"),
    location: Optional[str] = Query(None, description="Filter by location"),
    experience: Optional[str] = Query(None, description="Filter by experience range"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
):
    return requisition_service.list_public_jobs(
        db,
        q=q,
        department=department,
        location=location,
        experience=experience,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{slug}",
    response_model=PublicJobDetail,
    summary="Get published job details by slug",
)
def get_public_job_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    job = requisition_service.get_public_job_by_slug(db, slug)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "JOB_NOT_FOUND",
                    "message": "Job requisition not found or is no longer available",
                }
            },
        )
    return job
