import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.enums import ApplicationStatus
from app.schemas.application import (
    AdminApplicationListItem,
    AdminApplicationDetail,
    ApplicationStatusUpdate,
)
from app.services import application as application_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin Applications"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/requisitions/{requisition_id}/applications",
    response_model=List[AdminApplicationListItem],
    summary="List applications for a specific requisition",
)
def list_requisition_applications(
    requisition_id: uuid.UUID,
    q: Optional[str] = Query(None, description="Search candidate name, email, or application code"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=100, description="Limit"),
    db: Session = Depends(get_db),
):
    return application_service.list_admin_applications(
        db=db,
        requisition_id=requisition_id,
        q=q,
        status=status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/requisitions/{requisition_id}/applications/export",
    summary="Export requisition applications as CSV",
)
def export_requisition_applications_csv(
    requisition_id: uuid.UUID,
    q: Optional[str] = Query(None, description="Search filter"),
    status: Optional[ApplicationStatus] = Query(None, description="Status filter"),
    db: Session = Depends(get_db),
):
    csv_data = application_service.export_applications_csv(
        db=db,
        requisition_id=requisition_id,
        q=q,
        status=status,
    )
    filename = f"applications_req_{str(requisition_id)[:8]}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/applications",
    response_model=List[AdminApplicationListItem],
    summary="List all applications across all requisitions",
)
def list_all_applications(
    requisition_id: Optional[uuid.UUID] = Query(None, description="Optional requisition filter"),
    q: Optional[str] = Query(None, description="Search candidate name, email, or application code"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=100, description="Limit"),
    db: Session = Depends(get_db),
):
    return application_service.list_admin_applications(
        db=db,
        requisition_id=requisition_id,
        q=q,
        status=status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/applications/export",
    summary="Export all applications matching filters as CSV",
)
def export_all_applications_csv(
    requisition_id: Optional[uuid.UUID] = Query(None, description="Optional requisition filter"),
    q: Optional[str] = Query(None, description="Search filter"),
    status: Optional[ApplicationStatus] = Query(None, description="Status filter"),
    db: Session = Depends(get_db),
):
    csv_data = application_service.export_applications_csv(
        db=db,
        requisition_id=requisition_id,
        q=q,
        status=status,
    )
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="all_applications.csv"'},
    )


@router.get(
    "/applications/{id}",
    response_model=AdminApplicationDetail,
    summary="Get full application snapshot and details for admin review",
)
def get_application_detail(
    id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return application_service.get_admin_application_detail(db, id)


@router.patch(
    "/applications/{id}/status",
    response_model=AdminApplicationDetail,
    summary="Update application review status",
)
def update_application_status(
    id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
):
    return application_service.update_application_status(db, id, payload.status)
