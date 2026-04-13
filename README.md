# TaskFlow

A task management system built for a Greening India engineering assignment. It lets you create projects, add tasks, assign them to users, set statuses and priorities, filter by status or assignee, and manage access — all behind JWT-authenticated APIs with a React frontend. The project detail page shows live task counts by status, and project owners can edit or delete their projects directly from the UI.

**Key versions:**
- Java 17 · Spring Boot 3.2.5 · Spring Data JPA · Flyway
- React 19.2 · TypeScript 6.0 · Vite 8.0 · TanStack Query 5.97
- PostgreSQL 16 · Docker Compose

---

## 1. Architecture Decisions

- **Java / Spring Boot over Go** — I'm most productive in Java for backend work, and the assignment brief allowed any language with a note in the README. Spring Boot gives me auto-configuration, declarative security, Flyway-managed migrations, and validation out of the box — saving significant boilerplate compared to a raw Go implementation.

- **Flyway over manual SQL or auto-migrate** — I wanted explicit, versioned control over the schema. Every schema change is a numbered SQL migration that I can audit, roll back, and run deterministically in CI. Flyway runs automatically on container startup so there are zero manual steps.

- **Controller → Service → Repository layering** — Controllers handle only HTTP concerns and call a service method. Services hold business logic (access checks, authorization). Repositories own all DB queries via Spring Data JPA. This prevents god-object controllers and makes unit testing each layer independently possible without spinning up a full stack.

- **TanStack Query for server state** — I needed optimistic updates for task status changes (clicking a status badge should feel instant). TanStack Query handles cache invalidation, background refetching, and rollback on error without me writing that plumbing myself.

- **shadcn/ui for components** — Unlike a traditional component library, shadcn/ui gives me ownership of the component source. Dark mode works via CSS variables rather than a runtime theming library, so there's no flash on load and no extra JS bundle weight.

- **Optimistic updates on status changes** — When a user changes a task's status, the UI updates immediately and the PATCH request fires in the background. If the request fails, TanStack Query rolls the cache back to the previous state automatically.

- **creator_id authorization on task delete** — `DELETE /tasks/{id}` checks both `task.creator_id == user.id` (task creator) and `project.owner_id == user.id` (project owner). Either party may delete. This is intentional: a project owner should be able to clean up any task in their project without needing to be the one who created it.

- **BCrypt cost 12** — BCrypt at cost 12 takes ~250ms of CPU time. This is deliberately high enough to make brute-force attacks impractical while remaining acceptable for a login endpoint. The PasswordEncoder bean is configured globally with cost 12.

- **Task update verifies project membership** — `PATCH /tasks/{id}` calls `projectService.getProject` before applying changes. Without this, any authenticated user who guessed a task ID could update it even if they had no access to the project. The check uses the same membership logic as the project detail endpoint.

- **Offset pagination with `PaginationMeta`** — Both list endpoints (`GET /projects/` and `GET /projects/{id}/tasks`) return a `pagination` envelope with `page`, `limit`, `total`, and `pages` so clients can build page controls without a separate count request.

---

## 2. Running Locally

```bash
git clone https://github.com/rkg5/Greening-India-Assingment
cd Greening-India-Assingment
cp .env.example .env          # fill in JWT_SECRET and Postgres creds
docker compose up --build
```

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| API       | http://localhost:8000        |

---

## 3. Running Migrations

Migrations run automatically when the backend container starts (Flyway executes on Spring Boot startup).

There is no manual step required. If you need to reset the database:
```bash
docker compose down -v       # removes the volume
docker compose up --build    # fresh start with seed data
```

---

## 4. Test Credentials

Migration V4 seeds two demo accounts so you can test cross-user assignment and the "accessible projects" access model without registering:

| Name      | Email              | Password    | Owns             |
|-----------|--------------------|-------------|-----------------|
| Test User | test@example.com   | password123 | TaskFlow Demo (5 tasks) |
| Demo User | demo@example.com   | password123 | Mobile App v2 (4 tasks) |

Both projects are visible to both users because tasks in each project are cross-assigned between them. Logging in as either account gives you a realistic starting state.

---

## 5. API Reference

