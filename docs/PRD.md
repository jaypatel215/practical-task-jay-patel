# Task Management Tool — Project Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** June 27, 2026  
**Status:** Draft

---

## Table of Contents

1. [Introduction](#introduction)
2. [Backend](#backend)
3. [Frontend](#frontend)
4. [Appendix](#appendix)

---

## Introduction

### Product Overview

**Product Name:** Task Management Tool (working title)

**Purpose:** Build a simplified project management application where users can create projects, manage tasks, assign work to team members, and track progress using a basic Kanban board. A dashboard provides at-a-glance metrics across all projects the user belongs to.

### Goals

- Enable authenticated users to organize work into projects and tasks
- Support team collaboration through project membership and task assignment
- Visualize task workflow via a four-column Kanban board
- Enforce access control so only project members can view or modify project data
- Provide a dashboard summary of projects and task completion status

### Scope

#### In Scope

| Area | Features |
|------|----------|
| Authentication | Email/password registration and login with JWT |
| Projects | Create, list, view, update, delete |
| Members | Add/remove members (creator only), view member list |
| Tasks | Create, read, update, delete; assign to members; set priority and due date |
| Kanban | Four status columns with drag-and-drop status updates |
| Dashboard | Total projects, total tasks, completed vs pending counts |

#### Out of Scope (v1)

- Email notifications and invitations
- File attachments on tasks
- Task comments and activity logs
- Subtasks and task dependencies
- Real-time collaboration (WebSockets)
- Admin panel and user management
- OAuth / social login
- Role reassignment (transferring project ownership)
- Enforced workflow gates between Kanban columns

### Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, REST API |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Authentication | JWT (email + password) |
| API Documentation | Bruno |

### User Roles and Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Authenticated User** | Any registered user | Register, login, create projects (becomes creator) |
| **Project Creator** | User who created the project | Update/delete project; add/remove members by registered email; all member task permissions |
| **Project Member** | User added to a project by creator | View project details; create/update/delete tasks (except Done tasks); view members; no project or member management |

### Business Rules

| Rule | Detail |
|------|--------|
| Project access | Only project members can access project data and tasks |
| Member management | Only the project creator can add or remove members via registered user email |
| Project edit/delete | Creator only; members have read-only access to project metadata |
| Task assignment | Tasks can only be assigned to users who are members of the project |
| Due date | Must be today or a future date; past dates are rejected |
| Task deletion | Tasks with status `DONE` cannot be deleted |
| Task status | Valid values: `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE` |
| Task priority | Valid values: `LOW`, `MEDIUM`, `HIGH` |
| Creator membership | On project creation, the creator is automatically added as a `CREATOR` member |
| Creator removal | The project creator cannot be removed from the project |

### Repository Structure (Monorepo)

```
/
├── backend/          # Express.js API
├── frontend/         # Next.js application
├── bruno/            # API documentation collection
└── docs/
    └── PRD.md        # This document
```

---

## Backend

### Architecture Overview

```mermaid
flowchart LR
  client[Next.js Client] -->|REST JSON| api[Express API]
  api --> authMW[Auth Middleware]
  authMW --> validateMW[Zod Validation]
  validateMW --> controller[Controllers]
  controller --> service[Services]
  service --> prisma[Prisma ORM]
  prisma --> db[(PostgreSQL)]
```

### Folder Structure

```
backend/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── project.routes.ts
│   │   ├── member.routes.ts
│   │   ├── task.routes.ts
│   │   └── dashboard.routes.ts
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── projectMember.middleware.ts
│   │   ├── projectCreator.middleware.ts
│   │   └── error.middleware.ts
│   ├── schemas/          # Zod schemas
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── password.ts
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
└── tsconfig.json
```

### Database Schema

#### Entity Relationship Diagram

```mermaid
erDiagram
  User ||--o{ Project : creates
  User ||--o{ ProjectMember : belongs_to
  Project ||--o{ ProjectMember : has
  Project ||--o{ Task : contains
  User ||--o{ Task : assigned_to
  User ||--o{ Task : created_by

  User {
    uuid id PK
    string email UK
    string passwordHash
    string name
    datetime createdAt
    datetime updatedAt
  }

  Project {
    uuid id PK
    string name
    string description
    uuid creatorId FK
    datetime createdAt
    datetime updatedAt
  }

  ProjectMember {
    uuid id PK
    uuid projectId FK
    uuid userId FK
    enum role
    datetime joinedAt
  }

  Task {
    uuid id PK
    uuid projectId FK
    string title
    string description
    enum status
    enum priority
    date dueDate
    uuid assigneeId FK
    uuid createdById FK
    datetime createdAt
    datetime updatedAt
  }
```

#### Prisma Schema

```prisma
enum ProjectMemberRole {
  CREATOR
  MEMBER
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model User {
  id           String          @id @default(uuid())
  email        String          @unique
  passwordHash String
  name         String
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  createdProjects Project[]       @relation("ProjectCreator")
  memberships     ProjectMember[]
  assignedTasks   Task[]          @relation("TaskAssignee")
  createdTasks    Task[]          @relation("TaskCreator")
}

model Project {
  id          String          @id @default(uuid())
  name        String
  description String?
  creatorId   String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  creator  User            @relation("ProjectCreator", fields: [creatorId], references: [id])
  members  ProjectMember[]
  tasks    Task[]
}

model ProjectMember {
  id        String            @id @default(uuid())
  projectId String
  userId    String
  role      ProjectMemberRole @default(MEMBER)
  joinedAt  DateTime          @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
}

model Task {
  id          String       @id @default(uuid())
  projectId   String
  title       String
  description String?
  status      TaskStatus   @default(BACKLOG)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?    @db.Date
  assigneeId  String?
  createdById String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee  User?   @relation("TaskAssignee", fields: [assigneeId], references: [id])
  createdBy User    @relation("TaskCreator", fields: [createdById], references: [id])

  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
}
```

#### Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `ProjectMember` | `userId` | Fast lookup of projects for a user |
| `ProjectMember` | `(projectId, userId)` unique | Prevent duplicate membership |
| `Task` | `projectId` | List tasks by project |
| `Task` | `assigneeId` | Filter tasks by assignee |
| `Task` | `status` | Kanban column filtering |

### Authentication

#### JWT Configuration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Payload | `{ userId: string, email: string }` |
| Header | `Authorization: Bearer <token>` |
| Expiry | Configurable via `JWT_EXPIRES_IN` (default: `7d`) |
| Secret | `JWT_SECRET` environment variable |

#### Password Hashing

- Use `bcrypt` with cost factor 10
- Never return `passwordHash` in API responses

### Zod Validation Schemas

#### Auth Schemas

```typescript
// registerSchema
{
  email: z.string().email().transform(v => v.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
}

// loginSchema
{
  email: z.string().email().transform(v => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
}
```

#### Project Schemas

```typescript
// createProjectSchema / updateProjectSchema
{
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
}

// projectIdParam
{
  id: z.string().uuid(),
}
```

#### Member Schemas

```typescript
// addMemberSchema
{
  email: z.string().email().transform(v => v.toLowerCase().trim()),
}

// memberParams
{
  id: z.string().uuid(),       // projectId
  userId: z.string().uuid(),
}
```

#### Task Schemas

```typescript
const taskStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE"]);
const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

// Helper: due date must be today or future (UTC)
const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
  .refine((date) => {
    const input = new Date(`${date}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return input >= today;
  }, "Due date cannot be in the past");

// createTaskSchema
{
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: taskStatusEnum.optional().default("BACKLOG"),
  priority: taskPriorityEnum.optional().default("MEDIUM"),
  dueDate: dueDateSchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
}

// updateTaskSchema (all fields optional)
{
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: dueDateSchema.nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
}
```

### REST API Specification

**Base URL:** `http://localhost:4000/api` (configurable via `PORT`)

**Content-Type:** `application/json`

#### Authentication Endpoints

##### POST `/auth/register`

Register a new user.

**Auth Required:** No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Jane Doe"
}
```

**Success Response:** `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "createdAt": "2026-06-27T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 409 | `EMAIL_EXISTS` | Email already registered |

---

##### POST `/auth/login`

Authenticate an existing user.

**Auth Required:** No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "createdAt": "2026-06-27T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |

---

##### GET `/auth/me`

Return the currently authenticated user.

**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Doe",
  "createdAt": "2026-06-27T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |

---

#### Project Endpoints

##### POST `/projects`

Create a new project. The authenticated user becomes the creator and is auto-added as a `CREATOR` member.

**Auth Required:** Yes

**Request Body:**

```json
{
  "name": "Website Redesign",
  "description": "Redesign the company website"
}
```

**Success Response:** `201 Created`

```json
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Redesign the company website",
  "creatorId": "uuid",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z",
  "memberCount": 1,
  "taskCount": 0
}
```

---

##### GET `/projects`

List all projects where the authenticated user is a member.

**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Redesign the company website",
      "creatorId": "uuid",
      "createdAt": "2026-06-27T10:00:00.000Z",
      "updatedAt": "2026-06-27T10:00:00.000Z",
      "memberCount": 3,
      "taskCount": 12,
      "role": "CREATOR"
    }
  ]
}
```

---

##### GET `/projects/:id`

Get a single project by ID.

**Auth Required:** Yes  
**Authorization:** Project member only

**Success Response:** `200 OK`

```json
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Redesign the company website",
  "creatorId": "uuid",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z",
  "role": "MEMBER"
}
```

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | User is not a project member |
| 404 | `NOT_FOUND` | Project does not exist |

---

##### PATCH `/projects/:id`

Update project details.

**Auth Required:** Yes  
**Authorization:** Project creator only

**Request Body:**

```json
{
  "name": "Website Redesign v2",
  "description": "Updated scope"
}
```

**Success Response:** `200 OK` — returns updated project object

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | User is not the project creator |
| 404 | `NOT_FOUND` | Project does not exist |

---

##### DELETE `/projects/:id`

Delete a project and all associated members and tasks (cascade).

**Auth Required:** Yes  
**Authorization:** Project creator only

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | User is not the project creator |
| 404 | `NOT_FOUND` | Project does not exist |

---

#### Project Member Endpoints

##### GET `/projects/:id/members`

List all members of a project.

**Auth Required:** Yes  
**Authorization:** Project member only

**Success Response:** `200 OK`

```json
{
  "members": [
    {
      "id": "membership-uuid",
      "userId": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "CREATOR",
      "joinedAt": "2026-06-27T10:00:00.000Z"
    },
    {
      "id": "membership-uuid",
      "userId": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "role": "MEMBER",
      "joinedAt": "2026-06-27T11:00:00.000Z"
    }
  ]
}
```

---

##### POST `/projects/:id/members`

Add a registered user to the project by email.

**Auth Required:** Yes  
**Authorization:** Project creator only

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Success Response:** `201 Created`

```json
{
  "id": "membership-uuid",
  "userId": "uuid",
  "name": "John Smith",
  "email": "john@example.com",
  "role": "MEMBER",
  "joinedAt": "2026-06-27T11:00:00.000Z"
}
```

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | User is not the project creator |
| 404 | `USER_NOT_FOUND` | No registered user with that email |
| 409 | `ALREADY_MEMBER` | User is already a project member |

---

##### DELETE `/projects/:id/members/:userId`

Remove a member from the project.

**Auth Required:** Yes  
**Authorization:** Project creator only

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | User is not the project creator |
| 403 | `CANNOT_REMOVE_CREATOR` | Attempting to remove the project creator |
| 404 | `NOT_FOUND` | Member not found in project |

---

#### Task Endpoints

##### POST `/projects/:id/tasks`

Create a task inside a project.

**Auth Required:** Yes  
**Authorization:** Project member only

**Request Body:**

```json
{
  "title": "Design homepage mockup",
  "description": "Create wireframes for the new homepage",
  "status": "BACKLOG",
  "priority": "HIGH",
  "dueDate": "2026-07-15",
  "assigneeId": "uuid"
}
```

**Success Response:** `201 Created`

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "title": "Design homepage mockup",
  "description": "Create wireframes for the new homepage",
  "status": "BACKLOG",
  "priority": "HIGH",
  "dueDate": "2026-07-15",
  "assigneeId": "uuid",
  "assignee": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com"
  },
  "createdById": "uuid",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid input or past due date |
| 403 | `FORBIDDEN` | User is not a project member |
| 422 | `INVALID_ASSIGNEE` | Assignee is not a project member |

---

##### GET `/projects/:id/tasks`

List tasks for a project.

**Auth Required:** Yes  
**Authorization:** Project member only

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Optional filter: `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE` |

**Success Response:** `200 OK`

```json
{
  "tasks": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "title": "Design homepage mockup",
      "description": "Create wireframes for the new homepage",
      "status": "BACKLOG",
      "priority": "HIGH",
      "dueDate": "2026-07-15",
      "assigneeId": "uuid",
      "assignee": {
        "id": "uuid",
        "name": "John Smith",
        "email": "john@example.com"
      },
      "createdById": "uuid",
      "createdAt": "2026-06-27T10:00:00.000Z",
      "updatedAt": "2026-06-27T10:00:00.000Z"
    }
  ]
}
```

---

##### GET `/projects/:id/tasks/:taskId`

Get a single task.

**Auth Required:** Yes  
**Authorization:** Project member only

**Success Response:** `200 OK` — single task object (same shape as list item)

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | User is not a project member |
| 404 | `NOT_FOUND` | Task not found |

---

##### PATCH `/projects/:id/tasks/:taskId`

Update a task. Used for detail edits and Kanban status changes.

**Auth Required:** Yes  
**Authorization:** Project member only

**Request Body (all fields optional):**

```json
{
  "title": "Updated title",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "dueDate": "2026-07-20",
  "assigneeId": "uuid"
}
```

**Success Response:** `200 OK` — returns updated task object

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid input or past due date |
| 403 | `FORBIDDEN` | User is not a project member |
| 404 | `NOT_FOUND` | Task not found |
| 422 | `INVALID_ASSIGNEE` | Assignee is not a project member |

---

##### DELETE `/projects/:id/tasks/:taskId`

Delete a task.

**Auth Required:** Yes  
**Authorization:** Project member only

**Business Rule:** Tasks with status `DONE` cannot be deleted.

**Success Response:** `204 No Content`

**Error Responses:**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | User is not a project member |
| 404 | `NOT_FOUND` | Task not found |
| 422 | `TASK_COMPLETED` | Task status is `DONE` |

---

#### Dashboard Endpoint

##### GET `/dashboard/summary`

Return aggregate metrics for the authenticated user across all projects they belong to.

**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "totalProjects": 3,
  "totalTasks": 24,
  "completedTasks": 8,
  "pendingTasks": 16
}
```

