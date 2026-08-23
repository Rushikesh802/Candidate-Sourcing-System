# Phase-wise tasks — Candidate Sourcing System

Companion to `architecture.md`. Each phase is independently demoable. Do not start a later phase until the previous phase’s **exit criteria** pass.

**Priority:** `M` Must · `S` Should · `C` Could (skip if time is tight)  
**Owner default:** one engineer, sequential. Parallel notes are listed where two tracks do not collide.

**BRD journey this plan must complete**

```
Admin:  Login → Create Requisition → Validate → Publish → Monitor → Grid → Review resume
Candidate: Careers → Job Detail → Apply → Login → Bio → Education → Experience → Resume → Submit → Confirmation
Share: Job Detail → copy public link (no login)
```

---

## How to use this file

- Check a box only when the **task acceptance** is true (not when the file exists).
- A phase is **done** only when its exit criteria are all true.
- If a Should (`S`) task is skipped, mark it `- [ ] skipped` and say why in the phase notes.
- Keep Git commits aligned to task IDs, e.g. `feat(P2-03): candidate login`.

---

## Phase 0 — Project skeleton

**Goal:** Another developer can clone, start Docker, and hit a health page.  
**Depends on:** nothing  
**Demo:** `docker compose up` → web + API + Postgres running

### Tasks

- [x] **P0-01** `M` Create monorepo layout (`apps/web`, `apps/api`, `docker-compose.yml`, `.env.example`, `.gitignore`)
- [x] **P0-02** `M` FastAPI app with `GET /health` and OpenAPI at `/docs`
- [x] **P0-03** `M` Next.js App Router + TypeScript + Tailwind; home page placeholder
- [x] **P0-04** `M` Postgres 16 in Compose; `DATABASE_URL` wired
- [x] **P0-05** `M` Alembic initialized; empty first migration runs on API start (or documented `alembic upgrade head`)
- [x] **P0-06** `M` Next.js rewrite `/api/v1/*` → FastAPI (same-origin cookies later)
- [x] **P0-07** `M` `.env.example` with every variable from architecture §15.2
- [x] **P0-08** `S` Mailhog service in Compose (can wait until Phase 6)
- [x] **P0-09** `M` Root README stub: how to run locally (full README is Phase 8)

### Exit criteria

- [x] `docker compose up --build` starts without manual extra steps
- [x] `GET http://localhost:8000/health` returns `{ "status": "ok" }`
- [x] `http://localhost:3000` renders
- [x] API docs open at `http://localhost:8000/docs`

> **Phase 0 Status:** Completed. Monorepo initialized with `uv` for Python (`apps/api`), Next.js App Router + TypeScript + Tailwind (`apps/web`), Docker Compose with Postgres 16 & Mailhog, Alembic baseline migration, API rewrites, and verified tests.

---

## Phase 1 — Data model and seed

**Goal:** Schema matches architecture §9. Admin user exists.  
**Depends on:** Phase 0  
**Demo:** Tables exist; login seed user is in `users`

### Tasks

- [x] **P1-01** `M` SQLAlchemy models: `users`, `candidate_profiles`, `educations`, `experiences`, `requisitions`, `applications`, `notifications`, `password_reset_tokens`
- [x] **P1-02** `M` Enums: user role, requisition status, application status, employment type, education level, notice period, gender, notification type
- [x] **P1-03** `M` Constraints: unique email; unique `(candidate_id, requisition_id)` on applications; unique `requisition_code`, `slug`, `application_code`
- [x] **P1-04** `M` Indexes from architecture §9.3
- [x] **P1-05** `M` Alembic migration committed
- [x] **P1-06** `M` Bootstrap admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on first boot (idempotent)
- [x] **P1-07** `S` Optional seed candidate + 1–2 sample published jobs (helps later demos)
- [x] **P1-08** `M` Storage adapter interface + local disk implementation (`UPLOAD_DIR`)

### Exit criteria

- [x] Fresh Compose volume + migrate = all tables present
- [x] Re-running bootstrap does not duplicate the admin
- [x] No business endpoints yet (that is Phase 2+)

> **Phase 1 Status:** Completed. Schema defined across all SQLAlchemy models, enums, constraints, and indexes. Alembic migration `0002_create_core_tables` created and verified. StorageAdapter and LocalStorage implemented. Bootstrap admin and seed data functions created and tested for idempotency. Test suite passes (12/12).

