# Architecture — Candidate Sourcing System

**Product (BRD):** Job Requisition, Public Posting & Candidate Application Platform  
**Source:** SmartSkale Candidate Sourcing System BRD v1.0 (15 Aug 2026)  
**Document type:** System architecture for Phase 1 implementation  
**Status:** Design for build (not yet implemented)

This document is the technical blueprint for the assignment: a working end-to-end system that covers BRD section 5 (User Journey). It is written so another engineer can implement from it without the BRD in hand.

---

## 1. Problem

The organization has no single place to publish jobs and collect applications.

Today, openings and resumes move through email, job boards, and spreadsheets. That causes:

- Slow posting (recruiter depends on IT/webmaster to put a job on a site)
- Lost or duplicated applications
- No shared view of “who applied to this requisition”
- Candidates forced to register before they can even *see* jobs, which reduces inbound volume
- No structured candidate data (bio, education, experience) sitting next to the resume file

**What the system must do:** let an internal admin create and publish a requisition; let anyone browse and share that posting without an account; require login only at Apply; capture a guided application (bio → education → experience → mandatory resume); notify the admin; and give the admin a per-requisition grid of applications with resume access and status updates.

**What this is not (BRD Phase 1 out of scope):** resume parsing, AI matching/scoring, interview scheduling, offer/onboarding, LinkedIn/Naukri/Indeed cross-post, background checks, native mobile apps, localization.

The internship stack list includes LLMs, RAG, and vector search. Those are **not required to satisfy the BRD**. They are reserved as a later, optional layer (section 16) so Phase 1 stays small and correct.

---

## 2. Goals and non-goals

### 2.1 Goals (Phase 1)

| Goal | BRD mapping |
| --- | --- |
| Admin self-service requisition create / draft / publish / close / edit | FR-JR-01…06 |
| Public career site, no login to browse or share | FR-PUB-01…05, AC 11.1 |
| Login/register only when applying; return to the same job | FR-AUTH-01…03, 05, 06, AC 11.2 |
| 4-step application with mandatory resume + consents | FR-APP-01…04, 07…09, AC 11.3 |
| Admin notified on submit (in-app + email) | FR-NOTIF-01, 02, AC 11.4 |
| Admin applications grid, resume download, status change, full profile | FR-ADM-01, 02, 04, 06, AC 11.5 |
| Cloneable repo, Docker local run, documented REST API | Assignment |

### 2.2 Should-have (include if cheap)

- Job search/filters (department, location, experience) — FR-PUB-02
- Duplicate-application block — FR-APP-10
- My Applications — FR-APP-11
- Save & continue drafts — FR-APP-06
- Admin search/filter/export CSV — FR-ADM-03, 05
- Admin unread notification bell — FR-NOTIF-04
- Profile reuse across jobs — FR-AUTH-07

### 2.3 Explicitly not in Phase 1

- Google/LinkedIn OAuth (FR-AUTH-04, Could Have)
- Duplicate requisition clone (FR-JR-07, Could Have) — optional if time
- Status-change email to candidate (FR-NOTIF-03) — schema-ready, not required
- Cross-requisition admin view (FR-ADM-07) — nice if the same grid supports an “all jobs” filter
- AI resume parse, embeddings, RAG, scoring
- Native mobile, multi-language, ATS interview pipeline

---

## 3. Users and journeys

### 3.1 Roles

| Role | Who | Can |
| --- | --- | --- |
| `anonymous` | Public visitor | List/search published jobs, view detail, share link. Cannot apply. |
| `candidate` | Registered job seeker | All of anonymous + apply, upload resume, My Applications, own profile. |
| `admin` | Internal recruiter / system admin | Requisitions CRUD + publish/close, all applications, resume download, status updates, notifications. |
| `system` | Background jobs | Emails and in-app notification records. Not a login. |

Hiring Manager is a **field on a requisition** in Phase 1, not a login role.

### 3.2 Admin journey (BRD §5)

```
Login → Create Requisition → Validate → Publish
     → Monitor Applications → Open Application Grid → Review Candidate / Resume
     → Update status (New / Reviewed / Shortlisted / Rejected)
```