**Calculation Rules:**

| Metric | Definition |
|--------|------------|
| `totalProjects` | Count of projects where user is a member |
| `totalTasks` | Count of all tasks in those projects |
| `completedTasks` | Tasks with status `DONE` |
| `pendingTasks` | Tasks with status `BACKLOG`, `TODO`, or `IN_PROGRESS` |

---

### Middleware

#### Request Processing Chain

```mermaid
flowchart TD
  req[Incoming Request] --> cors[CORS]
  cors --> json[JSON Parser]
  json --> auth{Protected Route?}
  auth -->|Yes| authMW[authMiddleware]
  auth -->|No| validate
  authMW --> validate[validate Middleware]
  validate --> member{Project Route?}
  member -->|Member required| memberMW[projectMemberMiddleware]
  member -->|Creator required| creatorMW[projectCreatorMiddleware]
  member -->|No| controller[Controller]
  memberMW --> controller
  creatorMW --> controller
  controller --> errorMW[errorMiddleware]
```

| Middleware | Responsibility |
|------------|----------------|
| `authMiddleware` | Extract Bearer token, verify JWT, attach `req.user = { userId, email }` |
| `validate(schema)` | Parse and validate `req.body`, `req.params`, `req.query` with Zod; return 400 on failure |
| `projectMemberMiddleware` | Verify authenticated user is a member of `:id` project; attach `req.membership` |
| `projectCreatorMiddleware` | Verify authenticated user has `CREATOR` role on `:id` project |
| `errorMiddleware` | Catch errors, map to standard JSON error response |