---

## Phase 2 — Authentication

**Goal:** Candidates register/login; admin logs in; roles are enforced.  
**Depends on:** Phase 1  
**BRD:** FR-AUTH-01, 02, 03, 05, 06  
**Demo:** Register as candidate; login as admin; `/auth/me` shows role

### Tasks

- [x] **P2-01** `M` Password hashing (Argon2id or bcrypt)
- [x] **P2-02** `M` `POST /api/v1/auth/register` — first name, last name, email, mobile, password; role always `candidate`
- [x] **P2-03** `M` `POST /api/v1/auth/login` — email + password; set HttpOnly access + refresh cookies
- [x] **P2-04** `M` `POST /api/v1/auth/logout` — clear cookies
- [x] **P2-05** `M` `GET /api/v1/auth/me`
- [x] **P2-06** `M` FastAPI deps: `get_current_user`, `require_role("candidate")`, `require_role("admin")`
- [x] **P2-07** `M` Next.js pages: `/login`, `/register`; `next` query preserved (return-to-job)
- [x] **P2-08** `M` Next.js middleware: `/admin/*` admin-only; `/apply/*`, `/applications`, `/profile` candidate-only
- [x] **P2-09** `M` `POST /api/v1/auth/forgot-password` — always 202; email if user exists
- [x] **P2-10** `M` `POST /api/v1/auth/reset-password` + `/forgot-password` and `/reset-password` pages
- [x] **P2-11** `S` Rate limit login and forgot-password
- [x] **P2-12** `C` Google / LinkedIn buttons as **disabled UI only** — do not implement OAuth

### Exit criteria

- [x] Candidate can register and stay logged in across refresh
- [x] Admin seed can log in; candidate cannot open `/admin`
- [x] Unauthenticated user hitting Apply is sent to login with `next=/apply/{id}`
- [x] After login, they land on that apply URL (FR-AUTH-06)
- [x] Forgot-password does not reveal whether the email exists

> **Phase 2 Status:** Completed. Implemented JWT auth with HttpOnly cookies, Argon2id hashing, FastAPI auth endpoints & dependencies, React AuthContext, Next.js login/register/forgot-password/reset-password pages with `next` return-to-job support, disabled OAuth buttons, and role-based Next.js route protection middleware. All 20 tests pass.

---

## Phase 3 — Job requisitions (admin) + public career site

**Goal:** Admin publishes a job; anonymous visitors see it, open detail, and share. Draft/closed stay hidden.  
**Depends on:** Phase 2  
**BRD:** FR-JR-01…06, FR-PUB-01…05, AC 11.1  
**Demo:** Create → Save draft (not on public list) → Publish → appears on `/jobs` → Share copies URL

### Admin tasks

- [x] **P3-01** `M` `POST/GET /api/v1/admin/requisitions` — create + list (status, application count)
- [x] **P3-02** `M` `GET/PATCH /api/v1/admin/requisitions/{id}` — get + edit (draft and published)
- [x] **P3-03** `M` `POST .../publish` and `POST .../close`
- [x] **P3-04** `M` Auto `requisition_code` (`REQ-YYYY-NNNNN`) and public `slug`
- [x] **P3-05** `M` Fields: title, department, location (incl. Remote), employment type, experience range, openings, hiring manager, description, **max salary budget**, **hiring complete by**
- [x] **P3-06** `M` Admin UI: list, create, edit, Save as Draft, Publish, Close
- [x] **P3-07** `S` Sanitize description HTML on save

### Public tasks

- [x] **P3-08** `M` `GET /api/v1/jobs` — **published only**
- [x] **P3-09** `M` `GET /api/v1/jobs/{slug}` — 404 if draft/closed
- [x] **P3-10** `M` `/jobs` listing cards: title, department, location, type, experience, posted date, Apply, Share
- [x] **P3-11** `M` `/jobs/[slug]` detail: description, overview rail, Apply, Share
- [x] **P3-12** `M` Share: copy canonical public URL (Web Share API if available); no login
- [x] **P3-13** `S` Search `q` + filters: department, location, experience (FR-PUB-02)
- [x] **P3-14** `M` Apply button: logged-out → login with `next`; logged-in candidate → `/apply/{id}`
- [x] **P3-15** `C` Duplicate requisition (FR-JR-07)