### 3.3 Candidate journey (BRD §5)

```
Public Careers Page → Job Detail → Apply
  → Create Account / Login (if needed, then return to this job)
  → Bio-Data → Education → Experience → Resume & Consents
  → Submit → Confirmation (Application ID + email)
```

Share path (no login): `Job Detail → Share → copy public URL`.

### 3.4 Hard product rules

1. Draft and Closed requisitions **never** appear on the public site.
2. Apply never shows the form until the user is authenticated as `candidate`.
3. Submit is rejected without a resume file (PDF/DOC/DOCX, ≤ 5 MB) and both consents.
4. One candidate may have at most one **submitted** application per open requisition.
5. Closing a requisition hides it publicly but **keeps** historical applications.

---

## 4. Chosen stack

Pick a small stack that matches the assignment list without using every item.

| Layer | Choice | Why |
| --- | --- | --- |
| Public + Admin UI | **Next.js (App Router) + TypeScript + Tailwind CSS** | One web app, two surfaces (career site + admin). SSR/SSG for public job pages. Responsive web only (BRD). |
| API | **FastAPI (Python) + Pydantic** | Explicit REST/JSON, typed validation, easy later AI. Separate from UI so API can be tested with curl. |
| Auth | **JWT in HttpOnly cookies** (access + refresh) | Browser-friendly, CSRF via SameSite; no tokens in localStorage. |
| Database | **PostgreSQL 16** | Relational data (users, requisitions, applications, 1-N education/experience). SQL as required. |
| ORM / migrations | **SQLAlchemy 2 + Alembic** | Predictable schema, versioned migrations. |
| Files | **Local volume in Docker; S3-compatible interface** | Resumes are binary; DB stores metadata + object key only. Swap to S3/MinIO later without changing API. |
| Email | **SMTP adapter** (console/log in local, real SMTP in prod) | FR-NOTIF-01/02. Local demo must not require a paid email account. |
| Runtime | **Docker Compose** | `web` + `api` + `postgres` + `mailhog` (optional). One command to run. |
| Hosting (optional demo) | **Vercel (web) + any FastAPI host, or a single VM** | Assignment asks for a live link if available; not a Phase 1 blocker. |

**Rejected for Phase 1**

| Option | Why not |
| --- | --- |
| Next.js-only (Route Handlers as API) | Simpler, but the assignment expects a distinct REST backend. FastAPI keeps that boundary clean. |
| MongoDB | Applications are relational (FK integrity, unique (candidate, job), status enums). SQL is a better fit. |
| Pinecone / Weaviate / Chroma | No retrieval use case in Phase 1. |
| LangChain / LlamaIndex | No RAG in Phase 1. |
| Flutter / React Native | BRD: web only. |
| Microservices, message bus, Kubernetes | Overkill for this product. |

---

## 5. System context

```
┌─────────────┐     HTTPS      ┌──────────────────────────┐
│  Browser    │───────────────▶│  Next.js web             │
│  (public /  │                │  /          career site  │
│   candidate │◀───────────────│  /admin     admin console│
│   / admin)  │                └────────────┬─────────────┘
└─────────────┘                             │ REST JSON
                                            │ HttpOnly cookie
                               ┌────────────▼─────────────┐
                               │  FastAPI                 │
                               │  auth, jobs, apply,      │
                               │  admin, files, notify    │
                               └─────┬──────────┬─────────┘
                                     │          │
                          ┌──────────▼──┐  ┌────▼─────────┐
                          │ PostgreSQL  │  │ File store   │
                          │             │  │ resumes/     │
                          └─────────────┘  │ photos/      │
                                           └──────────────┘
                                     │
                          ┌──────────▼──┐
                          │ SMTP / log  │
                          │ Mailhog loc │
                          └─────────────┘
```

There is **one backend**. Next.js does not own business rules. It calls FastAPI. FastAPI is the source of truth for validation, authz, and persistence.

---

## 6. Repository layout

Monorepo. One GitHub repo, one README, one `docker-compose.yml`.