### Error Response Contract

All error responses follow this shape:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": []
}
```

`details` is optional and used for validation errors (array of `{ field, message }`).

#### HTTP Status Codes

| Code | Usage |
|------|-------|
| 400 | Validation failure, malformed request |
| 401 | Missing or invalid authentication token |
| 403 | Authenticated but not authorized for the action |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate member) |
| 422 | Business rule violation (invalid assignee, completed task delete, past due date) |
| 500 | Unexpected server error |

#### Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing JWT |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password on login |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `USER_NOT_FOUND` | 404 | Email not registered (add member) |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `ALREADY_MEMBER` | 409 | User already in project |
| `CANNOT_REMOVE_CREATOR` | 403 | Cannot remove project creator |
| `INVALID_ASSIGNEE` | 422 | Assignee is not a project member |
| `TASK_COMPLETED` | 422 | Cannot delete a completed task |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Bruno API Documentation

API documentation is maintained as a [Bruno](https://www.usebruno.com/) collection at the repository root.

#### Collection Structure

```
bruno/
├── bruno.json
├── environments/
│   └── local.bru
├── auth/
│   ├── register.bru
│   ├── login.bru
│   └── me.bru
├── projects/
│   ├── create-project.bru
│   ├── list-projects.bru
│   ├── get-project.bru
│   ├── update-project.bru
│   └── delete-project.bru
├── members/
│   ├── list-members.bru
│   ├── add-member.bru
│   └── remove-member.bru
├── tasks/
│   ├── create-task.bru
│   ├── list-tasks.bru
│   ├── get-task.bru
│   ├── update-task.bru
│   └── delete-task.bru
└── dashboard/
    └── summary.bru