### Exit criteria

- [x] Published job visible without login (AC 11.1)
- [x] Draft and Closed **not** on public listing or detail (AC 11.1)
- [x] Edit of a published job shows on the public page
- [x] Close removes it from public; admin can still open it
- [x] Share works while logged out

> **Phase 3 Status:** Completed. Implemented Requisitions API, auto sequential code & unique slug generation, HTML sanitization, admin CRUD lifecycle endpoints (create/draft/publish/close/duplicate), public job search and filter endpoints, Next.js Public Careers portal (`/jobs`, `/jobs/[slug]`, `/`), anonymous sharing (Web Share API + clipboard fallback with toasts), and Next.js Admin Requisitions Console (`/admin/requisitions`, `/admin/requisitions/new`, `/admin/requisitions/[id]/edit`). All 26 backend tests pass; Next.js production build succeeds with 0 errors.

---

## Phase 4 — Candidate profile (bio, education, experience)

**Goal:** Logged-in candidate can save reusable profile data used by the apply wizard.  
**Depends on:** Phase 2 (Phase 3 not strictly required, but Apply needs a job id)  
**BRD:** FR-APP-01…03, FR-AUTH-07, data spec §9.1–9.3  
**Demo:** Fill bio + 2 education rows + experience (or Fresher); refresh; data still there

### Tasks

- [x] **P4-01** `M` `GET/PUT /api/v1/me/profile` — bio-data fields and validation (§9.1)
- [x] **P4-02** `M` `GET/PUT /api/v1/me/education` — replace list; ≥ 1 row when completing apply
- [x] **P4-03** `M` `GET/PUT /api/v1/me/experience` — list **or** `is_fresher: true`
- [x] **P4-04** `M` Derive `total_experience_years` from date ranges; 0 if fresher
- [x] **P4-05** `S` Optional profile photo (JPG/PNG, 2 MB) via storage adapter
- [x] **P4-06** `M` Field validation: name max 50, email unique, mobile with country code, year of passing not in the future, end date hidden when “currently working”
- [x] **P4-07** `S` `/profile` page (same fields as wizard, reusable)

### Exit criteria

- [x] Profile persists and is reused on the next apply (FR-AUTH-07)
- [x] Fresher path does not require employer fields
- [x] Invalid years / missing mandatory fields return `VALIDATION_ERROR`

> **Phase 4 Status:** Completed. Implemented candidate bio-data, education, and experience APIs (`/api/v1/me/*`), automatic non-overlapping date calculation for `total_experience_years`, fresher support, profile photo upload & streaming (`/api/v1/files/photos/*`), input validation, and the Next.js Candidate Profile dashboard (`/profile`). All 34 tests pass; Next.js production build succeeds with 0 errors.

---

## Phase 5 — Apply wizard, resume, submit, confirmation

**Goal:** Full candidate journey from Apply to confirmation with Application ID.  
**Depends on:** Phases 3 and 4  
**BRD:** FR-APP-04…10, AC 11.2, 11.3  
**Demo:** Logged-out Apply → login → 4 steps → submit with PDF → confirmation screen

### Tasks

- [ ] **P5-01** `M` Wizard UI: steps Bio → Education → Experience → Resume & Submit; step indicator
- [ ] **P5-02** `M` Block wizard until authenticated (AC 11.2); never show form to anonymous
- [ ] **P5-03** `S` `POST /api/v1/jobs/{id}/applications/draft` — save & continue; restore on refresh (FR-APP-06)
- [ ] **P5-04** `M` `POST /api/v1/jobs/{id}/applications` multipart: resume + cover note + consents
- [ ] **P5-05** `M` Resume required: PDF/DOC/DOCX, ≤ 5 MB; reject submit without file (AC 11.3)
- [ ] **P5-06** `M` Both consents required; Submit disabled in UI until resume + consents
- [ ] **P5-07** `S` Optional cover note (~500 words)
- [ ] **P5-08** `M` Generate `application_code` (`APP-#####`); set `status=new`, `submitted_at`
- [ ] **P5-09** `M` Freeze `snapshot_json` (bio + education + experience + years) at submit
- [ ] **P5-10** `M` Reject submit if requisition is not `published`
- [ ] **P5-11** `S` Duplicate submit → `409 CONFLICT` (FR-APP-10); UI message + link to My Applications
- [ ] **P5-12** `M` Confirmation page: application ID, submitted at, status “Received — Under Review”
- [ ] **P5-13** `S` My Applications list + status (FR-APP-11)
- [ ] **P5-14** `M` Authenticated file GET for the candidate’s own resume

