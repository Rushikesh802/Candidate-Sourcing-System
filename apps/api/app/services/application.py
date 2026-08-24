import uuid
import random
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.models.application import Application
from app.models.requisition import Requisition
from app.models.user import User, CandidateProfile, Education, Experience
from app.models.enums import ApplicationStatus, RequisitionStatus, UserRole
from app.schemas.application import ApplicationDraftSave
from app.services.storage import get_storage
from app.services.profile import get_or_create_candidate_profile, calculate_experience_years


MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_RESUME_EXTENSIONS = {".pdf", ".doc", ".docx"}


def generate_application_code(db: Session) -> str:
    """Generate a unique human-friendly application code, e.g. APP-88213."""
    for _ in range(100):
        code_num = random.randint(10000, 99999)
        code = f"APP-{code_num}"
        exists = db.query(Application).filter(Application.application_code == code).first()
        if not exists:
            return code
    # Fallback to random hex
    return f"APP-{uuid.uuid4().hex[:5].upper()}"


def validate_resume_file(file_bytes: bytes, filename: str, content_type: str):
    """Validate resume file size, extension, and binary signatures."""
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Resume file is required",
                    "fields": {"resume": "File is empty or missing"},
                }
            },
        )

    if len(file_bytes) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Resume file size exceeds 5 MB limit",
                    "fields": {"resume": "File size exceeds 5 MB"},
                }
            },
        )

    # Check extension
    lower_name = (filename or "").lower()
    has_valid_ext = any(lower_name.endswith(ext) for ext in ALLOWED_RESUME_EXTENSIONS)
    if not has_valid_ext:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Resume must be a PDF, DOC, or DOCX document",
                    "fields": {"resume": "Unsupported file format"},
                }
            },
        )

    # Magic byte check
    is_pdf = file_bytes.startswith(b"%PDF")
    is_doc = file_bytes.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
    is_docx = file_bytes.startswith(b"PK\x03\x04")

    if not (is_pdf or is_doc or is_docx):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Corrupted or invalid resume document header",
                    "fields": {"resume": "Invalid file signature"},
                }
            },
        )


def build_candidate_snapshot(user: User, db: Session) -> Dict[str, Any]:
    """Freeze candidate bio, educations, experiences, and derived years into a JSON snapshot."""
    profile = get_or_create_candidate_profile(db, user)
    educations = (
        db.query(Education)
        .filter(Education.user_id == user.id)
        .order_by(Education.sort_order)
        .all()
    )
    experiences = (
        db.query(Experience)
        .filter(Experience.user_id == user.id)
        .order_by(desc(Experience.start_date))
        .all()
    )

    total_years = calculate_experience_years(experiences) if not profile.is_fresher else 0.0

    return {
        "candidate": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "mobile": user.mobile,
        },
        "profile": {
            "gender": profile.gender.value if profile.gender else None,
            "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            "current_location": profile.current_location,
            "current_company": profile.current_company,
            "notice_period": profile.notice_period.value if profile.notice_period else None,
            "current_address": profile.current_address,
            "is_fresher": profile.is_fresher,
            "total_experience_years": total_years,
            "photo_key": profile.photo_key,
        },
        "educations": [
            {
                "degree": edu.degree,
                "specialization": edu.specialization,
                "institution": edu.institution,
                "year_of_passing": edu.year_of_passing,
                "grade": edu.grade,
                "education_level": edu.education_level.value,
                "sort_order": edu.sort_order,
            }
            for edu in educations
        ],
        "experiences": [
            {
                "employer": exp.employer,
                "job_title": exp.job_title,
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "is_current": exp.is_current,
                "responsibilities": exp.responsibilities,
            }
            for exp in experiences
        ],
        "total_experience_years": total_years,
        "frozen_at": datetime.now(timezone.utc).isoformat(),
    }


def get_or_create_draft(db: Session, user: User, requisition_id: uuid.UUID) -> Optional[Application]:
    """Retrieve existing draft application for (user, requisition) or return None."""
    # Check if submitted application exists
    existing = (
        db.query(Application)
        .filter(
            Application.candidate_id == user.id,
            Application.requisition_id == requisition_id,
        )
        .first()
    )
    return existing