```

#### Environment Variables (Bruno)

```
baseUrl: http://localhost:4000/api
token: {{login.response.body.token}}
```

Each `.bru` file should include:

- HTTP method and full URL (`{{baseUrl}}/...`)
- Request headers (`Content-Type: application/json`, `Authorization: Bearer {{token}}`)
- Example request body
- Expected status code and example response

### Backend Acceptance Criteria

- [ ] `POST /auth/register` creates a user with hashed password and returns JWT + user (no password hash)
- [ ] `POST /auth/register` returns 409 when email already exists
- [ ] `POST /auth/login` returns JWT for valid credentials and 401 for invalid credentials
- [ ] `GET /auth/me` returns current user when valid token is provided; 401 without token
- [ ] `POST /projects` creates project and auto-adds creator as `CREATOR` member
- [ ] `GET /projects` returns only projects where the user is a member
- [ ] Non-members receive 403 on `GET /projects/:id`, task, and member routes
- [ ] `PATCH /projects/:id` and `DELETE /projects/:id` succeed for creator; return 403 for members
- [ ] `POST /projects/:id/members` adds user by registered email; 404 for unknown email; 409 for duplicate
- [ ] `DELETE /projects/:id/members/:userId` removes member; 403 when attempting to remove creator
- [ ] `POST /projects/:id/tasks` creates task with valid fields and default status `BACKLOG`
- [ ] Task assignee must be a project member; returns 422 otherwise
- [ ] Due date in the past is rejected on create and update
- [ ] `DELETE /projects/:id/tasks/:taskId` returns 422 when task status is `DONE`
- [ ] `GET /dashboard/summary` returns accurate counts for the authenticated user's projects
- [ ] All request bodies are validated with Zod before reaching controllers
- [ ] All protected routes require valid JWT in Authorization header
- [ ] Bruno collection covers all endpoints with working examples

---

## Frontend

### Architecture Overview

```mermaid
flowchart TB
  subgraph nextjs [Next.js App Router]
    pages[Pages]
    components[Components]
    lib[lib/api.ts + lib/auth.ts]
  end
  pages --> components
  components --> lib
  lib -->|REST + Bearer JWT| backend[Express API]
  components --> kanban["@hello-pangea/dnd"]
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js (App Router) | Routing, SSR/CSR, layout |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| @hello-pangea/dnd | Kanban drag-and-drop |
| localStorage | JWT persistence |
| fetch | HTTP client (via `lib/api.ts`) |

### Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Redirect to /dashboard or /login
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── projects/
│       ├── page.tsx
│       └── [id]/
│           ├── page.tsx            # Project details
│           └── board/
│               └── page.tsx        # Kanban board
├── components/
│   ├── auth/
│   │   └── AuthProvider.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── ProtectedLayout.tsx
│   ├── dashboard/
│   │   └── StatCard.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── ProjectList.tsx
│   │   ├── MemberList.tsx
│   │   └── AddMemberForm.tsx
│   ├── tasks/
│   │   ├── TaskForm.tsx
│   │   ├── TaskTable.tsx
│   │   └── TaskCard.tsx
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   └── KanbanColumn.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       └── Toast.tsx
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── constants.ts
├── types/
│   └── index.ts
├── middleware.ts                   # Auth redirect guard
├── tailwind.config.ts
└── package.json
```

### Routes and Navigation

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Root | Public | Redirect to `/dashboard` if authenticated, else `/login` |
| `/login` | Login | Public | Email/password login form |
| `/register` | Register | Public | Registration form |
| `/dashboard` | Dashboard | Protected | Summary stat cards |
| `/projects` | Project List | Protected | List and create projects |
| `/projects/[id]` | Project Details | Protected (member) | Project info, members, task list |
| `/projects/[id]/board` | Kanban Board | Protected (member) | Drag-and-drop task board |

#### Navigation Flow

```mermaid
flowchart TD
  start[App Load] --> checkAuth{Authenticated?}
  checkAuth -->|No| login[/login]
  checkAuth -->|Yes| dashboard[/dashboard]
  login -->|Success| dashboard
  login --> register[/register]
  register -->|Success| dashboard
  dashboard --> projects[/projects]
  projects --> details["/projects/:id"]
  details --> board["/projects/:id/board"]
  board --> details
```

### Authentication Flow

```mermaid
sequenceDiagram
  participant User
  participant UI as Next.js UI
  participant LS as localStorage
  participant API as Express API

  User->>UI: Submit login form
  UI->>API: POST /auth/login
  API-->>UI: token + user
  UI->>LS: Store token
  UI->>UI: Update AuthProvider state
  UI->>User: Redirect to /dashboard

  Note over UI,API: Subsequent requests
  UI->>LS: Read token
  UI->>API: GET /auth/me (Bearer token)
  API-->>UI: user profile

  Note over UI,LS: Logout
  User->>UI: Click logout
  UI->>LS: Remove token
  UI->>User: Redirect to /login
```

#### Auth Implementation Details

| Concern | Implementation |
|---------|----------------|
| Token storage | `localStorage` key: `auth_token` |
| Auth state | React Context via `AuthProvider` |
| Route protection | Next.js `middleware.ts` checks token presence; client-side redirect on 401 |
| Token attachment | `lib/api.ts` reads token and sets `Authorization: Bearer` header |
| Session restore | On app load, call `GET /auth/me`; clear token and redirect on 401 |

### API Integration Layer

**File:** `frontend/lib/api.ts`

```typescript
// Pseudocode — implementation reference
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear token, redirect to login
  }

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
```

#### API Functions to Implement

| Function | Method | Endpoint |
|----------|--------|----------|
| `register(data)` | POST | `/auth/register` |
| `login(data)` | POST | `/auth/login` |
| `getMe()` | GET | `/auth/me` |
| `getProjects()` | GET | `/projects` |
| `getProject(id)` | GET | `/projects/:id` |
| `createProject(data)` | POST | `/projects` |
| `updateProject(id, data)` | PATCH | `/projects/:id` |
| `deleteProject(id)` | DELETE | `/projects/:id` |
| `getMembers(projectId)` | GET | `/projects/:id/members` |
| `addMember(projectId, email)` | POST | `/projects/:id/members` |
| `removeMember(projectId, userId)` | DELETE | `/projects/:id/members/:userId` |
| `getTasks(projectId, status?)` | GET | `/projects/:id/tasks` |
| `getTask(projectId, taskId)` | GET | `/projects/:id/tasks/:taskId` |
| `createTask(projectId, data)` | POST | `/projects/:id/tasks` |
| `updateTask(projectId, taskId, data)` | PATCH | `/projects/:id/tasks/:taskId` |
| `deleteTask(projectId, taskId)` | DELETE | `/projects/:id/tasks/:taskId` |
| `getDashboardSummary()` | GET | `/dashboard/summary` |

### TypeScript Types

**File:** `frontend/types/index.ts`

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  taskCount?: number;
  role?: "CREATOR" | "MEMBER";
}

interface ProjectMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "CREATOR" | "MEMBER";
  joinedAt: string;
}

type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string | null;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}
```

