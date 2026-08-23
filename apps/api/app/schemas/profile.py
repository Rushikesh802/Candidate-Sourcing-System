import re
import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import Gender, NoticePeriod, EducationLevel

MOBILE_REGEX = re.compile(r"^\+?[0-9\s\-()]{5,20}$")


# ---------------------------------------------------------------------------
# Profile (Bio-Data)
# ---------------------------------------------------------------------------

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    mobile: Optional[str] = Field(None, min_length=5, max_length=20)
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    current_location: Optional[str] = Field(None, max_length=120)
    current_company: Optional[str] = Field(None, max_length=120)
    notice_period: Optional[NoticePeriod] = None
    current_address: Optional[str] = None
    is_fresher: Optional[bool] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be empty")
        return v

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not MOBILE_REGEX.match(v):
                raise ValueError("Invalid mobile phone number format")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            if v > date.today():
                raise ValueError("Date of birth cannot be in the future")
        return v


class ProfileResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    mobile: str
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    current_location: Optional[str] = None
    current_company: Optional[str] = None
    notice_period: Optional[NoticePeriod] = None
    current_address: Optional[str] = None
    photo_key: Optional[str] = None
    photo_url: Optional[str] = None
    is_fresher: bool = False
    total_experience_years: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Education
# ---------------------------------------------------------------------------

class EducationItem(BaseModel):
    id: Optional[uuid.UUID] = None
    degree: str = Field(..., min_length=1, max_length=120)
    specialization: Optional[str] = Field(None, max_length=120)
    institution: str = Field(..., min_length=1, max_length=200)
    year_of_passing: int = Field(...)
    grade: Optional[str] = Field(None, max_length=40)
    education_level: EducationLevel
    sort_order: Optional[int] = 0

    @field_validator("degree", "institution")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be blank")
        return v

    @field_validator("year_of_passing")
    @classmethod
    def validate_year(cls, v: int) -> int:
        current_year = datetime.now().year
        if v < 1950 or v > current_year:
            raise ValueError(f"Year of passing must be between 1950 and {current_year}")
        return v

    model_config = ConfigDict(from_attributes=True)


class EducationListUpdate(BaseModel):
    educations: List[EducationItem]


class EducationListResponse(BaseModel):
    educations: List[EducationItem]


# ---------------------------------------------------------------------------
# Experience
# ---------------------------------------------------------------------------

class ExperienceItem(BaseModel):
    id: Optional[uuid.UUID] = None
    employer: str = Field(..., min_length=1, max_length=200)
    job_title: str = Field(..., min_length=1, max_length=200)
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False
    responsibilities: Optional[str] = Field(None, max_length=1000)

    @field_validator("employer", "job_title")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be blank")
        return v

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Start date cannot be in the future")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ExperienceItem":
        if self.is_current:
            self.end_date = None
        else:
            if self.end_date is not None:
                if self.end_date < self.start_date:
                    raise ValueError("End date cannot be earlier than start date")
        return self

    model_config = ConfigDict(from_attributes=True)


class ExperienceListUpdate(BaseModel):
    is_fresher: bool = False
    experiences: Optional[List[ExperienceItem]] = Field(default_factory=list)


class ExperienceListResponse(BaseModel):
    is_fresher: bool
    total_experience_years: float
    experiences: List[ExperienceItem]