def save_draft(
    db: Session, user: User, requisition_id: uuid.UUID, data: ApplicationDraftSave
) -> Application:
    """Save or update application draft progress."""
    req = db.query(Requisition).filter(Requisition.id == requisition_id).first()
    if not req or req.status != RequisitionStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "REQUISITION_NOT_OPEN",
                    "message": "This job posting is not currently accepting applications",
                }
            },
        )

    application = (
        db.query(Application)
        .filter(
            Application.candidate_id == user.id,
            Application.requisition_id == requisition_id,
        )
        .first()
    )

    if application and application.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "code": "CONFLICT",
                    "message": "You have already submitted an application for this position.",
                }
            },
        )

    if not application:
        application = Application(
            id=uuid.uuid4(),
            application_code=generate_application_code(db),
            requisition_id=requisition_id,
            candidate_id=user.id,
            status=ApplicationStatus.DRAFT,
            cover_note=data.cover_note,
        )
        db.add(application)
    else:
        if data.cover_note is not None:
            application.cover_note = data.cover_note

    db.commit()
    db.refresh(application)
    return application


def submit_application(
    db: Session,
    user: User,
    requisition_id: uuid.UUID,
    resume_bytes: bytes,
    filename: str,
    content_type: str,
    cover_note: Optional[str],
    consent_accuracy: bool,
    consent_privacy: bool,
) -> Application:
    """Submit a final candidate application for a published requisition."""
    # 1. Validate requisition exists and is published
    req = db.query(Requisition).filter(Requisition.id == requisition_id).first()
    if not req or req.status != RequisitionStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "REQUISITION_NOT_OPEN",
                    "message": "This job requisition is not published or no longer accepting applications",
                }
            },
        )

    # 2. Check duplicate submitted application
    existing = (
        db.query(Application)
        .filter(
            Application.candidate_id == user.id,
            Application.requisition_id == requisition_id,
        )
        .first()
    )
    if existing and existing.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "code": "CONFLICT",
                    "message": "You have already submitted an application for this position.",
                }
            },
        )

    # 3. Consents validation
    if not consent_accuracy or not consent_privacy:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Both accuracy and privacy policy consents are required to submit",
                    "fields": {
                        "consent_accuracy": "Accuracy declaration is required",
                        "consent_privacy": "Privacy policy consent is required",
                    },
                }
            },
        )

    # 4. Profile validation
    profile = get_or_create_candidate_profile(db, user)
    educations_count = (
        db.query(Education).filter(Education.user_id == user.id).count()
    )
    if educations_count == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "At least one educational qualification is required",
                    "fields": {"education": "Education history is empty"},
                }
            },
        )

    if not profile.is_fresher:
        exp_count = db.query(Experience).filter(Experience.user_id == user.id).count()
        if exp_count == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Work experience is required unless you are marked as a fresher",
                        "fields": {"experience": "Experience history is empty"},
                    }
                },
            )

    # 5. Resume validation
    validate_resume_file(resume_bytes, filename, content_type)

    # 6. Save resume to storage
    storage = get_storage()
    app_id = existing.id if existing else uuid.uuid4()
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
    resume_key = f"resumes/{app_id}_{uuid.uuid4().hex[:8]}.{ext}"
    storage.put(resume_key, resume_bytes, content_type)

    # 7. Snapshot candidate profile data
    snapshot = build_candidate_snapshot(user, db)

    # 8. Create or update application
    if existing:
        application = existing
        application.status = ApplicationStatus.NEW
        application.cover_note = cover_note.strip() if cover_note else None
        application.resume_key = resume_key
        application.resume_filename = filename
        application.resume_content_type = content_type
        application.consent_accuracy = True
        application.consent_privacy = True
        application.submitted_at = datetime.now(timezone.utc)
        application.snapshot_json = snapshot
    else:
        application = Application(
            id=app_id,
            application_code=generate_application_code(db),
            requisition_id=requisition_id,
            candidate_id=user.id,
            status=ApplicationStatus.NEW,
            cover_note=cover_note.strip() if cover_note else None,
            resume_key=resume_key,
            resume_filename=filename,
            resume_content_type=content_type,
            consent_accuracy=True,
            consent_privacy=True,
            submitted_at=datetime.now(timezone.utc),
            snapshot_json=snapshot,
        )
        db.add(application)

    db.commit()
    db.refresh(application)


    # 9. In-App Notifications (for every admin)
    try:
        from app.services.notification import notify_all_admins_new_application
        notify_all_admins_new_application(
            db=db,
            application=application,
            requisition=req,
            candidate=user,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"In-app notification failed: {e}")

    # 10. Email Notifications (Candidate confirmation + Admin alert)
    try:
        from app.services.mailer import (
            send_candidate_application_email,
            send_admin_new_application_email,
        )
        send_candidate_application_email(
            to_email=user.email,
            candidate_name=f"{user.first_name} {user.last_name}",
            job_title=req.title,
            requisition_code=req.requisition_code,
            application_code=application.application_code,
            submitted_at=application.submitted_at or datetime.now(timezone.utc),
        )

        admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
        for admin in admins:
            send_admin_new_application_email(
                admin_email=admin.email,
                requisition_code=req.requisition_code,
                job_title=req.title,
                candidate_name=f"{user.first_name} {user.last_name}",
                candidate_email=user.email,
                application_code=application.application_code,
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Email dispatch failed: {e}")

    return application



def get_candidate_applications(db: Session, user: User) -> List[Application]:
    """List all applications submitted by candidate."""
    return (
        db.query(Application)
        .filter(Application.candidate_id == user.id)
        .order_by(desc(Application.submitted_at), desc(Application.created_at))
        .all()
    )


def get_candidate_application_detail(
    db: Session, user: User, application_id: uuid.UUID
) -> Application:
    """Get candidate application detail ensuring candidate ownership."""
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.candidate_id == user.id,
        )
        .first()
    )
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
    return application


