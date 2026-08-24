# TalentBridge — Candidate Sourcing & Recruitment Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

TalentBridge is an enterprise-grade, end-to-end recruitment and candidate sourcing platform built to streamline the hiring journey for recruiters, hiring managers, and job seekers. The system encompasses full requisition management, a public careers portal, a candidate application wizard with resume parsing/upload, automated non-blocking notifications, and an administrative candidate review pipeline.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Understanding](#problem-understanding)
3. [Features Implemented](#features-implemented)
4. [Technology Stack](#technology-stack)
5. [System Architecture & Approach](#system-architecture--approach)
6. [Database Design](#database-design)
7. [API Overview & Documentation](#api-overview--documentation)
8. [Setup and Installation](#setup-and-installation)
9. [Environment Variables](#environment-variables)
10. [How to Run Locally](#how-to-run-locally)
11. [Test Credentials](#test-credentials)
12. [Testing Approach & Acceptance Criteria](#testing-approach--acceptance-criteria)
13. [Known Limitations](#known-limitations)
14. [Future Improvements](#future-improvements)
15. [Live Demo Link](#live-demo-link)

---

## 1. Project Overview

TalentBridge connects candidates and enterprise talent teams through a high-performance monorepo architecture:
- **Public Career Portal**: Open, SEO-friendly job listings where anonymous candidates can search, filter, view comprehensive job details, and share postings without requiring login.
- **Candidate Application Portal**: Multi-step application wizard featuring profile persistence, educational qualifications, non-overlapping experience calculation, resume document validation, and snapshot freezing upon submission.
- **Admin Recruitment Console**: Robust administrative dashboard for creating, publishing, drafting, closing, duplicating requisitions, reviewing applicants with inline PDF resume streaming, updating review status, and exporting data to CSV.
- **Automated Communication Layer**: Non-blocking in-app notifications for talent teams and transactional email notifications for both candidates and recruiters via SMTP / Mailhog.

---

## 2. Problem Understanding

Modern talent sourcing workflows often suffer from fragmented tools, poor applicant experience, data leakage, and lack of profile immutability:
1. **Friction in Job Sourcing**: Candidates drop off when public postings force authentication prior to reviewing job specifications or copying sharable links.
2. **Duplicate & Inconsistent Applications**: Applicants resubmitting modified resumes or altering their profile after submission can compromise hiring integrity.
3. **Security & Authorization Vulnerabilities (IDOR)**: Exposing candidate contact data or resume storage keys to other applicants or unauthenticated visitors.
4. **Recruiter Overhead**: Inability to quickly filter applicants per requisition, preview documents without third-party tools, or export pipeline data.

**How TalentBridge Solves This:**
- Public job browsing is unauthenticated; authentication is enforced only when initiating an application, with seamless `next=/apply/{id}` return-to-job flow.
- Every submitted application generates an immutable frozen JSON snapshot (`snapshot_json`) capturing candidate bio-data, education, experience history, and calculated total experience at the exact moment of submission.
- Strict IDOR controls ensure only authorized admins or the application owner can stream resume documents.
- Real-time in-app notification center and asynchronous email dispatch ensure recruiters are immediately alerted when candidates apply.

---

## 3. Features Implemented

### Candidate & Public Portal
- **Public Job Listings (`/jobs`)**: Filter by department, location, and experience range; full-text search by title/keywords; only `published` positions are displayed.
- **Job Details & Public Sharing (`/jobs/[slug]`)**: Formatted job overview, salary/openings metadata, hiring timeline, and Web Share API / clipboard copy sharing.
- **Candidate Authentication (`/login`, `/register`, `/forgot-password`, `/reset-password`)**: Argon2id password hashing, JWT HttpOnly access & refresh cookies, and rate-limiting.
- **Reusable Candidate Profile (`/profile`)**: Bio-data, avatar upload, multiple educational qualifications, work experience history with fresher support, and automatic non-overlapping experience year derivation.
- **4-Step Apply Wizard (`/apply/[requisitionId]`)**:
  - Step 1: Bio-data confirmation
  - Step 2: Education qualifications
  - Step 3: Work experience / Fresher declaration
  - Step 4: Resume upload (PDF/DOC/DOCX ≤ 5 MB with magic byte validation), cover note, and mandatory accuracy & privacy policy consent checkboxes.
- **Application Confirmation (`/applications/[id]/confirmation`)**: Displays unique human-readable Application ID (`APP-#####`), submission timestamp, and current review status.
- **My Applications Dashboard (`/applications`)**: Track all submitted applications with real-time status updates (`New`, `Under Review`, `Shortlisted`, `Rejected`).

### Admin Console
- **Requisition Management (`/admin/requisitions`)**: Create, edit, publish, close, and duplicate requisitions with sequential codes (`REQ-YYYY-NNNNN`), slug generation, and HTML sanitization.
- **Requisition Applicant Grid (`/admin/requisitions/[id]/applications`)**: Wireframe 8.2 matching grid with search by candidate name/email, status filtering, inline PDF resume viewer modal, inline status selector, and CSV export.
- **Full Application Snapshot Review (`/admin/applications/[id]`)**: Deep review of frozen candidate profile snapshots, qualifications, experience timeline, cover notes, integrity declarations, and embedded resume streaming.
- **Cross-Requisition Pipeline (`/admin/applications`)**: Unified pipeline across all jobs with requisition filter dropdown, search, status updater, and CSV export.
- **Notification Bell & Center (`/admin/notifications`)**: Live polling header bell with unread badge counter, notification drawer, and bulk mark-as-read actions.

---

## 4. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic |
| **Frontend Web** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Database** | PostgreSQL 16 (Relational tables, foreign keys, indexes, unique constraints) |
| **Authentication** | JWT (JSON Web Tokens) with HttpOnly secure cookies & Argon2id password hashing |
| **Storage Adapter** | Local file storage adapter (`UPLOAD_DIR`) with secure UUID key abstraction |
| **Notification / Mail** | SMTP Mailer adapter with Mailhog local server and console fallback |
| **DevOps / Containers** | Docker, Docker Compose, Multi-stage builds |
| **Package Managers** | `uv` for ultra-fast Python package management; `npm` for Node.js |

---

## 5. System Architecture & Approach

The system follows a clean monorepo architecture with decoupled services:

```
Candidate Sourcing System (Monorepo)
├── apps/
│   ├── api/                     # FastAPI backend
│   │   ├── app/
│   │   │   ├── core/            # Config, database engine, deps, security
│   │   │   ├── models/          # SQLAlchemy ORM models & enums
│   │   │   ├── routers/         # API endpoints (Auth, Requisitions, Applications, Files, etc.)
│   │   │   ├── schemas/         # Pydantic validation & response models
│   │   │   └── services/        # Business logic (Storage, Mailer, Notifications, Requisitions)
│   │   ├── alembic/             # Database migrations
│   │   └── tests/               # Pytest automated test suites
│   └── web/                     # Next.js frontend
│       ├── src/
│       │   ├── app/             # App Router: (public), (auth), (candidate), (admin)
│       │   ├── components/      # UI components & layouts
│       │   ├── context/         # AuthContext & state providers
│       │   ├── lib/             # Typed API client (`fetchApi`)
│       │   └── types/           # TypeScript interfaces & enums
├── docker-compose.yml           # Multi-container orchestration
└── PHASES.md                    # Detailed roadmap & completion tracker
```

For complete technical specifications, see [`architecture.md`](file:///C:/Users/RUSHIKESH/Desktop/Journey%20To%20AI/Candidate%20system/architecture.md).

---

## 6. Database Design

The PostgreSQL database enforces relational integrity and optimal index performance:

```
  +------------------+         +--------------------------+
  |      users       |<--------|    candidate_profiles    |
  +------------------+         +--------------------------+
  | id (PK UUID)     |         | id (PK UUID)             |
  | email (Unique)   |         | user_id (FK -> users)    |
  | role (Enum)      |         | is_fresher (Boolean)     |
  | password_hash    |         | current_location (Text)  |
  +------------------+         +--------------------------+
           |                                |
           | 1:N                            | 1:N
           v                                v
  +------------------+         +--------------------------+
  |  educations /    |         |       requisitions       |
  |  experiences     |         +--------------------------+
  +------------------+         | id (PK UUID)             |
                               | requisition_code (Unique)|
                               | slug (Unique)            |
                               | status (draft/pub/close) |
                               +--------------------------+
                                            |
                                            | 1:N
                                            v
                               +--------------------------+
                               |       applications       |
                               +--------------------------+
                               | id (PK UUID)             |
                               | application_code (Unique)|
                               | requisition_id (FK)      |
                               | candidate_id (FK)        |
                               | status (new/review/...)  |
                               | resume_key (Text)        |
                               | snapshot_json (JSONB)    |
                               | submitted_at (Timestamp) |
                               +--------------------------+
```

---

## 7. API Overview & Documentation

When the backend is running, full interactive OpenAPI Swagger documentation is available at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Core API Endpoints:
- `GET /health` — Service healthcheck
- **Auth**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
- **Public Jobs**: `GET /api/v1/jobs` (published only, search & filters), `GET /api/v1/jobs/{slug}`
- **Candidate Profile**: `GET/PUT /api/v1/me/profile`, `GET/PUT /api/v1/me/education`, `GET/PUT /api/v1/me/experience`, `GET /api/v1/me/applications`
- **Application Submission**: `POST /api/v1/jobs/{id}/applications` (multipart with resume), `POST /api/v1/jobs/{id}/applications/draft`
- **Files**: `GET /api/v1/files/resumes/{application_id}` (IDOR-protected resume stream), `GET /api/v1/files/photos/{user_id}`
- **Admin Requisitions**: `GET/POST /api/v1/admin/requisitions`, `GET/PATCH /api/v1/admin/requisitions/{id}`, `POST .../publish`, `POST .../close`, `POST .../duplicate`
- **Admin Applications**: `GET /api/v1/admin/requisitions/{id}/applications`, `GET /api/v1/admin/applications`, `GET /api/v1/admin/applications/{id}`, `PATCH /api/v1/admin/applications/{id}/status`, `GET .../export` (CSV)
- **Admin Notifications**: `GET /api/v1/admin/notifications`, `POST /api/v1/admin/notifications/read`

---

## 8. Setup and Installation

### Prerequisites
- **Docker & Docker Compose** (Recommended)
- *Or for manual setup:*
  - **Python 3.11+** with `uv` (`curl -LsSf https://astral.sh/uv/install.sh | sh` or `pip install uv`)
  - **Node.js 18+** & `npm`
  - **PostgreSQL 16**

---

## 9. Environment Variables

Create `.env` in the project root:

```ini
# Application Environment
ENVIRONMENT=development
PROJECT_NAME="TalentBridge Candidate Sourcing System"
VERSION=1.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/candidate_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=candidate_system

# Security & Authentication
SECRET_KEY=change-this-to-a-super-secret-key-at-least-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Bootstrap Admin Credentials
ADMIN_EMAIL=admin@talentbridge.local
ADMIN_PASSWORD=Admin@12345

# Storage & Uploads
UPLOAD_DIR=./uploads

# Mailer & Notifications
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=no-reply@talentbridge.local
EMAILS_FROM_NAME="TalentBridge Recruitment"

# URLs
PUBLIC_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000
```

---

## 10. How to Run Locally

### Option A: Running with Docker Compose (Recommended)

```bash
# 1. Start all services (Postgres, API, Web, Mailhog)
docker compose up --build

# 2. Open browser:
# Web Portal:       http://localhost:3000
# API Docs:         http://localhost:8000/docs
# Mailhog Inbox:    http://localhost:8025
```

### Option B: Running Manually Without Docker

```bash
# Terminal 1: Backend API
cd apps/api
uv venv
uv pip install -e ".[dev]"
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend Web
cd apps/web
npm install
npm run dev
```

---

## 11. Test Credentials

The system automatically initializes default seed users on first startup:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@talentbridge.local` | `Admin@12345` | Requisitions Console, Applicant Grid, Status Review, CSV Export, Notification Center |
| **Candidate** | `candidate@talentbridge.local` *(or register any new user)* | `Candidate@123` | Career Portal, Profile Dashboard, Apply Wizard, My Applications |

---

## 12. Testing Approach & Acceptance Criteria

### Automated Pytest Suite
Run the comprehensive automated test suite covering all 8 development phases:

```bash
cd apps/api
uv run pytest
```

### Acceptance Criteria Verification (§11.1–11.5)
- **AC 11.1 (Public Job Visibility)**: Verified in `test_phase3_requisitions.py` and `test_phase8_acceptance_journey.py`. Requisitions in `draft` or `closed` status return `404` and never appear on public listings.
- **AC 11.2 (Authentication Gate)**: Verified in `test_phase2_auth.py` and `test_phase8_acceptance_journey.py`. Unauthenticated apply clicks redirect to login with `next=/apply/{id}` return parameter.
- **AC 11.3 (Application Validation & Snapshots)**: Verified in `test_phase5_applications.py` and `test_phase8_acceptance_journey.py`. Submission requires valid PDF/DOC/DOCX resume file ≤ 5 MB and mandatory declarations; creates immutable `snapshot_json`; duplicate submit returns `409 CONFLICT`.
- **AC 11.4 (Notifications)**: Verified in `test_phase6_notifications.py` and `test_phase8_acceptance_journey.py`. Submitting creates in-app notifications for admins and dispatches candidate & recruiter emails non-blockingly.
- **AC 11.5 (Admin Review & IDOR Security)**: Verified in `test_phase7_applications_review.py` and `test_phase8_acceptance_journey.py`. Recruiter grid lists applicants with resume streaming; candidates attempting to access admin endpoints or another applicant's resume receive `403 FORBIDDEN`.

---

## 13. Known Limitations

- **OAuth Providers**: Google / LinkedIn login buttons are presented in the UI as disabled stubs per specification; social auth can be plugged in via standard OpenID Connect in future iterations.
- **Storage Adapter**: Default configuration uses local disk storage (`LocalStorage`); in multi-region production, swap `LocalStorage` with an S3 / Cloud Storage adapter using the provided `StorageAdapter` interface.

---

## 14. Future Improvements

1. **pgvector Job Recommendations**: Embedding-based job matching to suggest related positions to candidates.
2. **Hiring Manager Review Portals**: Restricted read-only roles scoped to specific departments or assigned requisitions.
3. **Interview Scheduling Integration**: Calendar sync (Google Calendar / Outlook) for shortlisted applicants.
4. **Resume Parsing (OCR/LLM)**: Automated extraction of skills, education, and work history from uploaded resumes to pre-fill profile fields.

---

## 15. Live Demo Link

- **Deployment Status**: Configured for local Docker Compose and self-contained execution.
- **Live URL**: Local containerized deployment at [http://localhost:3000](http://localhost:3000).

---

&copy; 2026 TalentBridge Inc. Built for high-reliability recruitment operations.
