import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.enums import RequisitionStatus
from app.models.user import User
from app.schemas.requisition import (
    RequisitionCreate,
    RequisitionUpdate,
    RequisitionAdminResponse,
)
from app.services import requisition as requisition_service

router = APIRouter(
    prefix="/admin/requisitions",
    tags=["Admin Requisitions"],
    dependencies=[Depends(require_admin)],
)


@router.post(
    "",
    response_model=RequisitionAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new requisition",
)
def create_requisition(
    data: RequisitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    req = requisition_service.create_requisition(db, data, creator_id=current_user.id)
    return req


@router.get(
    "",
    response_model=List[RequisitionAdminResponse],
    summary="List all requisitions with filters and application counts",
)
def list_requisitions(
    status: Optional[RequisitionStatus] = Query(None, description="Filter by status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    q: Optional[str] = Query(None, description="Search query"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
):
    return requisition_service.list_admin_requisitions(
        db, status=status, department=department, q=q, skip=skip, limit=limit
    )


@router.get(
    "/{id}",
    response_model=RequisitionAdminResponse,
    summary="Get requisition details by ID",
)
def get_requisition(
    id: uuid.UUID,
    db: Session = Depends(get_db),
):
    req = requisition_service.get_requisition(db, id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "REQUISITION_NOT_FOUND",
                    "message": "Requisition not found",
                }
            },
        )
    return req


@router.patch(
    "/{id}",
    response_model=RequisitionAdminResponse,
    summary="Update requisition fields",
)
def update_requisition(
    id: uuid.UUID,
    data: RequisitionUpdate,
    db: Session = Depends(get_db),
):
    req = requisition_service.get_requisition(db, id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "REQUISITION_NOT_FOUND",
                    "message": "Requisition not found",
                }
            },
        )
    return requisition_service.update_requisition(db, req, data)


@router.post(
    "/{id}/publish",
    response_model=RequisitionAdminResponse,
    summary="Publish a requisition",
)
def publish_requisition(
    id: uuid.UUID,
    db: Session = Depends(get_db),
):
    req = requisition_service.get_requisition(db, id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "REQUISITION_NOT_FOUND",
                    "message": "Requisition not found",
                }
            },
        )
    return requisition_service.publish_requisition(db, req)


@router.post(
    "/{id}/close",
    response_model=RequisitionAdminResponse,
    summary="Close a requisition",
)
def close_requisition(
    id: uuid.UUID,
    db: Session = Depends(get_db),
):
    req = requisition_service.get_requisition(db, id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "REQUISITION_NOT_FOUND",
                    "message": "Requisition not found",
                }
            },
        )
    return requisition_service.close_requisition(db, req)


@router.post(
    "/{id}/duplicate",
    response_model=RequisitionAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a requisition",
)
def duplicate_requisition(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    req = requisition_service.get_requisition(db, id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "REQUISITION_NOT_FOUND",
                    "message": "Requisition not found",
                }
            },
        )
    return requisition_service.duplicate_requisition(db, req, creator_id=current_user.id)