### Exit criteria

- [ ] Anonymous Apply never shows the form (AC 11.2)
- [ ] Submit without resume is blocked (AC 11.3)
- [ ] Valid submit creates one application linked to job + candidate
- [ ] Confirmation shows human Application ID
- [ ] Second submit to the same open job is blocked (if P5-11 done)

---

## Phase 6 — Notifications (in-app + email)

**Goal:** Admin learns immediately; candidate gets confirmation email.  
**Depends on:** Phase 5  
**BRD:** FR-NOTIF-01, 02, 04, AC 11.4  
**Demo:** Submit an application → Mailhog has 2 messages; admin bell shows unread 1

### Tasks

- [ ] **P6-01** `M` Mailer adapter: console + SMTP (Mailhog locally)
- [ ] **P6-02** `M` On submit: insert `notifications` row for **every admin**
- [ ] **P6-03** `M` Email candidate: application ID, job title, timestamp
- [ ] **P6-04** `M` Email admin: requisition code + candidate name
- [ ] **P6-05** `M` Email failure does **not** roll back the application
- [ ] **P6-06** `S` `GET /api/v1/admin/notifications` + mark read
- [ ] **P6-07** `S` Admin bell with unread count (FR-NOTIF-04)
- [ ] **P6-08** `C` Candidate email on status change (FR-NOTIF-03) — schema-ready only unless extra time

### Exit criteria

- [ ] Successful submit always creates the application even if SMTP is down
- [ ] With Mailhog up, both emails appear (AC 11.4)
- [ ] Admin sees an in-app notification referencing job + candidate

---

## Phase 7 — Admin application review

**Goal:** Per-requisition grid, full application, resume download, status updates.  
**Depends on:** Phases 5 and 6  
**BRD:** FR-ADM-01, 02, 04, 06 (+ 03, 05, 07 as S), AC 11.5  
**Demo:** Open requisition → grid of applicants → View resume → open full profile → mark Shortlisted

### Tasks

- [ ] **P7-01** `M` `GET /api/v1/admin/requisitions/{id}/applications` — name, applied on, experience, location, resume link, status
- [ ] **P7-02** `M` Grid UI matching wireframe 8.2
- [ ] **P7-03** `M` Resume “View” streams file (admin authz) (FR-ADM-02, AC 11.5)
- [ ] **P7-04** `M` `GET /api/v1/admin/applications/{id}` — full snapshot: bio, education, experience, cover note, resume
- [ ] **P7-05** `M` Full application page (row click)
- [ ] **P7-06** `M` `PATCH .../status` — `new` / `reviewed` / `shortlisted` / `rejected` (FR-ADM-04)
- [ ] **P7-07** `S` Search by name/email + filter by status (FR-ADM-03)
- [ ] **P7-08** `S` CSV export with resume links (FR-ADM-05)
- [ ] **P7-09** `S` Cross-requisition view or “All applications” with job column (FR-ADM-07)
- [ ] **P7-10** `M` Candidate cannot access admin application endpoints (403)

### Exit criteria

- [ ] Every submitted application for that job appears in the grid (AC 11.5)
- [ ] Resume link opens/downloads the correct file
- [ ] Status change persists and shows on candidate My Applications (if P5-13 done)
- [ ] Grid empty state when a job has zero applications

---

## Phase 8 — Hardening, docs, assignment wrap

**Goal:** Repo is submittable: README, tests for §11, known limits, credentials.  
**Depends on:** Phase 7 (core journey complete)  
**Demo:** Clone on a clean machine; follow README; run the §5 journey

### Tasks

- [ ] **P8-01** `M` Input validation + consistent error JSON (`VALIDATION_ERROR`, `CONFLICT`, …)
- [ ] **P8-02** `M` pytest: public list hides draft/closed; apply without login 401; apply without resume 422; duplicate 409; admin-only 403; resume IDOR blocked
- [ ] **P8-03** `S` Playwright (or documented manual) smoke of the §5 journeys
- [ ] **P8-04** `M` README with every assignment heading:
  - Project overview
  - Problem understanding
  - Features implemented
  - Technology stack
  - System architecture / approach (link `architecture.md`)
  - Database design
  - API overview (link `/docs`)
  - Setup and installation
  - Environment variables
  - How to run locally
  - Test credentials
  - Testing approach
  - Known limitations
  - Future improvements
  - Live demo link (or “not deployed”)