### Display Label Mappings

**File:** `frontend/lib/constants.ts`

| Enum Value | Display Label |
|------------|---------------|
| `BACKLOG` | Backlog |
| `TODO` | Todo |
| `IN_PROGRESS` | In Progress |
| `DONE` | Done |
| `LOW` | Low |
| `MEDIUM` | Medium |
| `HIGH` | High |

### Page Specifications

#### Login Page (`/login`)

**Wireframe:**

```
┌─────────────────────────────────────┐
│           Task Management           │
│                                     │
│  Email    [________________]        │
│  Password [________________]        │
│                                     │
│         [ Login ]                   │
│                                     │
│  Don't have an account? Register    │
└─────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Email field | Required, email format |
| Password field | Required |
| Login button | Calls `POST /auth/login`; stores token; redirects to `/dashboard` |
| Register link | Navigates to `/register` |
| Error state | Toast or inline message on failure |

---

#### Register Page (`/register`)

**Wireframe:**

```
┌─────────────────────────────────────┐
│           Create Account            │
│                                     │
│  Name     [________________]        │
│  Email    [________________]        │
│  Password [________________]        │
│                                     │
│         [ Register ]                │
│                                     │
│  Already have an account? Login     │
└─────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Name field | Required, min 2 characters |
| Email field | Required, email format |
| Password field | Required, min 8 characters |
| Register button | Calls `POST /auth/register`; stores token; redirects to `/dashboard` |
| Login link | Navigates to `/login` |

---

#### Dashboard Page (`/dashboard`)

**Wireframe:**

```
┌──────────────────────────────────────────────────────────┐
│ Navbar: Task Management    Dashboard | Projects | Logout │
├──────────────────────────────────────────────────────────┤
│  Dashboard                                               │
│                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│  │ Total      │ │ Total      │ │ Completed  │ │Pending ││
│  │ Projects   │ │ Tasks      │ │ Tasks      │ │ Tasks  ││
│  │    3       │ │    24      │ │     8      │ │   16   ││
│  └────────────┘ └────────────┘ └────────────┘ └────────┘│
│                                                          │
│  [ View All Projects ]                                   │
└──────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Stat cards | Data from `GET /dashboard/summary` |
| View All Projects | Navigates to `/projects` |
| Loading state | Skeleton cards while fetching |
| Error state | Error message with retry button |

---

#### Project List Page (`/projects`)

**Wireframe:**

```
┌──────────────────────────────────────────────────────────┐
│ Navbar                                                   │
├──────────────────────────────────────────────────────────┤
│  Projects                          [ + Create Project ]  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Website Redesign                                    │ │
│  │ Redesign the company website                        │ │
│  │ 3 members · 12 tasks · Role: Creator               │ │
│  │ [ View ]  [ Edit ]  [ Delete ]                      │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Mobile App                                          │ │
│  │ Build the iOS and Android app                       │ │
│  │ 5 members · 8 tasks · Role: Member                 │ │
│  │ [ View ]                                            │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Project cards | From `GET /projects` |
| Create Project button | Opens modal with `ProjectForm` |
| View button | Navigates to `/projects/[id]` |
| Edit button | Visible only when `role === "CREATOR"`; opens edit modal |
| Delete button | Visible only when `role === "CREATOR"`; confirm dialog then `DELETE /projects/:id` |
| Empty state | Message + Create Project CTA when no projects |

---

#### Project Details Page (`/projects/[id]`)

**Wireframe:**

