# Task Management Backend

Express.js REST API with TypeScript, Prisma, PostgreSQL, JWT auth, and Zod validation.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

1. Copy environment file:

```bash
cp .env.example .env
```

2. Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

3. Install dependencies:

```bash
npm install
```

4. Run database migrations:

```bash
npm run db:migrate
```

5. Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:4000/api`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema without migration |
| `npm run db:studio` | Open Prisma Studio |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/projects` | Yes | Create project |
| GET | `/api/projects` | Yes | List user projects |
| GET | `/api/projects/:id` | Member | Get project |
| PATCH | `/api/projects/:id` | Creator | Update project |
| DELETE | `/api/projects/:id` | Creator | Delete project |
| GET | `/api/projects/:id/members` | Member | List members |
| POST | `/api/projects/:id/members` | Creator | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Creator | Remove member |
| POST | `/api/projects/:id/tasks` | Member | Create task |
| GET | `/api/projects/:id/tasks` | Member | List tasks |
| GET | `/api/projects/:id/tasks/:taskId` | Member | Get task |
| PATCH | `/api/projects/:id/tasks/:taskId` | Member | Update task |
| DELETE | `/api/projects/:id/tasks/:taskId` | Member | Delete task |
| GET | `/api/dashboard/summary` | Yes | Dashboard metrics |

## API Documentation

Bruno collection is available at [`../bruno/`](../bruno/). Open the folder in Bruno to test all endpoints.

## Health Check

```
GET /health
```
