import re
import uuid
from datetime import datetime, timezone
from html.parser import HTMLParser
from html import escape
from typing import List, Optional
from sqlalchemy import func, or_, desc
from sqlalchemy.orm import Session

from app.models.requisition import Requisition
from app.models.application import Application
from app.models.enums import RequisitionStatus
from app.schemas.requisition import RequisitionCreate, RequisitionUpdate


ALLOWED_TAGS = {
    "p", "b", "i", "strong", "em", "u",
    "h1", "h2", "h3", "h4",
    "ul", "ol", "li", "br", "a",
    "blockquote", "div", "span", "hr",
}
DISALLOWED_CONTENT_TAGS = {"script", "style", "iframe", "object", "embed", "svg", "canvas", "applet"}
ALLOWED_ATTRS = {
    "a": {"href", "title", "target", "rel"}
}


class HTMLSanitizer(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []
        self.ignore_depth = 0

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        if tag_lower in DISALLOWED_CONTENT_TAGS:
            self.ignore_depth += 1
            return
        if self.ignore_depth > 0:
            return

        if tag_lower in ALLOWED_TAGS:
            cleaned_attrs = []
            allowed_for_tag = ALLOWED_ATTRS.get(tag_lower, set())
            for attr_name, attr_val in attrs:
                attr_name_lower = attr_name.lower()
                if attr_name_lower in allowed_for_tag and attr_val is not None:
                    if attr_name_lower == "href":
                        clean_val = attr_val.strip()
                        lower_val = clean_val.lower()
                        if lower_val.startswith(("http://", "https://", "mailto:", "/")):
                            cleaned_attrs.append(f'{attr_name_lower}="{escape(clean_val, quote=True)}"')
                    elif attr_name_lower in ("title", "target", "rel"):
                        cleaned_attrs.append(f'{attr_name_lower}="{escape(attr_val, quote=True)}"')
            attr_str = (" " + " ".join(cleaned_attrs)) if cleaned_attrs else ""
            if tag_lower in ("br", "hr"):
                self.result.append(f"<{tag_lower}{attr_str} />")
            else:
                self.result.append(f"<{tag_lower}{attr_str}>")

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in DISALLOWED_CONTENT_TAGS:
            if self.ignore_depth > 0:
                self.ignore_depth -= 1
            return
        if self.ignore_depth > 0:
            return
        if tag_lower in ALLOWED_TAGS and tag_lower not in ("br", "hr"):
            self.result.append(f"</{tag_lower}>")

    def handle_data(self, data):
        if self.ignore_depth > 0:
            return
        self.result.append(escape(data))

    def handle_entityref(self, name):
        if self.ignore_depth > 0:
            return
        self.result.append(f"&{name};")

    def handle_charref(self, name):
        if self.ignore_depth > 0:
            return
        self.result.append(f"&#{name};")

    def get_html(self) -> str:
        return "".join(self.result)


def sanitize_html(raw_html: str) -> str:
    """Sanitize description HTML, allowing safe tags and stripping dangerous scripts/iframes."""
    if not raw_html:
        return ""
    parser = HTMLSanitizer()
    parser.feed(raw_html)
    return parser.get_html()


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def generate_requisition_code(db: Session) -> str:
    """Generate sequential requisition code REQ-YYYY-NNNNN."""
    year = datetime.now(timezone.utc).year
    prefix = f"REQ-{year}-"
    codes = (
        db.query(Requisition.requisition_code)
        .filter(Requisition.requisition_code.like(f"{prefix}%"))
        .all()
    )
    max_seq = 0
    for (code,) in codes:
        try:
            num_part = code.replace(prefix, "")
            seq_num = int(num_part)
            if seq_num > max_seq:
                max_seq = seq_num
        except ValueError:
            continue

    next_seq = max_seq + 1
    return f"{prefix}{next_seq:05d}"


def generate_slug(db: Session, title: str, code: str, current_id: Optional[uuid.UUID] = None) -> str:
    """Generate unique slug based on title and requisition code."""
    title_slug = slugify(title)
    code_suffix = code.replace("REQ-", "").lower()
    base_slug = f"{title_slug}-{code_suffix}"
    if len(base_slug) > 150:
        base_slug = f"{title_slug[: 150 - len(code_suffix) - 1]}-{code_suffix}"

    slug = base_slug
    counter = 1
    while True:
        query = db.query(Requisition).filter(Requisition.slug == slug)
        if current_id:
            query = query.filter(Requisition.id != current_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def create_requisition(
    db: Session,
    data: RequisitionCreate,
    creator_id: Optional[uuid.UUID] = None,
) -> Requisition:
    """Create a new requisition (as DRAFT or directly PUBLISHED)."""
    code = generate_requisition_code(db)
    slug = generate_slug(db, data.title, code)
    clean_html = sanitize_html(data.description_html)

    status = data.status or RequisitionStatus.DRAFT
    posted_at = datetime.now(timezone.utc) if status == RequisitionStatus.PUBLISHED else None

    req = Requisition(
        requisition_code=code,
        slug=slug,
        title=data.title.strip(),
        department=data.department.strip(),
        location=data.location.strip(),
        employment_type=data.employment_type,
        experience_range=data.experience_range.strip(),
        openings=data.openings,
        hiring_manager=data.hiring_manager.strip(),
        description_html=clean_html,
        max_salary_budget=data.max_salary_budget,
        hiring_complete_by=data.hiring_complete_by,
        status=status,
        posted_at=posted_at,
        created_by=creator_id,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    req.application_count = 0
    return req


def get_requisition(db: Session, req_id: uuid.UUID) -> Optional[Requisition]:
    """Get requisition by ID with application count."""
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        return None
    app_count = db.query(func.count(Application.id)).filter(Application.requisition_id == req.id).scalar() or 0
    req.application_count = app_count
    return req


def list_admin_requisitions(
    db: Session,
    status: Optional[RequisitionStatus] = None,
    department: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Requisition]:
    """List requisitions for admin view with application counts and filters."""
    subquery = (
        db.query(
            Application.requisition_id,
            func.count(Application.id).label("app_count"),
        )
        .group_by(Application.requisition_id)
        .subquery()
    )

    query = (
        db.query(
            Requisition,
            func.coalesce(subquery.c.app_count, 0).label("application_count"),
        )
        .outerjoin(subquery, Requisition.id == subquery.c.requisition_id)
    )

    if status:
        query = query.filter(Requisition.status == status)
    if department:
        query = query.filter(Requisition.department.ilike(f"%{department.strip()}%"))
    if q:
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Requisition.title.ilike(search_term),
                Requisition.department.ilike(search_term),
                Requisition.requisition_code.ilike(search_term),
                Requisition.location.ilike(search_term),
            )
        )

    results = (
        query.order_by(desc(Requisition.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    output = []
    for req, count in results:
        req.application_count = count
        output.append(req)
    return output


def update_requisition(
    db: Session,
    req: Requisition,
    data: RequisitionUpdate,
) -> Requisition:
    """Update requisition fields."""
    update_data = data.model_dump(exclude_unset=True)

    if "description_html" in update_data and update_data["description_html"] is not None:
        update_data["description_html"] = sanitize_html(update_data["description_html"])

    if "title" in update_data and update_data["title"] is not None:
        update_data["title"] = update_data["title"].strip()
        update_data["slug"] = generate_slug(db, update_data["title"], req.requisition_code, current_id=req.id)

    if "department" in update_data and update_data["department"] is not None:
        update_data["department"] = update_data["department"].strip()
    if "location" in update_data and update_data["location"] is not None:
        update_data["location"] = update_data["location"].strip()
    if "hiring_manager" in update_data and update_data["hiring_manager"] is not None:
        update_data["hiring_manager"] = update_data["hiring_manager"].strip()
    if "experience_range" in update_data and update_data["experience_range"] is not None:
        update_data["experience_range"] = update_data["experience_range"].strip()

    if update_data.get("status") == RequisitionStatus.PUBLISHED and not req.posted_at:
        req.posted_at = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(req, field, value)

    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)

    app_count = db.query(func.count(Application.id)).filter(Application.requisition_id == req.id).scalar() or 0
    req.application_count = app_count
    return req


def publish_requisition(db: Session, req: Requisition) -> Requisition:
    """Publish a requisition."""
    req.status = RequisitionStatus.PUBLISHED
    if not req.posted_at:
        req.posted_at = datetime.now(timezone.utc)
    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)

    app_count = db.query(func.count(Application.id)).filter(Application.requisition_id == req.id).scalar() or 0
    req.application_count = app_count
    return req


def close_requisition(db: Session, req: Requisition) -> Requisition:
    """Close a requisition."""
    req.status = RequisitionStatus.CLOSED
    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)

    app_count = db.query(func.count(Application.id)).filter(Application.requisition_id == req.id).scalar() or 0
    req.application_count = app_count
    return req


def duplicate_requisition(
    db: Session,
    req: Requisition,
    creator_id: Optional[uuid.UUID] = None,
) -> Requisition:
    """Duplicate a requisition into a new DRAFT requisition."""
    new_code = generate_requisition_code(db)
    new_title = f"{req.title} (Copy)"
    new_slug = generate_slug(db, new_title, new_code)

    new_req = Requisition(
        requisition_code=new_code,
        slug=new_slug,
        title=new_title,
        department=req.department,
        location=req.location,
        employment_type=req.employment_type,
        experience_range=req.experience_range,
        openings=req.openings,
        hiring_manager=req.hiring_manager,
        description_html=req.description_html,
        max_salary_budget=req.max_salary_budget,
        hiring_complete_by=req.hiring_complete_by,
        status=RequisitionStatus.DRAFT,
        posted_at=None,
        created_by=creator_id,
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    new_req.application_count = 0
    return new_req


def list_public_jobs(
    db: Session,
    q: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    experience: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Requisition]:
    """List strictly PUBLISHED jobs for public portal."""
    query = db.query(Requisition).filter(Requisition.status == RequisitionStatus.PUBLISHED)

    if department:
        query = query.filter(Requisition.department.ilike(f"%{department.strip()}%"))
    if location:
        query = query.filter(Requisition.location.ilike(f"%{location.strip()}%"))
    if experience:
        query = query.filter(Requisition.experience_range.ilike(f"%{experience.strip()}%"))
    if q:
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Requisition.title.ilike(search_term),
                Requisition.department.ilike(search_term),
                Requisition.location.ilike(search_term),
                Requisition.description_html.ilike(search_term),
            )
        )

    return (
        query.order_by(desc(Requisition.posted_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_public_job_by_slug(db: Session, slug: str) -> Optional[Requisition]:
    """Get strictly PUBLISHED job by slug."""
    return (
        db.query(Requisition)
        .filter(
            Requisition.slug == slug,
            Requisition.status == RequisitionStatus.PUBLISHED,
        )
        .first()
    )