```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Projects                                       │
├──────────────────────────────────────────────────────────┤
│  Website Redesign                    [ Edit ] [ Delete ] │
│  Redesign the company website                            │
│  [ Open Kanban Board ]                                   │
│                                                          │
│  ── Members ────────────────────── [ + Add Member ]      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Jane Doe (jane@example.com) · Creator               │ │
│  │ John Smith (john@example.com) · Member    [ Remove ]│ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ── Tasks ──────────────────────── [ + Create Task ]     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Title          │ Assignee  │ Priority │ Due  │Status│ │
│  │ Homepage mockup│ John      │ HIGH     │ Jul15│BACKLOG│ │
│  │ API integration│ Jane      │ MEDIUM   │ Jul20│ TODO  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Edit/Delete project | Visible only for creator |
| Open Kanban Board | Navigates to `/projects/[id]/board` |
| Members list | From `GET /projects/:id/members` |
| Add Member form | Creator only; email input; calls `POST /projects/:id/members` |
| Remove member | Creator only; confirm dialog; calls `DELETE /projects/:id/members/:userId` |
| Tasks table | From `GET /projects/:id/tasks`; row click opens edit modal |
| Create Task | Opens `TaskForm` modal |

---

#### Kanban Board Page (`/projects/[id]/board`)

**Wireframe:**

```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Project Details                                │
├──────────────────────────────────────────────────────────┤
│  Kanban: Website Redesign                                │
│                                                          │
│  ┌ Backlog ──┐ ┌ Todo ─────┐ ┌ In Progress ┐ ┌ Done ──┐│
│  │ ┌────────┐│ │ ┌────────┐│ │ ┌──────────┐│ │┌──────┐││
│  │ │Task A  ││ │ │Task B  ││ │ │ Task C   ││ ││Task D│││
│  │ │HIGH    ││ │ │MEDIUM  ││ │ │ LOW      ││ ││      │││
│  │ │Jul 15  ││ │ │Jul 20  ││ │ │ Jul 25   ││ │└──────┘││
│  │ │@John   ││ │ │@Jane   ││ │ │ @John    ││ │        ││
│  │ └────────┘│ │ └────────┘│ │ └──────────┘│ │        ││
│  └───────────┘ └───────────┘ └─────────────┘ └────────┘│
└──────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Four columns | Backlog, Todo, In Progress, Done |
| Task cards | Title, priority badge, due date, assignee name |
| Drag and drop | `@hello-pangea/dnd`; on drop calls `PATCH` with new status |
| Click card | Opens task edit modal (`TaskForm`) |
| Delete in modal | Hidden/disabled when `status === "DONE"` |
| Optimistic update | Update UI immediately; revert on API failure |
| Mobile | Horizontal scroll for columns on small screens |

### Kanban Integration

**Library:** `@hello-pangea/dnd`

#### Column Configuration

```typescript
const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];
```

#### Drag-and-Drop Flow

```mermaid
sequenceDiagram
  participant User
  participant Board as KanbanBoard
  participant API as Express API

  User->>Board: Drag task from Todo to In Progress
  Board->>Board: Optimistic UI update
  Board->>API: PATCH /projects/:id/tasks/:taskId { status: IN_PROGRESS }
  alt Success
    API-->>Board: Updated task
  else Failure
    API-->>Board: Error
    Board->>Board: Revert to previous column
    Board->>User: Show error toast
  end
```

#### Kanban Component Requirements

| Component | Responsibility |
|-----------|----------------|
| `KanbanBoard` | `DragDropContext`; groups tasks by status; handles `onDragEnd` |
| `KanbanColumn` | `Droppable` wrapper; column header with task count |
| `TaskCard` | `Draggable` wrapper; displays task summary; click opens edit modal |

### Key Components

| Component | Props / Responsibility |
|-----------|------------------------|
| `AuthProvider` | Provides auth state, login, logout, register functions |
| `Navbar` | App navigation; shows user name; logout button |
| `ProtectedLayout` | Wraps protected pages; redirects if unauthenticated |
| `StatCard` | `{ label, value, icon? }` — dashboard metric display |
| `ProjectCard` | Project summary with action buttons |
| `ProjectForm` | Create/edit project modal form |
| `MemberList` | Renders member rows with role badges |
| `AddMemberForm` | Email input for adding members |
| `TaskForm` | Create/edit task modal; assignee dropdown, priority, due date |
| `TaskTable` | Tabular task list on project details page |
| `KanbanBoard` | Full Kanban drag-and-drop board |
| `KanbanColumn` | Single status column |
| `TaskCard` | Draggable task card for Kanban |
| `Button` | Primary, secondary, danger variants |
| `Input` | Text input with label and error message |
| `Modal` | Overlay dialog wrapper |
| `Badge` | Status and priority color-coded badges |
| `ConfirmDialog` | Delete confirmation overlay |
| `EmptyState` | Placeholder when lists are empty |
| `Toast` | Success/error notification |

### Client-Side Validation

Validation on the frontend mirrors backend Zod rules for immediate feedback:

| Field | Rule |
|-------|------|
| Email | Valid email format |
| Password | Minimum 8 characters |
| Name | Minimum 2 characters |
| Project name | Required, max 150 characters |
| Task title | Required, max 200 characters |
| Due date | Date picker `min` set to today; reject past dates |
| Assignee | Dropdown populated from project members only |

### UI Styling Guidelines

| Element | Tailwind Approach |
|---------|-------------------|
| Layout | Max-width container, responsive padding |
| Cards | `rounded-lg shadow-sm border border-gray-200 bg-white` |
| Priority: LOW | Gray badge (`bg-gray-100 text-gray-700`) |
| Priority: MEDIUM | Yellow badge (`bg-yellow-100 text-yellow-800`) |
| Priority: HIGH | Red badge (`bg-red-100 text-red-800`) |
| Status badges | Neutral tones; Done uses green (`bg-green-100 text-green-800`) |
| Buttons | Primary (`bg-blue-600`), danger (`bg-red-600`), ghost variants |
| Kanban columns | Fixed min-width, scrollable on mobile |
| Loading | Skeleton pulse animations |
| Errors | Red text inline or toast notifications |