```
/
  architecture.md
  README.md
  docker-compose.yml
  .env.example
  apps/
    web/                 # Next.js
      src/app/
        (public)/        # /, /jobs, /jobs/[slug]
        (auth)/          # /login, /register, /forgot-password, /reset-password
        (candidate)/     # /apply/[reqId], /applications, /profile
        (admin)/         # /admin/..., layout gated to role=admin
      src/components/
      src/lib/api.ts     # typed fetch client
    api/                 # FastAPI
      app/
        main.py
        core/            # config, security, deps
        models/
        schemas/
        routers/         # auth, jobs, applications, admin, files
        services/        # requisition, application, notify, storage
        workers/         # optional: email send
      alembic/
      tests/
  packages/              # none in Phase 1
```

Route groups keep public, candidate, and admin UIs separate without three apps.

---

## 7. Frontend architecture

### 7.1 Surfaces

| Surface | Routes | Auth |
| --- | --- | --- |
| Career site | `/`, `/jobs`, `/jobs/[slug]` | None |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password` | Guest; `next` query for return URL |
| Candidate | `/apply/[requisitionId]`, `/applications`, `/profile` | `candidate` |
| Admin | `/admin`, `/admin/requisitions`, `/admin/requisitions/new`, `/admin/requisitions/[id]`, `/admin/requisitions/[id]/applications`, `/admin/applications/[id]`, `/admin/notifications` | `admin` |

Admin is **not** a separate hostname in Phase 1 (`admin.talentbridge.com` in wireframes is branding). Path prefix `/admin` is enough. Middleware rejects non-admin users.

### 7.2 Apply flow (wizard)

Four steps, client state + server draft:

1. Bio-Data  
2. Education (repeatable)  
3. Work Experience (repeatable **or** `is_fresher`)  
4. Resume + cover note + two consents → Submit  

`Save & Continue` `PUT`s a **draft** application. Browser refresh must restore the last saved step.

After login from Apply, redirect to `/apply/{requisitionId}` using `?next=` (FR-AUTH-06).

### 7.3 Public job pages

- Listing: cards with title, department, location, employment type, experience, relative posted date, Apply, Share.
- Detail: description (HTML sanitized), overview rail, Apply, Share.
- Share: `navigator.clipboard.writeText(canonicalUrl)` plus Web Share API when present. No login.

Only `status = published` jobs are requested from `GET /api/v1/jobs`.

### 7.4 Admin console

- Requisitions list: status, application count, create/edit/publish/close.
- Extra fields from wireframe notes (not in §9.5 table but required on the create screen): **Maximum Salary Budget**, **Hiring shall be completed by**.
- Applications grid per requisition: name, applied on, experience years, location, resume link, status, row click → full application.
- Inline status update.
- Notification bell: unread count of `NEW_APPLICATION` events.

### 7.5 UX constraints

- Mandatory fields marked `*`; client validation mirrors Pydantic, server is authoritative.
- Submit disabled until resume + both consents.
- Empty states: no published jobs; no applications yet.
- Responsive layout (desktop + mobile web). No native app.

---

## 8. Backend architecture

### 8.1 Layers

```
routers  →  services  →  models / storage / email
              ↑
           schemas (request/response)
