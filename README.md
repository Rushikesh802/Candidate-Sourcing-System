# TalentBridge — Candidate Sourcing & Recruitment Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Demo Video](https://img.shields.io/badge/Demo-Google%20Drive-EA4335?logo=googledrive&logoColor=white)](https://drive.google.com/file/d/14nq0OBZLXEJSYjTCmDS3Ohlt0kS825eI/view)

TalentBridge is an enterprise-grade, end-to-end recruitment and candidate sourcing platform built to streamline the hiring journey for recruiters, hiring managers, and job seekers. The system provides complete requisition lifecycle management, a public SEO-friendly careers portal, a frictionless 4-step candidate application wizard with resume validation and snapshot freezing, automated asynchronous notifications, and an administrative candidate review pipeline with inline document streaming.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Understanding](#2-problem-understanding)
3. [Features Implemented](#3-features-implemented)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture & Approach](#5-system-architecture--approach)
6. [Database Design](#6-database-design)
7. [API Documentation & Overview](#7-api-documentation--overview)
8. [Setup and Installation Instructions](#8-setup-and-installation-instructions)
9. [Environment Variables & Configuration](#9-environment-variables--configuration)
10. [How to Run the Project Locally](#10-how-to-run-the-project-locally)
11. [Test Credentials](#11-test-credentials)
12. [Testing Approach & Acceptance Criteria](#12-testing-approach--acceptance-criteria)
13. [Known Limitations](#13-known-limitations)
14. [Future Improvements](#14-future-improvements)
15. [Live Deployment & Demo](#15-live-deployment--demo)

---

## 1. Project Overview

TalentBridge is structured as a decoupled monorepo combining a high-throughput **FastAPI** backend with a modern **Next.js 14** App Router frontend, backed by **PostgreSQL 16**.

### Core Ecosystem Components:
- **Public Career Portal**: Open, SEO-optimized job catalog allowing anonymous visitors to search, filter by department/location/experience, inspect job details, and share postings via native Web Share API or clipboard copy.
- **Candidate Portal & Apply Wizard**: Multi-step application workflow featuring candidate profile persistence (education, experience calculation, fresher flag), resume magic-byte validation, and point-in-time snapshot freezing upon submission.
- **Admin Recruitment Console**: Administrative hub for talent acquisition teams to create, edit, duplicate, publish, and close requisitions, review candidates with embedded PDF resume streaming, manage applicant statuses, and export candidate data to CSV.
- **Automated Communication Hub**: Non-blocking in-app notification center for recruiters and asynchronous transactional emails (application confirmation, status updates) dispatched via SMTP.

---

## 2. Problem Understanding

Modern talent sourcing systems encounter major operational bottlenecks, poor applicant conversion rates, and data integrity challenges:

| Challenge | Impact on Recruitment | TalentBridge Solution |
| :--- | :--- | :--- |
| **Forced Pre-Authentication** | Candidates drop off when required to register before reading full job descriptions or sharing links. | Public job exploration is completely unauthenticated. Authentication is prompted only when clicking "Apply Now" with automatic `next=/apply/{id}` redirection. |
| **Profile Mutation After Submission** | Candidates editing their profiles post-submission alters historical data, invalidating interview records. | Every submitted application creates an immutable **point-in-time JSON snapshot** (`snapshot_json`) capturing candidate bio-data, education, experience, and calculated tenure at submission. |
| **Document Security & IDOR** | Unprotected direct storage links allow unauthorized users to download private candidate resumes. | Resumes are stored using UUID-based abstraction keys. The `/api/v1/files/resumes/{application_id}` endpoint enforces strict Insecure Direct Object Reference (IDOR) controls: only admins or the owning candidate can stream documents. |
| **Overlapping Experience Calculation** | Candidates enter overlapping employment dates, inflating total years of experience. | Automatic date-range union algorithm computes true, non-overlapping total years and months of experience. |
| **Recruiter Notification Latency** | Slow email dispatch can block HTTP response threads and delay candidate review. | Non-blocking background worker dispatches SMTP emails asynchronously while writing instant in-app alerts to the admin notification bell. |

---

## 3. Features Implemented

### 🌟 Candidate & Public Experience
- **Job Discovery (`/jobs`)**:
  - Full-text search on job titles and descriptions.
  - Multi-criteria filtering by Department, Location, and Experience Range.
  - Displays only `published` positions (draft and closed positions return 404).
- **Job Detail & Social Sharing (`/jobs/[slug]`)**:
  - Detailed overview with formatted description, requirements, salary range, and hiring timeline.
  - Native Web Share API integration with automatic fallback to clipboard URL copying.
- **Authentication & Account Management (`/login`, `/register`, `/forgot-password`, `/reset-password`)**:
  - Secure Argon2id password hashing.
  - JWT authentication stored in secure HttpOnly cookies.
  - Rate-limited login attempts with clear error feedback.
- **Persistent Candidate Profile (`/profile`)**:
  - Bio-data management (Full Name, Phone, Current Location, Avatar Upload).
  - Multiple educational qualifications (Degree, Institution, Year of Passing, Score/Grade).
  - Chronological work experience with "Fresher" toggle and non-overlapping experience calculation.
- **4-Step Application Wizard (`/apply/[requisitionId]`)**:
  - **Step 1: Bio-Data Confirmation** (pre-populated from profile).
  - **Step 2: Education Qualifications** (add/edit inline).
  - **Step 3: Work Experience** (toggle fresher status or specify role history).
  - **Step 4: Resume Upload & Consent** (file upload with validation ≤ 5MB, cover note, mandatory accuracy & data privacy declarations).
- **Application Tracking (`/applications`, `/applications/[id]/confirmation`)**:
  - Human-readable tracking ID (`APP-YYYY-NNNNN`).
  - Real-time status tracker (`New`, `Under Review`, `Shortlisted`, `Rejected`).

---

### 🛡️ Admin & Recruiter Console
- **Requisition Management (`/admin/requisitions`)**:
  - Requisition creation with auto-generated requisition codes (`REQ-YYYY-NNNNN`) and URL slugs.
  - Full lifecycle actions: Draft $\rightarrow$ Publish $\rightarrow$ Close $\rightarrow$ Duplicate.
  - Rich text description formatting with HTML sanitization.
- **Applicant Review Grid (`/admin/requisitions/[id]/applications`)**:
  - Filter applicants by review status and search by candidate name/email.
  - Inline PDF resume streaming preview modal without downloading.
  - Real-time status update dropdown (`New`, `Under Review`, `Shortlisted`, `Rejected`).
  - Single-click CSV export of all applicants for the requisition.
- **Deep Application Snapshot Review (`/admin/applications/[id]`)**:
  - Full audit trail displaying frozen candidate snapshot at submission time.
  - Candidate declarations, contact details, total calculated experience, and cover notes.
- **Cross-Requisition Pipeline Dashboard (`/admin/applications`)**:
  - Global candidate sourcing table with requisition filters, search, and global CSV export.
- **Notification Center (`/admin/notifications`)**:
  - Polling header bell with unread badge counter.
  - Notification drawer with direct jump links to candidate applications and bulk "Mark all as read" capability.

---

## 4. Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI** (Python 3.11+) | High-performance async REST API framework |
| **ORM & Migrations** | **SQLAlchemy 2.0**, **Alembic** | Type-safe database models, session management, and schema migrations |
| **Data Validation** | **Pydantic v2** | Request validation, serialization, and settings management |
| **Frontend Web** | **Next.js 14** (App Router, React 18, TypeScript) | Server & Client components, static generation, dynamic routing |
| **Styling & UI** | **Tailwind CSS**, **Lucide Icons** | Responsive enterprise design system |
| **Database** | **PostgreSQL 16** | Relational data store with JSONB snapshots, UUIDs, and foreign key cascades |
| **Authentication** | **Argon2id**, **JWT** | Secure password hashing, token encoding, and HttpOnly cookies |
| **Storage Engine** | Abstracted `StorageAdapter` | Local storage with UUID keys (swappable with AWS S3 / Cloud Storage) |
| **Email & Alerts** | **SMTP / aiosmtplib**, **Mailhog** | Non-blocking transactional emails and local email capture sandbox |
| **Containerization** | **Docker**, **Docker Compose** | Multi-container orchestration for API, Web, Database, and Mailhog |
| **Package Management**| **`uv`** (Python), **`npm`** (Node.js) | Fast dependency resolution and environment management |

---

## 5. System Architecture & Approach

TalentBridge uses a layered service architecture designed for maintainability and clear separation of concerns:

```
Candidate-Sourcing-System/
├── apps/
│   ├── api/                           # FastAPI Application
│   │   ├── alembic/                   # Database migration scripts
│   │   ├── app/
│   │   │   ├── core/                  # Database session, config, security, dependencies
│   │   │   ├── models/                # SQLAlchemy ORM models & enums
│   │   │   ├── routers/               # Route controllers (Auth, Jobs, Profile, Admin, Files)
│   │   │   ├── schemas/               # Pydantic request & response models
│   │   │   └── services/              # Business logic (Mailer, Storage, Snapshots, Requisitions)
│   │   └── tests/                     # Pytest automated test suites (Phases 1–8)
│   └── web/                           # Next.js Application
│       ├── public/                    # Static assets
│       └── src/
│           ├── app/                   # App Router: (public), (auth), (candidate), (admin)
│           ├── components/            # Reusable UI components & layouts
│           ├── context/               # AuthContext & state providers
│           ├── lib/                   # API client (`fetchApi`), utilities
│           └── types/                 # TypeScript type definitions
├── docker-compose.yml                 # Local multi-service orchestration
├── render.yaml                        # Production deployment blueprint
└── README.md                          # Project documentation
```

### Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                   |
|   Public Visitors             Candidates                     Administrators       |
|   (/jobs, /jobs/[slug])       (/profile, /apply, /apps)      (/admin/*)           |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           NEXT.JS 14 FRONTEND (Port 3000)                         |
|   App Router | Tailwind CSS | AuthContext | Typed API Client | PDF Viewer Modal   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (REST / JSON / Multipart)
+-----------------------------------------------------------------------------------+
|                           FASTAPI BACKEND (Port 8000)                             |
|  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────────────────┐   |
|  │  Auth & Security  │  │  Job & Requisition│  │   Application & Snapshots    │   |
|  │  Argon2id + JWT   │  │  Lifecycle Engine │  │   Magic-Byte Resume Validator│   |
|  └───────────────────┘  └───────────────────┘  └──────────────────────────────┘   |
|  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────────────────┐   |
|  │ IDOR File Router  │  │ Admin Review Pipe │  │ Async Notification Service   │   |
|  │ UUID Key Resolver │  │ CSV Exporter      │  │ Background Tasks / Mailer    │   |
|  └───────────────────┘  └───────────────────┘  └──────────────────────────────┘   |
+-----------------------------------------------------------------------------------+
            │                                  │                        │
            ▼                                  ▼                        ▼
+-----------------------+          +-----------------------+  +---------------------+
|     POSTGRESQL 16     |          |  FILE STORAGE ENGINE  |  |  SMTP / MAILHOG     |
| Relational DB + JSONB |          | Local Disk / S3 Hook  |  | Inbox: Port 8025    |
+-----------------------+          +-----------------------+  +---------------------+
```

---

## 6. Database Design

The PostgreSQL database enforces relational integrity, indexing on searchable fields, and JSONB immutability:

```
  +----------------------+             +--------------------------+
  |        users         | 1         1 |    candidate_profiles    |
  +----------------------+-------------+--------------------------+
  | id (PK UUID)         |             | id (PK UUID)             |
  | email (Unique)       |             | user_id (FK -> users)    |
  | role (Enum)          |             | full_name (String)       |
  | password_hash        |             | phone (String)           |
  | is_active (Boolean)  |             | is_fresher (Boolean)     |
  | created_at           |             | current_location (String)|
  +----------------------+             +--------------------------+
             | 1                                     | 1
             |                                       |
             | N                                     | N
             v                                       v
  +----------------------+             +--------------------------+
  |    notifications     |             | educations / experiences |
  +----------------------+             +--------------------------+
  | id (PK UUID)         |             | id (PK UUID)             |
  | user_id (FK -> users)|             | profile_id (FK)          |
  | title / message      |             | institution / company    |
  | is_read (Boolean)    |             | degree / designation     |
  | link_url / created_at|             | start_date / end_date    |
  +----------------------+             +--------------------------+

                                                     | 1
                                                     |
                                                     v N
  +----------------------+             +--------------------------+
  |     requisitions     | 1         N |       applications       |
  +----------------------+-------------+--------------------------+
  | id (PK UUID)         |             | id (PK UUID)             |
  | requisition_code (UQ)|             | application_code (Unique)|
  | title / slug (Unique)|             | requisition_id (FK)      |
  | department / location|             | candidate_id (FK->users) |
  | min_exp / max_exp    |             | status (new/review/...)  |
  | status (draft/pub/..) |            | resume_key (String UUID) |
  | description / salary |             | snapshot_json (JSONB)    |
  | openings_count       |             | cover_note (Text)        |
  | created_at           |             | submitted_at (Timestamp) |
  +----------------------+             +--------------------------+
```

### Key Schema Details:
- **`applications.snapshot_json` (JSONB)**: Immutable copy of user profile, contact details, education records, and employment history captured at the moment of submission.
- **`applications.application_code`**: Sequential human-readable code formatted as `APP-YYYY-NNNNN`.
- **`requisitions.requisition_code`**: Sequential requisition code formatted as `REQ-YYYY-NNNNN`.
- **Foreign Key Cascades**: Profile children (`educations`, `experiences`) cascade on delete.

---

## 7. API Documentation & Overview

Interactive Swagger and ReDoc documentation are automatically generated by FastAPI:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Healthcheck**: `GET http://localhost:8000/health`

### Endpoint Catalog:

| Domain | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Public | Healthcheck and service status |
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Register new candidate account |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Authenticate user & set JWT HttpOnly cookies |
| **Auth** | `POST` | `/api/v1/auth/logout` | Public | Clear authentication cookies |
| **Auth** | `GET` | `/api/v1/auth/me` | User | Get current authenticated user details |
| **Auth** | `POST` | `/api/v1/auth/forgot-password` | Public | Trigger password reset email |
| **Auth** | `POST` | `/api/v1/auth/reset-password` | Public | Reset password with token |
| **Jobs** | `GET` | `/api/v1/jobs` | Public | List published jobs with search & filters |
| **Jobs** | `GET` | `/api/v1/jobs/{slug}` | Public | Retrieve published job details by slug |
| **Profile** | `GET`/`PUT`| `/api/v1/me/profile` | Candidate | Read or update candidate bio-data |
| **Profile** | `GET`/`PUT`| `/api/v1/me/education` | Candidate | Read or replace education entries |
| **Profile** | `GET`/`PUT`| `/api/v1/me/experience` | Candidate | Read or replace experience history |
| **Profile** | `GET` | `/api/v1/me/applications` | Candidate | List current candidate's submitted applications |
| **Applications**| `POST` | `/api/v1/jobs/{id}/applications` | Candidate | Submit application with resume & snapshot |
| **Files** | `GET` | `/api/v1/files/resumes/{app_id}` | Owner/Admin | Stream PDF/DOC resume with IDOR protection |
| **Files** | `GET` | `/api/v1/files/photos/{user_id}` | Public | Stream user profile avatar |
| **Admin Reqs** | `GET`/`POST`| `/api/v1/admin/requisitions` | Admin | List all requisitions or create a new one |
| **Admin Reqs** | `GET`/`PATCH`| `/api/v1/admin/requisitions/{id}`| Admin | Get or update requisition specifications |
| **Admin Reqs** | `POST`| `/api/v1/admin/requisitions/{id}/publish` | Admin | Publish a requisition |
| **Admin Reqs** | `POST`| `/api/v1/admin/requisitions/{id}/close` | Admin | Close an active requisition |
| **Admin Reqs** | `POST`| `/api/v1/admin/requisitions/{id}/duplicate` | Admin | Duplicate requisition as a new draft |
| **Admin Apps** | `GET` | `/api/v1/admin/requisitions/{id}/applications` | Admin | List applicants for a specific requisition |
| **Admin Apps** | `GET` | `/api/v1/admin/applications` | Admin | Global cross-requisition application pipeline |
| **Admin Apps** | `GET` | `/api/v1/admin/applications/{id}` | Admin | Get full frozen snapshot of an application |
| **Admin Apps** | `PATCH`| `/api/v1/admin/applications/{id}/status` | Admin | Update candidate status (Shortlist/Reject/etc.) |
| **Admin Apps** | `GET` | `/api/v1/admin/applications/export` | Admin | Export application records to CSV |
| **Notifications**| `GET` | `/api/v1/admin/notifications` | Admin | Get recent recruiter in-app notifications |
| **Notifications**| `POST`| `/api/v1/admin/notifications/read` | Admin | Mark notifications as read |

---

## 8. Setup and Installation Instructions

### Prerequisites
- **Docker & Docker Compose** (version 24.0+)
- *Or for manual setup:*
  - **Python 3.11+** with `uv` (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)
  - **Node.js 18.x or 20.x** & `npm`
  - **PostgreSQL 16**

---

## 9. Environment Variables & Configuration

Create a `.env` file in the project root:

```ini
# --- Application Environment ---
ENVIRONMENT=development
PROJECT_NAME="TalentBridge Candidate Sourcing System"
VERSION=1.0.0

# --- Database Configuration ---
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/candidate_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=candidate_system

# --- Security & JWT Settings ---
SECRET_KEY=change-this-to-a-super-secret-key-at-least-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# --- Seed Admin Credentials ---
ADMIN_EMAIL=admin@talentbridge.local
ADMIN_PASSWORD=Admin@12345

# --- Storage Adapter Configuration ---
UPLOAD_DIR=./uploads

# --- SMTP Mailer & Email Alerts ---
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=no-reply@talentbridge.local
EMAILS_FROM_NAME="TalentBridge Recruitment"

# --- URLs & CORS ---
PUBLIC_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 10. How to Run the Project Locally

### Option A: Using Docker Compose (Recommended)

Start the entire ecosystem (Database, FastAPI, Next.js, and Mailhog) with one command:

```bash
# Clone the repository and navigate to root
git clone <repo-url>
cd Candidate-Sourcing-System

# Start all containers
docker compose up --build
```

Access the services:
- **Public Careers & Web Portal**: [http://localhost:3000](http://localhost:3000)
- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Mailhog Web Mailbox**: [http://localhost:8025](http://localhost:8025)

---

### Option B: Manual Local Setup (Without Docker)

#### 1. Start PostgreSQL
Ensure PostgreSQL is running locally on port `5432` and create the database:
```sql
CREATE DATABASE candidate_system;
```

#### 2. Start Backend API
```bash
cd apps/api

# Create and activate virtual environment with uv
uv venv
# On Windows: .\.venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate

# Install dependencies in editable mode
uv pip install -e ".[dev]"

# Run database migrations
uv run alembic upgrade head

# Start FastAPI development server
uv run uvicorn app.main:app --reload --port 8000
```

#### 3. Start Frontend Web
```bash
cd apps/web

# Install npm dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 11. Test Credentials

The system automatically initializes default seed accounts upon first launch:

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@talentbridge.local` | `Admin@12345` | Manage requisitions, review candidate applications, view snapshots, stream resumes, update statuses, export CSV, and view recruiter notifications |
| **Candidate** | `candidate@talentbridge.local` *(or register any account)* | `Candidate@123` | Browse jobs, build profile, submit applications with resume, and track application status |

---

## 12. Testing Approach & Acceptance Criteria

### Automated Pytest Test Suite
The backend is covered by automated Pytest suites mapped directly to each development phase:

```bash
cd apps/api
uv run pytest -v
```

```
apps/api/tests/
├── test_health.py                     # Healthcheck endpoint verification
├── test_phase1_models.py              # Schema models, constraints, and relationships
├── test_phase2_auth.py                # Argon2id hashing, JWT cookies, rate limiting
├── test_phase3_requisitions.py        # Requisition state transitions & public filters
├── test_phase4_profile.py             # Candidate profile & non-overlapping experience calculation
├── test_phase5_applications.py        # Multi-step apply wizard & snapshot freezing
├── test_phase6_notifications.py       # Admin notification bell & transactional mailer
├── test_phase7_applications_review.py # Recruiter applicant grid, status updater & CSV export
├── test_phase8_acceptance_journey.py  # End-to-end full candidate-to-recruiter hiring journey
└── test_storage.py                    # Storage adapter and magic byte validations
```

### Acceptance Criteria Verification (§11.1–11.5)
- **AC 11.1 (Public Job Visibility)**: Only `published` jobs are queryable by anonymous candidates; `draft` or `closed` jobs return `404 Not Found`.
- **AC 11.2 (Authentication Gate)**: Unauthenticated clicks on "Apply Now" redirect to `/login?next=/apply/{id}` and preserve workflow continuity upon login.
- **AC 11.3 (Application Validation & Snapshots)**: Enforces PDF/DOC/DOCX format $\le 5\text{ MB}$; duplicates return `409 Conflict`; creates an immutable `snapshot_json`.
- **AC 11.4 (Automated Notifications)**: Application submission dispatches async candidate confirmation emails, recruiter alert emails, and in-app admin notifications.
- **AC 11.5 (Admin Review & IDOR Security)**: Recruiters can view applicant pipelines and stream resumes. Direct file access by unauthorized users returns `403 Forbidden`.

---

## 13. Known Limitations

- **OAuth Social Providers**: Google and LinkedIn authentication buttons are currently UI stubs ready for OpenID Connect integration.
- **Storage Adapter**: Default configuration uses local disk storage (`LocalStorage`). In multi-region deployments, switch to an S3 or Google Cloud Storage adapter via the `StorageAdapter` interface.
- **Single-Tenant Scope**: Designed as an enterprise single-tenant system with role-based access control (Admin / Candidate).

---

## 14. Future Improvements

1. **AI Resume Parsing (LLM/OCR)**: Automated extraction of candidate skills, education, and work history to pre-fill profile fields.
2. **pgvector Semantic Search**: Embedding-based job-to-candidate recommendation engine.
3. **Interview Scheduling**: Direct integration with Google Calendar and Microsoft Outlook for shortlisted candidates.
4. **Custom Evaluation Scorecards**: Structured interview feedback forms and rating rubrics for hiring managers.

---

## 15. Live Deployment & Demo

- **Live Video Demonstration**: [Watch Video Demo on Google Drive](https://drive.google.com/file/d/14nq0OBZLXEJSYjTCmDS3Ohlt0kS825eI/view)
- **Local Multi-Service Orchestration**: Fully runnable via Docker Compose (`docker compose up --build`).
- **Cloud Deployment Blueprint**: Configured for Render via [`render.yaml`](file:///C:/Users/RUSHIKESH/Desktop/Candidate-Sourcing-System/render.yaml) (FastAPI Web Service + Next.js Web Service + Managed PostgreSQL).
- **Offline Video Walkthrough**: Local recording file available in [`DEMO.mp4`](file:///C:/Users/RUSHIKESH/Desktop/Candidate-Sourcing-System/DEMO.mp4).

---

&copy; 2026 TalentBridge Inc. Built for high-reliability recruitment operations.