### Error Handling

| Scenario | Frontend Behavior |
|----------|-------------------|
| 401 Unauthorized | Clear token, redirect to `/login` |
| 403 Forbidden | Show error toast ("You don't have permission") |
| 404 Not Found | Show not-found message or redirect |
| 422 Business rule | Show specific error message from API |
| Network error | Show retry option |
| Validation error | Inline field errors |

### Frontend Acceptance Criteria

- [ ] User can register with name, email, and password
- [ ] User can login and is redirected to dashboard
- [ ] User can logout; token is cleared; redirected to login
- [ ] Unauthenticated users are redirected to `/login` from protected routes
- [ ] Authenticated users visiting `/login` or `/register` are redirected to `/dashboard`
- [ ] Dashboard displays four stat cards with data from `/dashboard/summary`
- [ ] Project list shows only projects the user belongs to
- [ ] User can create a new project via modal form
- [ ] Creator sees Edit and Delete buttons on their projects; members do not
- [ ] Creator can update project name and description
- [ ] Creator can delete a project with confirmation dialog
- [ ] Project details page shows project info, members, and tasks
- [ ] Creator can add members by email address
- [ ] Creator can remove members (except themselves as creator)
- [ ] Members section is visible to all project members
- [ ] User can create tasks with title, description, priority, due date, and assignee
- [ ] Assignee dropdown only lists project members
- [ ] Due date picker prevents selection of past dates
- [ ] User can edit task details via modal
- [ ] User can delete tasks except those with Done status
- [ ] Kanban board displays four columns with tasks grouped by status
- [ ] Dragging a task to another column updates status via API
- [ ] Kanban status change persists after page refresh
- [ ] Clicking a task card on the board opens the edit modal
- [ ] Delete button is hidden/disabled for Done tasks
- [ ] 401 responses trigger logout and redirect
- [ ] 403 responses show appropriate error message
- [ ] Loading skeletons shown while data is fetching
- [ ] Empty states shown when no projects, members, or tasks exist
- [ ] Kanban board is horizontally scrollable on mobile viewports

---

## Appendix

### Environment Variables

#### Backend (`backend/.env`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/taskmgmt` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `your-secret-key-min-32-chars` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry duration |
| `PORT` | No | `4000` | Server port |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed frontend origin |

#### Frontend (`frontend/.env.local`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` | Backend API base URL |

### Enum Reference

#### Task Status

| Value | Display | Description |
|-------|---------|-------------|
| `BACKLOG` | Backlog | Task is captured but not yet planned |
| `TODO` | Todo | Task is planned and ready to start |
| `IN_PROGRESS` | In Progress | Task is actively being worked on |
| `DONE` | Done | Task is completed; cannot be deleted |

#### Task Priority

| Value | Display | Color |
|-------|---------|-------|
| `LOW` | Low | Gray |
| `MEDIUM` | Medium | Yellow |
| `HIGH` | High | Red |

#### Project Member Role

| Value | Description |
|-------|-------------|
| `CREATOR` | Project owner; full project and member management |
| `MEMBER` | Team member; task management only |

### Task Status Transitions

In v1, any task can move to any status column without enforced workflow gates. All transitions are valid:

```mermaid
stateDiagram-v2
  [*] --> BACKLOG
  BACKLOG --> TODO
  BACKLOG --> IN_PROGRESS
  BACKLOG --> DONE
  TODO --> BACKLOG
  TODO --> IN_PROGRESS
  TODO --> DONE
  IN_PROGRESS --> BACKLOG
  IN_PROGRESS --> TODO
  IN_PROGRESS --> DONE
  DONE --> BACKLOG
  DONE --> TODO
  DONE --> IN_PROGRESS
```

### Deployment Notes

#### Local Development

1. Start PostgreSQL database
2. Backend:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run dev
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open Bruno collection from `bruno/` to test API endpoints

#### Production Considerations (Future)

| Concern | Recommendation |
|---------|----------------|
| Database | Managed PostgreSQL (e.g., Supabase, RDS, Neon) |
| Backend hosting | Railway, Render, Fly.io, or VPS |
| Frontend hosting | Vercel or Netlify |
| HTTPS | Required for production |
| JWT secret | Strong random string, stored in secrets manager |
| CORS | Set `CORS_ORIGIN` to production frontend URL |
| Database migrations | Run `prisma migrate deploy` in CI/CD pipeline |

### Glossary

| Term | Definition |
|------|------------|
| Project | A container for tasks and team members |
| Task | A unit of work within a project |
| Member | A user who belongs to a project |
| Creator | The user who created the project; has elevated permissions |
| Kanban | Visual board with columns representing task statuses |
| Pending task | Any task not in `DONE` status |
| JWT | JSON Web Token used for stateless authentication |

---

*End of Document*
