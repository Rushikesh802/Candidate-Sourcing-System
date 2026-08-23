# Candidate Sourcing System (TalentBridge)

Job Requisition, Public Posting & Candidate Application Platform based on the System Architecture and BRD specifications.

## Monorepo Structure

- `apps/api`: FastAPI (Python) backend with SQLAlchemy, Alembic, Pydantic, and JWT authentication.
- `apps/web`: Next.js (App Router, React, TypeScript, Tailwind CSS) frontend for Career Site and Admin Console.
- `docker-compose.yml`: Multi-container orchestration (PostgreSQL 16, FastAPI API, Next.js Web, Mailhog).

---

## Quick Start with Docker Compose

1. **Copy Environment Variables**:
   ```bash
   cp .env.example .env
   ```

2. **Start All Services**:
   ```bash
   docker compose up --build
   ```

3. **Access Services**:
   - Web Application: [http://localhost:3000](http://localhost:3000)
   - API Documentation (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
   - API Health Endpoint: [http://localhost:8000/health](http://localhost:8000/health)
   - Mailhog (Email Testing): [http://localhost:8025](http://localhost:8025)

---

## Running Locally Without Docker

### 1. API (FastAPI with `uv`)

```bash
cd apps/api
# Create virtualenv and install dependencies using uv
uv venv
uv pip install -e ".[dev]"

# Run database migrations
uv run alembic upgrade head

# Start development server
uv run uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

---

## Testing

```bash
# Run backend pytest suite
cd apps/api
uv run pytest
```
