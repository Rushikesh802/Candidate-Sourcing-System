# TalentBridge Deployment Guide (Production & Cloud PaaS)

This guide walks you through deploying the **TalentBridge Candidate Sourcing System** on cloud platforms (Render, Vercel, Supabase/Neon, or Docker VPS).

---

## 🚀 Option 1: Automated 1-Click Deployment on Render (Recommended)

Render can deploy the **PostgreSQL Database**, **FastAPI Backend**, and **Next.js Frontend** together using the included [`render.yaml`](./render.yaml) blueprint.

### Steps:

1. **Commit and push your changes to GitHub**:
   ```bash
   git add .
   git commit -m "Configure production deployment settings and blueprint"
   git push origin main
   ```

2. **Log in to Render**:
   - Visit [dashboard.render.com](https://dashboard.render.com/) and sign in with your GitHub account.

3. **Deploy with Blueprint**:
   - Click **New +** → **Blueprint**.
   - Connect your repository: `Rushikesh802/Candidate-Sourcing-System`.
   - Render will detect [`render.yaml`](./render.yaml) and configure:
     - 🗄️ **PostgreSQL Database** (`candidate-sourcing-db`)
     - ⚙️ **FastAPI Web Service** (`candidate-sourcing-api`) with auto database migrations
     - 🌐 **Next.js Web Service** (`candidate-sourcing-web`) linked to the API
   - Click **Apply**.

4. **Verify Deployment**:
   - Once the build completes:
     - API Docs: `https://<your-api-name>.onrender.com/docs`
     - Public Frontend: `https://<your-web-name>.onrender.com`

---

## ⚡ Option 2: Split Deployment (Vercel Frontend + Render/Railway Backend + Neon Postgres)

If you prefer deploying the frontend on **Vercel** for fast global CDN edges:

### Step 1: Create a Managed PostgreSQL Database
- Create a free database on [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/).
- Copy your `DATABASE_URL` (connection string).

### Step 2: Deploy Backend (Render / Railway)
1. Go to [Render](https://render.com/) or [Railway](https://railway.app/).
2. Create a new **Web Service** from your GitHub repo.
3. Configure settings:
   - **Root Directory:** `apps/api`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `DATABASE_URL`: *(Your Postgres connection string)*
   - `SECRET_KEY`: *(A strong 32+ character random string)*
   - `PUBLIC_BASE_URL`: `https://<your-vercel-app-domain>`
   - `ALLOWED_ORIGINS`: `*`
   - `ADMIN_EMAIL`: `admin@talentbridge.local`
   - `ADMIN_PASSWORD`: `Admin@12345`

### Step 3: Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select `Rushikesh802/Candidate-Sourcing-System`.
3. Set **Root Directory** to `apps/web`.
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_BASE`: `https://<your-backend-render-url>.onrender.com`
5. Click **Deploy**.

---

## 🐳 Option 3: Deploy via Docker Compose (VPS / EC2 / Droplet)

If you have a Linux virtual machine:

1. Clone repo:
   ```bash
   git clone https://github.com/Rushikesh802/Candidate-Sourcing-System.git
   cd Candidate-Sourcing-System
   ```
2. Create `.env` file with production values:
   ```env
   SECRET_KEY=generate_a_secure_random_key
   PUBLIC_BASE_URL=https://yourdomain.com
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=YourSecureAdminPassword123
   ```
3. Start the entire container stack in detached mode:
   ```bash
   docker compose up -d --build
   ```
4. Check running services:
   ```bash
   docker compose ps
   ```

---

## 🔑 Default Admin Credentials
When the database is seeded during initial startup:
- **Email:** `admin@talentbridge.local` (or whatever `ADMIN_EMAIL` is set to)
- **Password:** `Admin@12345` (or whatever `ADMIN_PASSWORD` is set to)