def _format_admin_application_list_item(app: Application) -> Dict[str, Any]:
    """Helper to convert Application ORM object into AdminApplicationListItem structure."""
    snapshot = app.snapshot_json or {}
    cand_snapshot = snapshot.get("candidate", {})
    prof_snapshot = snapshot.get("profile", {})

    # Candidate Name
    cand_first = cand_snapshot.get("first_name") or (app.candidate.first_name if app.candidate else "")
    cand_last = cand_snapshot.get("last_name") or (app.candidate.last_name if app.candidate else "")
    cand_name = f"{cand_first} {cand_last}".strip()

    # Candidate Email & Mobile
    cand_email = cand_snapshot.get("email") or (app.candidate.email if app.candidate else "")
    cand_mobile = cand_snapshot.get("mobile") or (app.candidate.mobile if app.candidate else None)

    # Location & Total Exp
    location = prof_snapshot.get("current_location")
    if not location and app.candidate and app.candidate.candidate_profile:
        location = app.candidate.candidate_profile.current_location

    total_exp = snapshot.get("total_experience_years", 0.0)
    if not total_exp and prof_snapshot.get("total_experience_years") is not None:
        total_exp = prof_snapshot.get("total_experience_years", 0.0)

    return {
        "id": app.id,
        "application_code": app.application_code,
        "requisition_id": app.requisition_id,
        "requisition_title": app.requisition.title if app.requisition else "",
        "requisition_code": app.requisition.requisition_code if app.requisition else "",
        "candidate_id": app.candidate_id,
        "candidate_name": cand_name,
        "candidate_email": cand_email,
        "candidate_mobile": cand_mobile,
        "candidate_location": location,
        "total_experience_years": total_exp,
        "status": app.status,
        "resume_filename": app.resume_filename,
        "resume_url": f"/api/v1/files/resumes/{app.id}",
        "submitted_at": app.submitted_at,
        "created_at": app.created_at,
    }


