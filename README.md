# Task Management Tool

A simplified project management application for creating projects, managing tasks, assigning work to team members, tracking progress with a Kanban board, and viewing dashboard metrics.

For the full product specification, see [docs/PRD.md](docs/PRD.md).

---

## Features

- **Authentication** — Register and login with email/password (JWT)
- **Projects** — Create, list, view, update, and delete projects
- **Roles** — Project creator and member permissions
- **Members** — Creator can add/remove team members by registered email
- **Tasks** — Create, update, delete tasks with priority, due date, and assignee
- **Kanban Board** — Drag-and-drop columns: Backlog, Todo, In Progress, Done
- **Dashboard** — Summary of total projects, tasks, and completed vs pending work

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, @hello-pangea/dnd |
| Backend | Express.js, TypeScript, REST API, Zod |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (email + password) |
| API Docs | Bruno collection in [bruno/](bruno/) |

---

## Project Structure

```
/
├── backend/       # Express REST API
├── frontend/      # Next.js web app
├── bruno/         # API test collection
└── docs/
    └── PRD.md     # Full requirements document
```

---

## Prerequisites

- **Node.js** 18+ (18.18+ recommended; this project uses Prisma 5 for broader Node compatibility)
- **PostgreSQL** 14+
- **npm**
- **Optional:** [Bruno](https://www.usebruno.com/) for API testing

---

## Setup

### 1. Start PostgreSQL

Ensure PostgreSQL is running and create a database (e.g. `task_management`).

### 2. Backend

**Copy environment file:**

```powershell
Copy-Item backend\.env.example backend\.env
```

On macOS/Linux:

```bash
cp backend/.env.example backend/.env
```

**Configure `backend/.env`:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Strong random string for signing tokens |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `PORT` | API port (default: `4000`) |
| `CORS_ORIGIN` | Frontend URL (default: `http://localhost:3000`) |

Example `DATABASE_URL`:

```
postgresql://postgres:postgres@localhost:5432/task_management?schema=public
```

**Install, migrate, and run:**

```bash
cd backend
npm install
npm run db:migrate
npm run dev
```

API base URL: **http://localhost:4000/api**

Health check: **http://localhost:4000/health**

### 3. Frontend

**Copy environment file:**

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

On macOS/Linux:

```bash
cp frontend/.env.example frontend/.env.local
```

**Configure `frontend/.env.local`:**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:4000/api`) |

**Install and run:**

```bash
cd frontend
npm install
npm run dev
```

App URL: **http://localhost:3000**

---

## Environment Variables (Quick Reference)

| Service | Variable | Example |
|---------|----------|---------|
| Backend | `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/task_management` |
| Backend | `JWT_SECRET` | `your-secure-random-string-min-32-chars` |
| Backend | `JWT_EXPIRES_IN` | `7d` |
| Backend | `PORT` | `4000` |
| Backend | `CORS_ORIGIN` | `http://localhost:3000` |
| Frontend | `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` |

---

## Usage

### App Pages

| URL | Purpose |
|-----|---------|
| `/register` | Create a new account |
| `/login` | Sign in |
| `/dashboard` | Overview metrics |
| `/projects` | List and manage projects |
| `/projects/[id]` | Project details, members, and tasks |
| `/projects/[id]/board` | Kanban board |

### Suggested First-Run Flow

1. Open **http://localhost:3000** and register a new account
2. Create a project from the **Projects** page
3. Add a task on the project details page
4. Open the **Kanban board** and drag tasks between columns

### Business Rules (Summary)

- Only project members can access project data
- Project creator can update/delete the project and manage members
- Tasks can only be assigned to project members
- Due dates cannot be in the past
- Completed (`Done`) tasks cannot be deleted

---

## API Testing with Bruno

1. Install [Bruno](https://www.usebruno.com/) and open the [bruno/](bruno/) folder as a collection
2. Select the **local** environment
3. Run **auth/register** or **auth/login** first — the token is saved automatically
4. Test projects, members, tasks, and dashboard endpoints

---

## Available Scripts

### Backend (`backend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema without migration |
| `npm run db:studio` | Open Prisma Studio |

### Frontend (`frontend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run production server |

---

## API Endpoints (Overview)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| GET/PATCH/DELETE | `/api/projects/:id` | Project CRUD |
| GET/POST/DELETE | `/api/projects/:id/members` | Manage members |
| GET/POST/PATCH/DELETE | `/api/projects/:id/tasks` | Manage tasks |
| GET | `/api/dashboard/summary` | Dashboard metrics |

See [docs/PRD.md](docs/PRD.md) and the [bruno/](bruno/) collection for full request/response details.