```

- **Routers:** HTTP, status codes, auth dependencies. No SQL.
- **Services:** use cases (publish requisition, submit application).
- **Schemas:** Pydantic v2, field lengths from BRD §9.
- **Models:** SQLAlchemy tables.

### 8.2 API prefix

All JSON under `/api/v1`. FastAPI serves this. Next.js rewrites `/api/v1/*` to the API container so the browser stays same-origin (simpler cookies).

### 8.3 REST map

**Auth**

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | public | Candidate signup (name, email, mobile, password) |
| POST | `/api/v1/auth/login` | public | Email + password → set cookies |
| POST | `/api/v1/auth/logout` | any | Clear cookies |
| GET | `/api/v1/auth/me` | user | Current user + role |
| POST | `/api/v1/auth/forgot-password` | public | Always 202; email reset link if user exists |
| POST | `/api/v1/auth/reset-password` | public | Token + new password |

**Public jobs**

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/jobs` | public | Published jobs; `q`, `department`, `location`, `experience` |
| GET | `/api/v1/jobs/{slug}` | public | Job detail; 404 if not published |

**Candidate profile & apply**

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET/PUT | `/api/v1/me/profile` | candidate | Bio-data |
| GET/PUT | `/api/v1/me/education` | candidate | Replace list of education rows |
| GET/PUT | `/api/v1/me/experience` | candidate | Replace list, or `{ is_fresher: true }` |
| POST | `/api/v1/jobs/{id}/applications/draft` | candidate | Create/update draft |
| POST | `/api/v1/jobs/{id}/applications` | candidate | Final submit (multipart: resume + JSON fields) |
| GET | `/api/v1/me/applications` | candidate | My Applications |
| GET | `/api/v1/me/applications/{id}` | candidate | Confirmation / detail |

**Admin**

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/api/v1/admin/requisitions` | admin | List / create |
| GET/PATCH | `/api/v1/admin/requisitions/{id}` | admin | Get / edit |
| POST | `/api/v1/admin/requisitions/{id}/publish` | admin | Draft → Published |
| POST | `/api/v1/admin/requisitions/{id}/close` | admin | → Closed |
| GET | `/api/v1/admin/requisitions/{id}/applications` | admin | Grid; `q`, `status` |
| GET | `/api/v1/admin/applications/{id}` | admin | Full application |
| PATCH | `/api/v1/admin/applications/{id}/status` | admin | Status transition |
| GET | `/api/v1/admin/requisitions/{id}/applications.csv` | admin | Export |
| GET | `/api/v1/admin/notifications` | admin | List |
| POST | `/api/v1/admin/notifications/read` | admin | Mark read |

**Files**

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/files/resumes/{applicationId}` | owner or admin | Stream resume; Content-Disposition |
| GET | `/api/v1/files/photos/{userId}` | owner or admin | Profile photo |

Public URLs never point at raw disk paths. Resume links in the admin grid hit the files endpoint (authz checked).

### 8.4 Error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Resume is required",
    "fields": { "resume": "File is required" }
  }
}
```

Stable codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` (duplicate apply), `VALIDATION_ERROR`, `REQUISITION_NOT_OPEN`.

---

## 9. Database design

PostgreSQL. UUIDs as primary keys. Human IDs generated in the service layer.

### 9.1 ER overview

```
users 1──1 candidate_profiles
  │ 1
  │
  ├──< educations
  ├──< experiences
  ├──< applications >──1 requisitions
  │         │
  │         └── resume_object_key, cover_note, consents, status
  └──< notifications
  └──< password_reset_tokens
```

### 9.2 Tables

**users**

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| email | CITEXT UNIQUE NOT NULL | Login ID; verified flag for future |
| password_hash | TEXT NOT NULL | bcrypt/argon2 |
| role | ENUM(`candidate`,`admin`) | |
| first_name, last_name | VARCHAR(50) | |
| mobile | VARCHAR(20) | E.164-ish |
| email_verified_at | TIMESTAMPTZ NULL | Phase 1: set on register (no verify gate) |
| created_at, updated_at | TIMESTAMPTZ | |

Seed one admin from env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) on first boot.

**candidate_profiles**

| Column | Type | Notes |
| --- | --- | --- |
| user_id | UUID PK/FK | |
| gender | ENUM NULL | male/female/other/prefer_not |
| date_of_birth | DATE NULL | |
| current_location | VARCHAR(120) NOT NULL after first save | City, State/Country |
| current_company | VARCHAR(120) NULL | |
| notice_period | ENUM NULL | immediate / 15 / 30 / 60 / 90_plus |
| current_address | TEXT NULL | |
| photo_key | TEXT NULL | JPG/PNG ≤ 2 MB |
| is_fresher | BOOLEAN NOT NULL DEFAULT false | |
| total_experience_years | NUMERIC(4,1) NOT NULL DEFAULT 0 | Derived from experience rows |

**educations**

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | |
| degree | VARCHAR(120) NOT NULL | |
| specialization | VARCHAR(120) NULL | |
| institution | VARCHAR(200) NOT NULL | |
| year_of_passing | INT NOT NULL | 4-digit, ≤ current year |
| grade | VARCHAR(40) NULL | |
| education_level | ENUM NOT NULL | high_school / diploma / bachelors / masters / doctorate |
| sort_order | INT | |

**experiences**

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | |
| employer | VARCHAR(200) | Required unless profile.is_fresher |
| job_title | VARCHAR(200) | Same |
| start_date | DATE | |
| end_date | DATE NULL | Null if current |
| is_current | BOOLEAN | |
| responsibilities | VARCHAR(1000) NULL | |

**requisitions**

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| requisition_code | VARCHAR(20) UNIQUE | `REQ-2026-00417` |
| slug | VARCHAR(160) UNIQUE | Public URL |
| title | VARCHAR(100) NOT NULL | |
| department | VARCHAR(80) NOT NULL | Controlled list |
| location | VARCHAR(120) NOT NULL | May be `Remote` |
| employment_type | ENUM | full_time / part_time / contract / internship |
| experience_range | VARCHAR(40) NOT NULL | e.g. `5-8 years` |
| openings | INT NOT NULL CHECK > 0 | |
| hiring_manager | VARCHAR(120) NOT NULL | Text in Phase 1 |
| description_html | TEXT NOT NULL | Sanitized rich text |
| max_salary_budget | NUMERIC(12,2) NULL | Wireframe extra |
| hiring_complete_by | DATE NULL | Wireframe extra |
| status | ENUM | `draft` / `published` / `closed` |
| posted_at | TIMESTAMPTZ NULL | Set on first publish |
| created_by | UUID FK users | |
| created_at, updated_at | TIMESTAMPTZ | |

Code format: `REQ-{YYYY}-{seq}` with a yearly sequence table or `MAX+1` inside a transaction.

**applications**

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| application_code | VARCHAR(20) UNIQUE | `APP-88213` |
| requisition_id | UUID FK | |
| candidate_id | UUID FK users | |
| status | ENUM | `draft` / `new` / `reviewed` / `shortlisted` / `rejected` |
| cover_note | TEXT NULL | ≤ ~500 words |
| resume_key | TEXT NULL | Required when status ≠ draft |
| resume_filename | VARCHAR(255) | Original name |
| resume_content_type | VARCHAR(80) | |
| consent_accuracy | BOOLEAN NOT NULL DEFAULT false | |
| consent_privacy | BOOLEAN NOT NULL DEFAULT false | |
| submitted_at | TIMESTAMPTZ NULL | |
| snapshot_json | JSONB NULL | Frozen bio/edu/exp at submit time |
| created_at, updated_at | TIMESTAMPTZ | |

Constraints:

- Unique `(candidate_id, requisition_id)` where `status <> 'draft'` **or** unique on all rows and treat draft as upsert. Prefer: **one row per (candidate, requisition)**; draft is updated in place; submit flips `draft → new`.
- Submit allowed only if requisition `status = published`.
- `total_experience_years` copied onto snapshot for the admin grid (so later profile edits do not rewrite history).

**Why snapshot_json:** Admin must see what was submitted, not a live-edited profile. On submit, copy profile + education + experience into JSONB (and keep FKs for convenience).

**notifications**

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | Admin recipient |
| type | ENUM | `new_application` |
| title, body | TEXT | |
| requisition_id, application_id | UUID NULL | |
| read_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ | |

**password_reset_tokens**

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK | |
| token_hash | TEXT UNIQUE | Store hash, not raw token |
| expires_at | TIMESTAMPTZ | Short TTL (e.g. 1 hour) |
| used_at | TIMESTAMPTZ NULL | |

### 9.3 Indexes

- `requisitions (status, posted_at DESC)` for public listing
- `requisitions (slug)`, `(requisition_code)`
- `applications (requisition_id, submitted_at DESC)`
- `applications (candidate_id)`
- `notifications (user_id, read_at, created_at DESC)`
- `users (email)` unique

### 9.4 Status machines

**Requisition**

```
draft ──publish──▶ published ──close──▶ closed
  ▲                   │
  └── edit ───────────┘  (edit allowed in draft and published)
```

Closed is terminal for public visibility. Admin can still read applications. Re-open is **not** in Phase 1 (can be a later PATCH).

**Application**

```
draft ──submit──▶ new ──▶ reviewed ──▶ shortlisted
                              └──▶ rejected
                   new ──▶ shortlisted | rejected
```

No transitions out of `rejected` / `shortlisted` in Phase 1 except admin override if needed (keep PATCH permissive among the four non-draft states).

---

## 10. Core use-case designs

### 10.1 Publish requisition

1. Admin creates row `status=draft` (or publishes immediately).
2. Validate mandatory fields (title, department, location, type, experience, openings, hiring manager, description).
3. On publish: set `status=published`, `posted_at=now()` if null, generate slug if missing.
4. Public `GET /jobs` includes it immediately. No cache invalidation bus; listing is a live query. Optional short HTTP cache (`Cache-Control: max-age=30`) on public GET.

### 10.2 Apply (happy path)

1. `GET /jobs/{slug}` public.
2. Click Apply → if no session, `/login?next=/apply/{id}`.
3. After auth, load profile into step 1 (empty if first time).
4. Each step `PUT`s profile/education/experience and upserts application `status=draft`.
5. Step 4: `POST /jobs/{id}/applications` multipart:
   - Validate published
   - Validate unique submit
   - Validate resume MIME + size
   - Validate consents true
   - Store file via storage adapter
   - Set `status=new`, `submitted_at`, `application_code`, `snapshot_json`
   - Insert notification for every `role=admin` user
   - Enqueue/send two emails: candidate confirmation, admin “new application”
6. Response includes `application_code`, `submitted_at`, `status`.
7. UI confirmation page (wireframe 8.6).

### 10.3 Duplicate apply

If a `new|reviewed|shortlisted|rejected` row exists for `(candidate, requisition)`: `409 CONFLICT`. UI: “You have already applied” + link to My Applications.

### 10.4 Resume download

Admin grid “View” → `GET /api/v1/files/resumes/{applicationId}` with cookie. Service checks `admin` or owning candidate. Stream from storage. Do not put resumes in a public bucket.

---

## 11. AuthN / AuthZ

- Passwords: Argon2id (or bcrypt if Argon2 is painful on Windows). Never store plaintext.
- Session: `access_token` (short, 15 min) + `refresh_token` (7 days) as `HttpOnly; Secure; SameSite=Lax` cookies.
- CSRF: SameSite=Lax is enough for this cookie pattern on same-origin via Next rewrite. If web and API split across origins in prod, add CSRF token or use a BFF.
- Authorization: FastAPI dependency `require_role("admin")` / `require_role("candidate")`.
- IDOR: every application/file fetch checks owner or admin.
- Rate limit login and forgot-password (e.g. 5 / 15 min per IP+email) to slow stuffing.
- Forgot-password: constant-time response (do not reveal whether email exists).
- Admin accounts are **not** self-serve. Seeded or created by existing admin (Phase 1: env seed only).

OAuth (Google/LinkedIn) is a stub in the UI at most; do not implement unless leftover time.

---

## 12. Files and email

### 12.1 Storage adapter

```python
class Storage:
    def put(self, key: str, data: bytes, content_type: str) -> None: ...
    def get(self, key: str) -> BinaryIO: ...
    def delete(self, key: str) -> None: ...
```

- **Local:** `./data/uploads/{resumes|photos}/{uuid}`
- **S3:** same keys, bucket from env

Resume validation: extension + magic-byte sniff; reject HTML/EXE. Max 5 MB. Photo: JPEG/PNG, 2 MB.

### 12.2 Email adapter

```python
class Mailer:
    def send(self, to: str, subject: str, html: str) -> None: ...
```

- Local: log to stdout **and** Mailhog (`smtp://mailhog:1025`)
- Prod: SMTP (Resend/SES/Gmail app password)

Templates:

1. Candidate: “Application submitted — {title} — {application_code}”
2. Admin: “New application for {requisition_code}: {candidate_name}”

Email failure must **not** roll back the application. Log and surface in admin later if needed. Application commit first, then notify.

---

## 13. Validation (BRD §9)

Server-side rules (Pydantic), duplicated loosely in the UI:

| Area | Rules |
| --- | --- |
| Names | required, max 50 |
| Email | valid, unique |
| Mobile | required, country code |
| Location | required on profile complete |
| Education | ≥ 1 row; year 4-digit, not future; level enum |
| Experience | if not fresher: ≥ 1 row with employer, title, start; end hidden if current |
| Total years | computed from date ranges (inclusive months / 12, 1 decimal) |
| Resume | required on submit; pdf/doc/docx; ≤ 5 MB |
| Cover note | optional; cap ~500 words |
| Consents | both true |
| Job title | max 100 |
| Openings | positive int |
| Description | required; store sanitized HTML |

---

## 14. Security (assignment-level, not enterprise)

- Parameterized SQL only (ORM).
- Sanitize job description HTML (allow a small tag set).
- Helmet-equivalent headers on Next.js.
- Do not log passwords, tokens, or resume bytes.
- `.env` not committed; `.env.example` documented.
- File keys are UUIDs, not original filenames on disk.
- CORS locked to the web origin if API is exposed separately.
- Admin routes never in the public sitemap.

Privacy: consents stored on the application row with timestamp. Retention policy is out of scope; document “files kept until admin deletes” as a limitation.

---

## 15. Deployment and local run

### 15.1 Docker Compose (developer default)

Services: `db` (Postgres 16), `api` (uvicorn), `web` (next dev or start), `mailhog`.

```
docker compose up --build
```

- Web: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`
- Mailhog: `http://localhost:8025`

### 15.2 Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres DSN |
| `SECRET_KEY` | JWT signing |
| `ACCESS_TOKEN_TTL_MIN` | default 15 |
| `REFRESH_TOKEN_TTL_DAYS` | default 7 |
| `UPLOAD_DIR` or `S3_*` | file backend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | mail |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | bootstrap admin |
| `PUBLIC_BASE_URL` | share links + emails |
| `NEXT_PUBLIC_API_BASE` | empty if rewritten |

### 15.3 Test credentials (to put in README)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@talentbridge.local` | `Admin@12345` |
| Candidate | `priya@example.com` (seed optional) | `Candidate@123` |

---

## 16. AI / RAG (not Phase 1)

BRD out of scope: “Resume parsing / AI-based candidate-job matching or scoring.”

If a later phase or extra credit is needed, add **one** feature, not a platform:

**Semantic job search (candidate side)**  
Embed `title + description` of published requisitions into `pgvector`. Query = search box text. Hybrid: keyword `ILIKE` + vector. No LangChain required.

**Do not** build a matching score for the admin grid until structured data + resumes are solid. A fake score would hurt trust.

Schema hook: `requisitions.embedding vector(1536)` nullable. Leave unused in Phase 1.

---

## 17. Testing approach

| Layer | What |
| --- | --- |
| API unit/integration | pytest: register, apply without resume → 422, apply twice → 409, draft job not in public list, admin-only 403 |
| Authz | candidate cannot GET admin routes or another user’s resume |
| DB | unique application constraint |
| Web | Playwright smoke: public list → apply → login → 4 steps → confirmation; admin sees row |
| Manual | BRD §11 acceptance criteria as a checklist in README |

Phase 1 does not need 100% coverage. It needs the five acceptance criteria in §11 to pass.

---

## 18. Implementation sequence

Build in this order so each slice is demoable:

1. **Skeleton** — Compose, FastAPI health, Next.js pages, Postgres, Alembic  
2. **Auth** — register/login/me/logout, role middleware, seed admin  
3. **Requisitions** — admin CRUD, draft/publish/close, public list + detail + share  
4. **Profile** — bio, education, experience, fresher, derived years  
5. **Apply** — draft + submit + resume storage + confirmation IDs  
6. **Notify** — in-app + email adapters  
7. **Admin grid** — list, filters, status, full view, resume download, CSV  
8. **Polish** — forgot password, My Applications, validation messages, empty states  
9. **Docs** — README (assignment sections), OpenAPI, test credentials  

Skip OAuth, clone-requisition, and AI until 1–8 work.

---

## 19. Key decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Two apps vs one | Next.js + FastAPI | Assignment wants REST; UI stays thin. |
| SQL vs document DB | PostgreSQL | Applications, uniqueness, statuses are relational. |
| Profile vs snapshot | Live profile for reuse + JSON snapshot on submit | FR-AUTH-07 vs honest admin review. |
| One application row per pair | Upsert draft then submit | Simplifies save-and-continue and duplicate rule. |
| Files outside DB | Object key + streaming endpoint | DB stays small; authz stays in API. |
| Email non-blocking | Commit application, then send | Candidate must not lose a submit because SMTP is down. |
| Admin via path, not subdomain | `/admin` | One deploy, one cookie domain. |
| AI deferred | pgvector column reserved, unused | BRD forbids matching in Phase 1; avoid fake intelligence. |
| OAuth deferred | Email/password only | Could-have; password reset is Must. |
| Hiring manager | Free text | No hiring-manager login in Phase 1. |

---

## 20. Risks

| Risk | Mitigation |
| --- | --- |
| Scope creep (AI, OAuth, ATS) | This document’s non-goals. Ship journey §5 first. |
| Resume malware | MIME + size + authenticated download only. |
| Duplicate submits (double click) | Unique constraint + idempotent submit. |
| Public job leak of drafts | Query **must** filter `status=published`; tests for draft/closed. |
| Windows + Docker friction | Document native `uv`/`npm` fallback in README. |
| SMTP in demo | Mailhog + console mailer so local always “works”. |

---

## 21. Mapping: BRD user journey → system

| Journey step | UI | API | Data |
| --- | --- | --- | --- |
| Admin login | `/login` | `POST /auth/login` | users |
| Create requisition | `/admin/requisitions/new` | `POST /admin/requisitions` | requisitions draft |
| Validate / publish | same form | `POST .../publish` | status, posted_at, slug |
| Candidate careers | `/jobs` | `GET /jobs` | published only |
| Job detail | `/jobs/[slug]` | `GET /jobs/{slug}` | |
| Share | button | none (client URL) | `PUBLIC_BASE_URL` |
| Apply | `/apply/[id]` | gated | |
| Create/login | `/login?next=` | register/login | users |
| Bio / edu / exp | wizard | `PUT /me/*` + draft | profile tables |
| Resume submit | step 4 | `POST /jobs/{id}/applications` | applications + file |
| Confirmation | `/applications/{id}/confirmation` | GET | application_code |
| Admin monitor | bell | `GET /admin/notifications` | notifications |
| Application grid | `/admin/requisitions/{id}/applications` | GET list | join snapshot |
| Review resume | View | `GET /files/resumes/{id}` | storage |

If those rows work, the assignment’s “core journey as per point 5” is done.

---

## 22. Future improvements (post Phase 1)

- OAuth (Google / LinkedIn)
- Email verification before apply
- Candidate email on status change
- Requisition clone
- Hiring-manager role (read shortlist only)
- Resume parse + structured extract
- Semantic search / match score (pgvector)
- External job-board publish
- Retention/deletion for GDPR-style requests
- Native mobile

---

## 23. Open questions (defaults if unanswered)

| Question | Default for build |
| --- | --- |
| Product name in UI | **TalentBridge** (BRD wireframes) unless branding is supplied |
| Departments list | Engineering, Product, Design, Analytics, People Ops, Marketing, QA (from mockups) + Other |
| Can admin reopen a closed job? | No in Phase 1 |
| Can candidate withdraw? | No in Phase 1 |
| Multiple admins? | Yes; all admins get the notification |
| Rich text editor | Simple textarea with markdown-to-HTML **or** a small rich-text control; sanitize on save |

---

*End of architecture. Implement against section 18; accept against BRD §11.*