def list_admin_applications(
    db: Session,
    requisition_id: Optional[uuid.UUID] = None,
    q: Optional[str] = None,
    status: Optional[ApplicationStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """List submitted applications for admin review with filtering and search."""
    query = (
        db.query(Application)
        .join(Application.requisition)
        .join(Application.candidate)
        .filter(Application.status != ApplicationStatus.DRAFT)
    )

    if requisition_id:
        query = query.filter(Application.requisition_id == requisition_id)

    if status:
        query = query.filter(Application.status == status)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                User.first_name.ilike(term),
                User.last_name.ilike(term),
                User.email.ilike(term),
                Application.application_code.ilike(term),
            )
        )

    apps = (
        query.order_by(desc(Application.submitted_at), desc(Application.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [_format_admin_application_list_item(app) for app in apps]


def get_admin_application_detail(
    db: Session, application_id: uuid.UUID
) -> Dict[str, Any]:
    """Get full admin application snapshot and review details."""
    app = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.status != ApplicationStatus.DRAFT,
        )
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Application record not found",
                }
            },
        )

    snapshot = app.snapshot_json or {}
    cand_snapshot = snapshot.get("candidate", {})
    prof_snapshot = snapshot.get("profile", {})

    cand_first = cand_snapshot.get("first_name") or (app.candidate.first_name if app.candidate else "")
    cand_last = cand_snapshot.get("last_name") or (app.candidate.last_name if app.candidate else "")
    cand_name = f"{cand_first} {cand_last}".strip()

    cand_email = cand_snapshot.get("email") or (app.candidate.email if app.candidate else "")
    cand_mobile = cand_snapshot.get("mobile") or (app.candidate.mobile if app.candidate else None)

    location = prof_snapshot.get("current_location")
    if not location and app.candidate and app.candidate.candidate_profile:
        location = app.candidate.candidate_profile.current_location

    total_exp = snapshot.get("total_experience_years", 0.0)
    if not total_exp and prof_snapshot.get("total_experience_years") is not None:
        total_exp = prof_snapshot.get("total_experience_years", 0.0)

    req = app.requisition
    req_summary = {
        "id": req.id,
        "title": req.title,
        "requisition_code": req.requisition_code,
        "slug": req.slug,
        "department": req.department,
        "location": req.location,
        "employment_type": req.employment_type.value if hasattr(req.employment_type, "value") else str(req.employment_type),
        "status": req.status.value if hasattr(req.status, "value") else str(req.status),
    }

    return {
        "id": app.id,
        "application_code": app.application_code,
        "requisition_id": app.requisition_id,
        "requisition": req_summary,
        "candidate_id": app.candidate_id,
        "candidate_name": cand_name,
        "candidate_email": cand_email,
        "candidate_mobile": cand_mobile,
        "candidate_location": location,
        "total_experience_years": total_exp,
        "status": app.status,
        "cover_note": app.cover_note,
        "resume_filename": app.resume_filename,
        "resume_content_type": app.resume_content_type,
        "resume_url": f"/api/v1/files/resumes/{app.id}",
        "consent_accuracy": app.consent_accuracy,
        "consent_privacy": app.consent_privacy,
        "submitted_at": app.submitted_at,
        "snapshot_json": app.snapshot_json,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
    }


def update_application_status(
    db: Session, application_id: uuid.UUID, new_status: ApplicationStatus
) -> Dict[str, Any]:
    """Update application review status."""
    if new_status == ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Cannot set application status back to draft",
                }
            },
        )

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Application record not found",
                }
            },
        )

    app.status = new_status
    db.commit()
    db.refresh(app)

    return get_admin_application_detail(db, application_id)


def export_applications_csv(
    db: Session,
    requisition_id: Optional[uuid.UUID] = None,
    q: Optional[str] = None,
    status: Optional[ApplicationStatus] = None,
) -> str:
    """Generate CSV string for applications export."""
    import csv
    import io

    apps = list_admin_applications(
        db,
        requisition_id=requisition_id,
        q=q,
        status=status,
        skip=0,
        limit=10000,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Application Code",
        "Requisition Code",
        "Job Title",
        "Candidate Name",
        "Email",
        "Mobile",
        "Location",
        "Experience (Years)",
        "Status",
        "Submitted At",
        "Resume URL",
    ])

    for a in apps:
        writer.writerow([
            a["application_code"],
            a["requisition_code"],
            a["requisition_title"],
            a["candidate_name"],
            a["candidate_email"],
            a["candidate_mobile"] or "",
            a["candidate_location"] or "",
            a["total_experience_years"],
            a["status"].value if hasattr(a["status"], "value") else str(a["status"]),
            a["submitted_at"].isoformat() if a["submitted_at"] else "",
            a["resume_url"],
        ])

    return output.getvalue()