- [ ] **P8-05** `M` Test credentials in README (admin + candidate)
- [ ] **P8-06** `M` Meaningful `.gitignore`; no secrets committed
- [ ] **P8-07** `S` Empty, error, and closed-job UI states
- [ ] **P8-08** `S` Responsive check of public listing, job detail, apply wizard, admin grid
- [ ] **P8-09** `C` Deploy (Vercel web + API host, or single VM); paste URL in README
- [ ] **P8-10** `M` GitHub repo with history that maps to phases (not one dump commit)

### Exit criteria

- [ ] BRD §11.1–11.5 all pass
- [ ] Stranger can clone and run from README alone
- [ ] `architecture.md` + this file + README agree on stack and scope

---

## Phase 9 — Optional extras (after a working demo)

Do **not** start this to look bigger. Only if Phase 8 is done.

| ID | Pri | Task | Notes |
| --- | --- | --- | --- |
| P9-01 | C | Requisition clone | FR-JR-07 |
| P9-02 | C | Google / LinkedIn OAuth | FR-AUTH-04 |
| P9-03 | C | Status-change email to candidate | FR-NOTIF-03 |
| P9-04 | C | Admin reopen closed job | Not in BRD |
| P9-05 | C | Candidate withdraw application | Not in BRD |
| P9-06 | C | Semantic job search (`pgvector`) | Architecture §16; not matching scores |
| P9-07 | C | Hiring-manager read-only role | Future BRD |

**Still out of scope even here unless the assignment explicitly asks:** resume parsing, AI ranking, interview scheduling, job-board integrations, native mobile.

---

## Suggested calendar (solo, ~10 working days)

| Day | Phase | Outcome |
| --- | --- | --- |
| 1 | 0 + 1 | Running skeleton + schema + seed admin |
| 2 | 2 | Auth + role gates + return-to-job |
| 3–4 | 3 | Admin requisitions + public jobs + share |
| 5 | 4 | Profile APIs + validation |
| 6–7 | 5 | Wizard + resume + confirmation |
| 8 | 6 + 7 | Notify + admin grid + status + resume view |
| 9 | 8 | Tests + README + UX polish |
| 10 | buffer / 9 | Deploy or one extra; freeze scope |

If time is short, cut in this order: P9 → P3-15 → P2-12 → P8-09 → P7-09 → P7-08 → P5-13 → P4-05 → P3-13. **Never cut** publish visibility, login-before-apply, mandatory resume, admin grid, or admin notify.

---

## Traceability — BRD Must-haves → tasks

| BRD | Requirement | Tasks |
| --- | --- | --- |
| FR-JR-01…06 | Requisition lifecycle | P3-01…P3-06 |
| FR-PUB-01, 03, 04, 05 | Public list, detail, apply, share | P3-08…P3-12, P3-14 |
| FR-AUTH-01…03, 05, 06 | Login before apply, register, reset, return | P2-02…P2-10, P5-02 |
| FR-APP-01…04, 07…09 | Wizard + resume + consents + confirm | P4-*, P5-01…P5-12 |
| FR-NOTIF-01, 02 | Admin + candidate notify | P6-02…P6-04 |
| FR-ADM-01, 02, 04, 06 | Grid, resume, status, full view | P7-01…P7-06 |
| AC 11.1–11.5 | Acceptance | Phase 3, 5, 6, 7 exit criteria |

---

## Definition of done (whole project)

The project is done when **all of these** are true:

1. Admin can create, draft, publish, edit, and close a requisition.
2. Anonymous user can list, open, and share a published job; cannot see draft/closed.
3. Apply forces login/register and returns to that job.
4. Candidate completes four steps, cannot submit without resume + consents, sees Application ID.
5. Admin is notified (in-app and/or email) and sees the row in that job’s grid with a working resume link and can change status.
6. README lets a third person run it; GitHub repo exists.

That is BRD section 5 plus section 11. Everything else is extra.