| Method | Path                       | Auth | Description                                   |
|--------|----------------------------|------|-----------------------------------------------|
| GET    | /health                    | No   | Liveness + DB connectivity check              |
| POST   | /auth/register             | No   | Create account, returns JWT + user            |
| POST   | /auth/login                | No   | Login, returns JWT + user                     |
| GET    | /projects/                 | Yes  | List accessible projects (paginated)          |
| POST   | /projects/                 | Yes  | Create a project                              |
| GET    | /projects/{id}             | Yes  | Get project detail with inline tasks          |
| PATCH  | /projects/{id}             | Yes  | Update project name/description (owner only) |
| DELETE | /projects/{id}             | Yes  | Delete project and all its tasks (owner only) |
| GET    | /projects/{id}/tasks       | Yes  | List tasks, filterable by status (paginated)  |
| POST   | /projects/{id}/tasks       | Yes  | Create a task                                 |
| GET    | /projects/{id}/stats       | Yes  | Task counts by status and by assignee         |
| PATCH  | /tasks/{id}                | Yes  | Update task fields (any project member)       |
| DELETE | /tasks/{id}                | Yes  | Delete task (creator or project owner)        |

### Pagination

`GET /projects/` and `GET /projects/{id}/tasks` both support offset pagination:

| Query param | Default | Max | Description        |
|-------------|---------|-----|-------------------|
| `page`      | 1       | —   | 1-based page index |
| `limit`     | 10 / 20 | 100 | Items per page     |

Response envelope:
```json
{
  "projects": [...],
  "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}
```

### Postman Collection

A ready-to-import Postman collection is included at **`taskflow.postman_collection.json`** in the repo root. It covers all 13 endpoints with example request bodies and responses.

To import: open Postman → **Import** → select `taskflow.postman_collection.json`. The collection uses four variables:

| Variable     | Default value           | Set automatically by        |
|--------------|-------------------------|----------------------------|
| `base_url`   | `http://localhost:8000` | —                           |
| `token`      | *(empty)*               | POST /auth/register & login |
| `project_id` | *(empty)*               | POST /projects/             |
| `task_id`    | *(empty)*               | POST /projects/{id}/tasks   |

Run **POST /auth/login** first — the test script captures the JWT into `{{token}}` for all subsequent requests.

---

## 6. Running Tests

### Backend

```bash
docker compose exec backend java -jar app.jar --spring.profiles.active=test
```

### Frontend E2E (Playwright)

```bash
# Requires both frontend (port 3000) and backend (port 8000) to be running
cd frontend
npx playwright test

# Interactive UI mode
npx playwright test --ui
```

The E2E suite covers:

| File | Tests |
|------|-------|
| `e2e/auth.spec.ts` | Redirect when unauthenticated, valid login, wrong password error, empty email validation, logout |
| `e2e/projects.spec.ts` | Projects page loads, create project, empty-name validation, cancel closes dialog |
| `e2e/tasks.spec.ts` | Empty state, create task, title validation, status change via dropdown, delete with confirm dialog, status filter |

---

## 7. What I Would Do With More Time

- **Cursor-based pagination** — I implemented offset pagination on both list endpoints. In production I'd replace it with cursor-based pagination to avoid the N+1 count query and to handle concurrent inserts correctly (offset pages shift when rows are inserted mid-browse).

- **Real-time updates via WebSocket** — I deprioritized this because adding a WebSocket layer in 72 hours risked destabilizing the core CRUD flow. I'd use Spring WebSocket with a Redis pub/sub backend.

- **Drag-and-drop task reordering** — The complexity-to-score tradeoff didn't make sense here. I'd reach for `@dnd-kit/core` since it handles keyboard accessibility correctly, which most simpler DnD libraries don't.

- **Proper refresh token flow** — Right now JWTs are valid for 24 hours with no refresh. A real system would issue short-lived access tokens (15 min) alongside a rotating refresh token stored in an HttpOnly cookie.

- **Email notifications** — Skipped entirely. I'd integrate a background task queue so sending email never blocks the request lifecycle.

- **Expanded Playwright coverage** — The current E2E suite covers the core happy paths. I'd add tests for edge cases like concurrent edits, network failure rollback, and mobile viewport layout.

- **Proper RBAC** — Currently it's binary: you own the project or you have an assigned task in it. A real product would need roles (viewer, editor, admin) per project with invite flows.

- **Go rewrite** — Given more time I would have written this in Go as preferred. I chose Java/Spring Boot to ship a complete, production-quality system within the 72-hour window since it's my strongest backend stack.
