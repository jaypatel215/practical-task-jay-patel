# Task Management Frontend

Next.js application for the Task Management Tool.

## Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:4000/api`

## Setup

1. Copy environment file:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | User login |
| `/register` | User registration |
| `/dashboard` | Summary metrics |
| `/projects` | Project list and creation |
| `/projects/[id]` | Project details, members, tasks |
| `/projects/[id]/board` | Kanban board |

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- @hello-pangea/dnd (Kanban drag-and-drop)
