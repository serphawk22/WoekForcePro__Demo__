# WorkForce Pro 🚀

A modern, full-stack workforce management platform designed to streamline employee management, attendance tracking, task assignment, leave management, and payroll processing. Built with cutting-edge technologies for scalability, performance, and an exceptional user experience.

> **Local dev:** `http://localhost:3000` shows **connection refused** until you **start the dev server** and **leave that terminal open**.  
> **Mac:** double‑click **`Start WorkForce Pro.command`** in this folder, wait for **Ready**, then open the browser.  
> Details: **[START.md](./START.md)**

![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## ✨ Features

### 🎯 Core Functionality
- **Employee Management**: Comprehensive employee directory with detailed profiles and role-based access control
- **Attendance Tracking**: Real-time attendance monitoring with clock-in/clock-out functionality
- **Task Management**: Hierarchical task assignment with priorities, status tracking, and deadlines
- **Leave Management**: Streamlined leave request submission and approval workflow
- **Payroll Processing**: Automated payroll calculations and comprehensive salary reports
- **Analytics & Reports**: Interactive dashboards with workforce insights and performance metrics

### 🎨 User Experience
- **Beautiful Landing Page**: Modern marketing page showcasing platform features and AI vision
- **Dual Dashboards**: Separate, optimized views for administrators and employees
- **Responsive Design**: Fully responsive across all devices and screen sizes
- **Real-time Updates**: Live data synchronization using TanStack Query

### 🔐 Security & Authentication
- **JWT-based Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Admin and employee roles with appropriate permissions
- **Password Hashing**: Bcrypt encryption for secure password storage
- **Protected Routes**: Client-side route protection based on user roles

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) 0.109.0
- **Language**: Python 3.11
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [SQLModel](https://sqlmodel.tiangolo.com/) 0.0.34
- **Authentication**: [python-jose](https://github.com/mpdavis/python-jose) (JWT)
- **Password Hashing**: [passlib](https://passlib.readthedocs.io/) + bcrypt
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI)
- **Database Driver**: psycopg2-binary

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **Python** 3.11
- **PostgreSQL** 12 or higher
- **npm** or **yarn** package manager
- **pip** Python package manager

## 🚀 Installation & Setup

### ⚠️ “This site can’t be reached” / `ERR_CONNECTION_REFUSED`

The browser shows this when **nothing is listening** on that port. You need **two** processes running locally:

| URL | What must be running |
|-----|----------------------|
| **http://localhost:3000** | Next.js (`npm run dev` in `frontend/`) |
| **http://127.0.0.1:8000** | FastAPI (`uvicorn` in `backend/`) |

**Easiest fix — one command from the repo root** (starts API + web together via `scripts/dev-all.cjs` — no `npx`/`bash` in the middle):

```bash
cd WorkForcePro
# Backend: first time only
cd backend
python3 -m venv venv          # Windows: py -m venv venv
# macOS/Linux: source venv/bin/activate   |   Windows: venv\Scripts\activate
./venv/bin/pip install -r requirements.txt   # Windows: venv\Scripts\pip install -r requirements.txt
cp .env.example .env
# Edit .env: set DATABASE_URL for PostgreSQL

cd ..                         # back to WorkForcePro root
npm install
cd frontend && npm install && cd ..
npm run dev                   # API :8000 + Next :3000 in one terminal
```

Then open **http://127.0.0.1:3000** or **http://localhost:3000** (not `:8000` for the website UI).

If the browser still says **connection refused**, see **[DEV_TROUBLESHOOTING.md](./DEV_TROUBLESHOOTING.md)** (wrong folder, port not listening, or missing `npm install`).

If you prefer **two terminals**: terminal 1 → backend `uvicorn`; terminal 2 → `frontend` `npm run dev`.

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/saivarshadevoju/WorkForcePro.git
cd WorkForcePro
```

### 2️⃣ Backend Setup

#### Create and Activate Virtual Environment

```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Set Up PostgreSQL Database

```bash
# Create database (using PostgreSQL CLI)
createdb workforce_db

# Or using psql:
psql -U postgres
CREATE DATABASE workforce_db;
\q
```

#### Configure Environment Variables

Copy the example file and edit:

```bash
cp .env.example .env
```

**Important**: This application requires PostgreSQL. Set `DATABASE_URL` as structured in `.env.example`.

#### Run the Backend Server

```bash
# From backend/, with venv activated:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend API will be available at **http://127.0.0.1:8000** (or `http://localhost:8000`).

### 3️⃣ Frontend Setup

#### Navigate to Frontend Directory

```bash
cd ../frontend
```

#### Install Dependencies

```bash
npm install
# or
yarn install
```

#### Configure Environment Variables (optional locally)

For **`npm run dev` in `frontend/`**, you usually **do not** need `frontend/.env.local`: the app proxies API calls to the backend via `/api` (see `frontend/next.config.js`).

Add `frontend/.env.local` only if you want to call the API **directly** (e.g. `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`).

#### Run the Frontend Development Server

```bash
npm run dev
# or
yarn dev
```

The frontend application will be available at `http://localhost:3000`

## 🎮 Usage

### Default Admin Credentials

The application comes with a pre-configured admin account:

- **Email**: `admin@gmail.com`
- **Password**: `admin`

**⚠️ Important**: Change these credentials immediately in production!

### API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (form data)
- `POST /auth/login/json` - Login (JSON body)
- `GET /auth/me` - Get current user info

#### Admin (requires admin role)
- `GET /admin/employees` - Get all employees
- `POST /admin/employees` - Create new employee
- `GET /admin/employees/{id}` - Get employee details
- `PATCH /admin/employees/{id}` - Update employee
- `DELETE /admin/employees/{id}` - Delete employee

#### Attendance
- `POST /attendance/clock-in` - Clock in
- `POST /attendance/clock-out` - Clock out
- `GET /attendance/my-records` - Get user's attendance records
- `GET /attendance/all` - Get all attendance records (admin)

#### Tasks
- `GET /tasks` - Get user's tasks
- `POST /tasks` - Create task (admin)
- `GET /tasks/{id}` - Get task details
- `PATCH /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task (admin)

#### Leave Management
- `POST /leave/request` - Submit leave request
- `GET /leave/my-requests` - Get user's leave requests
- `GET /leave/all` - Get all leave requests (admin)
- `PATCH /leave/{id}/approve` - Approve leave (admin)
- `PATCH /leave/{id}/reject` - Reject leave (admin)

## 📁 Project Structure

```
WorkForcePro/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # Application entry point
│   │   ├── auth.py            # Authentication utilities
│   │   ├── database.py        # Database configuration
│   │   ├── models.py          # SQLModel database models
│   │   └── routers/           # API route handlers
│   │       ├── admin.py       # Admin endpoints
│   │       ├── attendance.py  # Attendance tracking
│   │       ├── auth.py        # Authentication routes
│   │       ├── leave.py       # Leave management
│   │       └── tasks.py       # Task management
│   ├── requirements.txt       # Python dependencies
│   └── README.md
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── layout.tsx     # Root layout
│   │   │   ├── login/         # Login page
│   │   │   ├── signup/        # Registration page
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── employee-dashboard/ # Employee dashboard
│   │   │   ├── attendance/    # Attendance management
│   │   │   ├── tasks/         # Task management
│   │   │   ├── employees/     # Employee directory
│   │   │   ├── requests/      # Leave requests
│   │   │   ├── payroll/       # Payroll management
│   │   │   ├── reports/       # Analytics & reports
│   │   │   └── profile/       # User profile
│   │   ├── components/        # React components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── landing/       # Landing page components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # Utilities and API client
│   ├── package.json
│   └── README.md
│
└── README.md                   # This file
```

## 🔧 Development

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
cd frontend
npm test
```

### Building for Production

#### Backend

```bash
cd backend
# The backend doesn't require a build step
# Deploy using gunicorn or similar WSGI server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

#### Frontend

```bash
cd frontend
npm run build
npm start
```

## 🌟 Key Features Explained

### Landing Page
Beautiful, modern marketing page featuring:
- Hero section with call-to-action
- Features showcase
- How it works section
- AI vision and future roadmap
- Footer with navigation

### Admin Dashboard
Comprehensive administrative control panel:
- Real-time workforce statistics
- Attendance overview charts
- Task completion metrics
- Recent activity feed
- Quick actions for common tasks

### Employee Dashboard
Personalized employee workspace:
- Personal task list
- Attendance history
- Leave balance overview
- Time tracking
- Profile management

### Task Management
Hierarchical task system with:
- Priority levels (Low, Medium, High, Critical)
- Status tracking (Not Started, In Progress, Completed, Blocked)
- Assignment to employees
- Due date management
- Progress tracking

### Attendance System
Automated time tracking:
- Digital clock-in/clock-out
- Automatic duration calculation
- Late arrival notifications
- Attendance history reports
- Export to Excel/CSV

### Leave Management
Streamlined request workflow:
- Multiple leave types
- Balance tracking
- Approval workflow
- Leave history
- Calendar integration

## 🔒 Security Features

- JWT tokens for stateless authentication
- Password hashing using bcrypt (cost factor: 12)
- CORS protection configured
- SQL injection protection via SQLModel ORM
- Input validation using Pydantic models
- Environment variables for sensitive data

## 🌐 Deployment

### Production Deployment

The backend can be hosted on **Railway** (long-lived container, in-process
scheduler) or **Vercel** (serverless Functions). The **frontend is always on
Vercel** and proxies `/api/*` to the backend URL (set via `BACKEND_API_URL`), so
the browser talks to one origin and CORS is not in the hot path:

| Project | Platform | Root directory | What it runs | Files |
|---|---|---|---|---|
| **Backend** | Railway **or** Vercel | repo root | FastAPI + uvicorn | `nixpacks.toml`, `backend/railway.json`, `backend/Procfile` (Railway) · `pyproject.toml`, `api/index.py`, `vercel.json` (Vercel) |
| **Frontend** | Vercel | `frontend` | Next.js (App Router) | `frontend/vercel.json`, `frontend/next.config.js` |

Shared backend env vars for either platform:
`DATABASE_URL`, `SECRET_KEY` (generate with `openssl rand -hex 32`; the app
**refuses to start in production without it**), `FRONTEND_URL` / `FRONTEND_URLS`
(CORS allowlist), plus optional `OPENAI_API_KEY`, `EMAIL_*`, `CRON_SECRET`.

#### 1. Backend on Railway (option A)

1. On Railway, **New Project → Deploy from GitHub repo** (or use the existing
   `WorkForcePro` service). No build/start command changes needed — `backend/railway.json`
   and `nixpacks.toml` define them (Python 3.11, `uvicorn app.main:app --port $PORT`).
2. Add the shared env vars above. Railway sets `RAILWAY_ENV=production`, which the app
   uses to require `SECRET_KEY`.
3. Deploy. Startup runs the DB migration bootstrap automatically (Postgres).
4. Backend URL: `https://<service>.up.railway.app`.

**Recurring tasks & email reminders** run in-process via APScheduler (enabled on
Railway — the app only disables it on Vercel serverless). Set the `EMAIL_*` vars
and `SHEET_REMINDER_SCHEDULER_ENABLED=true`.

#### 2. Backend on Vercel (option B)

1. Create a Vercel project and import the repo with **Root Directory left as `/`**
   and Framework Preset set to **FastAPI** (or let it auto-detect from `pyproject.toml`).
2. Add the shared env vars above + `CRON_SECRET`.
3. **First deploy only:** set `SKIP_STARTUP_BOOTSTRAP=0` so migrations run once;
   then remove it (or set to `1`) for fast cold-starts.
4. Deploy. Backend URL: `https://<your-backend-project>.vercel.app`.

**Recurring tasks & email reminders** are driven by **Vercel Cron Jobs** (defined in
`vercel.json`: `POST /tasks/recurring/materialize` daily and `POST /tasks/cron/reminders`
daily). The in-process scheduler auto-disables on serverless. In the Vercel dashboard →
**Settings → Cron Jobs**, set the **Cron Secret** to your `CRON_SECRET` value.

#### 3. Frontend project (Vercel)

1. Create a second Vercel project from the **same** repo, with the **Root Directory set to `frontend`**.
2. Add environment variables:
   - `BACKEND_API_URL=https://<backend-url>` — your Railway (`…up.railway.app`) or Vercel (`…vercel.app`) backend.
   - `NEXT_PUBLIC_API_URL=https://<backend-url>` (same value).
3. Deploy automatically — Vercel detects Next.js in `frontend/` and runs `npm run build`, `npm start`.

The frontend is now at `https://<your-frontend-project>.vercel.app`. Log in with the
default admin (`admin@gmail.com` / `admin`) — **change it immediately**.

#### 4. CI

`.github/workflows/ci.yml` runs on every push/PR: backend import smoke tests, a full
DB-bootstrap test against PostgreSQL 16, and a frontend type check + production build.

#### Detailed Guides

- **✅ [Vercel-only deployment checklist](#-deployment)** — see the two steps above
- **🌿 Local dev** — see [Installation & Setup](#-installation--setup) above

