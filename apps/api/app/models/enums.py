import enum


class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    ADMIN = "admin"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT = "prefer_not"


class NoticePeriod(str, enum.Enum):
    IMMEDIATE = "immediate"
    DAYS_15 = "15"
    DAYS_30 = "30"
    DAYS_60 = "60"
    DAYS_90_PLUS = "90_plus"


class EducationLevel(str, enum.Enum):
    HIGH_SCHOOL = "high_school"
    DIPLOMA = "diploma"
    BACHELORS = "bachelors"
    MASTERS = "masters"
    DOCTORATE = "doctorate"


class RequisitionStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class EmploymentType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    NEW = "new"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"


class NotificationType(str, enum.Enum):
    NEW_APPLICATION = "new_application"
