import uuid
from datetime import date, datetime
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.user import User, CandidateProfile, Education, Experience
from app.schemas.profile import (
    ProfileUpdate,
    ProfileResponse,
    EducationItem,
    ExperienceItem,
    ExperienceListUpdate,
)
from app.services.storage import get_storage


def calculate_experience_years(experiences: list) -> float:
    """
    Derive total years of experience from experience date ranges.
    Merges overlapping intervals and returns value rounded to 1 decimal place.
    """
    if not experiences:
        return 0.0

    today = date.today()
    intervals = []
    for exp in experiences:
        start = exp.start_date
        end = today if (exp.is_current or not exp.end_date) else exp.end_date
        if end < start:
            continue
        intervals.append((start, end))

    if not intervals:
        return 0.0

    # Sort intervals by start date
    intervals.sort(key=lambda x: x[0])

    merged = []
    for start, end in intervals:
        if not merged:
            merged.append([start, end])
        else:
            prev_start, prev_end = merged[-1]
            if start <= prev_end:
                merged[-1][1] = max(prev_end, end)
            else:
                merged.append([start, end])

    total_days = sum((end - start).days for start, end in merged)
    years = round(total_days / 365.25, 1)
    return float(years)


def get_or_create_candidate_profile(db: Session, user: User) -> CandidateProfile:
    """Retrieve existing candidate profile or initialize one."""
    if user.profile is not None:
        return user.profile

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    if profile is None:
        profile = CandidateProfile(
            user_id=user.id,
            is_fresher=False,
            total_experience_years=0.0,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def get_profile_response(user: User, profile: CandidateProfile) -> ProfileResponse:
    """Construct ProfileResponse schema from User and CandidateProfile."""
    photo_url = f"/api/v1/files/photos/{user.id}" if profile.photo_key else None
    return ProfileResponse(
        user_id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        mobile=user.mobile,
        gender=profile.gender,
        date_of_birth=profile.date_of_birth,
        current_location=profile.current_location,
        current_company=profile.current_company,
        notice_period=profile.notice_period,
        current_address=profile.current_address,
        photo_key=profile.photo_key,
        photo_url=photo_url,
        is_fresher=profile.is_fresher,
        total_experience_years=float(profile.total_experience_years or 0.0),
    )


def get_profile(db: Session, user: User) -> ProfileResponse:
    """Get full candidate profile for user."""
    profile = get_or_create_candidate_profile(db, user)
    return get_profile_response(user, profile)


def update_profile(db: Session, user: User, data: ProfileUpdate) -> ProfileResponse:
    """Update user bio and candidate profile details."""
    profile = get_or_create_candidate_profile(db, user)

    # Update User fields
    if data.first_name is not None:
        user.first_name = data.first_name.strip()
    if data.last_name is not None:
        user.last_name = data.last_name.strip()
    if data.mobile is not None:
        user.mobile = data.mobile.strip()

    # Update CandidateProfile fields
    if data.gender is not None:
        profile.gender = data.gender
    if data.date_of_birth is not None:
        profile.date_of_birth = data.date_of_birth
    if data.current_location is not None:
        profile.current_location = data.current_location.strip()
    if data.current_company is not None:
        profile.current_company = data.current_company.strip()
    if data.notice_period is not None:
        profile.notice_period = data.notice_period
    if data.current_address is not None:
        profile.current_address = data.current_address.strip()
    if data.is_fresher is not None:
        profile.is_fresher = data.is_fresher
        if data.is_fresher:
            profile.total_experience_years = 0.0

    db.add(user)
    db.add(profile)
    db.commit()
    db.refresh(user)
    db.refresh(profile)

    return get_profile_response(user, profile)


def get_educations(db: Session, user: User) -> List[Education]:
    """Get list of user's education entries ordered by sort order."""
    return (
        db.query(Education)
        .filter(Education.user_id == user.id)
        .order_by(Education.sort_order, desc(Education.year_of_passing))
        .all()
    )


def update_educations(
    db: Session, user: User, educations_data: List[EducationItem]
) -> List[Education]:
    """Replace all education records for the user atomically."""
    # Delete existing education records
    db.query(Education).filter(Education.user_id == user.id).delete()

    new_records = []
    for idx, edu in enumerate(educations_data):
        rec = Education(
            id=edu.id or uuid.uuid4(),
            user_id=user.id,
            degree=edu.degree.strip(),
            specialization=edu.specialization.strip() if edu.specialization else None,
            institution=edu.institution.strip(),
            year_of_passing=edu.year_of_passing,
            grade=edu.grade.strip() if edu.grade else None,
            education_level=edu.education_level,
            sort_order=edu.sort_order if edu.sort_order is not None else idx,
        )
        new_records.append(rec)
        db.add(rec)

    db.commit()
    return get_educations(db, user)


def get_experiences(db: Session, user: User) -> Tuple[bool, float, List[Experience]]:
    """Get user's experience records, fresher status, and total years."""
    profile = get_or_create_candidate_profile(db, user)
    experiences = (
        db.query(Experience)
        .filter(Experience.user_id == user.id)
        .order_by(desc(Experience.start_date))
        .all()
    )
    return profile.is_fresher, float(profile.total_experience_years or 0.0), experiences


def update_experiences(
    db: Session, user: User, data: ExperienceListUpdate
) -> Tuple[bool, float, List[Experience]]:
    """Replace user's experience records or mark as fresher."""
    profile = get_or_create_candidate_profile(db, user)

    # Delete existing experiences
    db.query(Experience).filter(Experience.user_id == user.id).delete()

    if data.is_fresher:
        profile.is_fresher = True
        profile.total_experience_years = 0.0
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return True, 0.0, []

    profile.is_fresher = False
    new_records = []
    for exp in data.experiences or []:
        rec = Experience(
            id=exp.id or uuid.uuid4(),
            user_id=user.id,
            employer=exp.employer.strip(),
            job_title=exp.job_title.strip(),
            start_date=exp.start_date,
            end_date=None if exp.is_current else exp.end_date,
            is_current=exp.is_current,
            responsibilities=exp.responsibilities.strip() if exp.responsibilities else None,
        )
        new_records.append(rec)
        db.add(rec)

    # Calculate derived total experience years
    total_years = calculate_experience_years(new_records)
    profile.total_experience_years = total_years

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return False, total_years, get_experiences(db, user)[2]


def upload_photo(
    db: Session, user: User, file_bytes: bytes, filename: str, content_type: str
) -> Tuple[str, str]:
    """Store profile photo and update candidate profile."""
    profile = get_or_create_candidate_profile(db, user)
    storage = get_storage()

    # Determine extension
    ext = "jpg"
    if "png" in content_type.lower():
        ext = "png"
    elif "jpeg" in content_type.lower():
        ext = "jpg"

    key = f"photos/{user.id}_{uuid.uuid4().hex[:8]}.{ext}"

    # Remove old photo if exists
    if profile.photo_key:
        try:
            storage.delete(profile.photo_key)
        except Exception:
            pass

    storage.put(key, file_bytes, content_type)
    profile.photo_key = key
    db.add(profile)
    db.commit()
    db.refresh(profile)

    photo_url = f"/api/v1/files/photos/{user.id}"
    return key, photo_url


def delete_photo(db: Session, user: User) -> None:
    """Delete candidate profile photo."""
    profile = get_or_create_candidate_profile(db, user)
    if profile.photo_key:
        storage = get_storage()
        try:
            storage.delete(profile.photo_key)
        except Exception:
            pass
        profile.photo_key = None
        db.add(profile)
        db.commit()
        db.refresh(profile)
