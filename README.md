# TaskFlow

A task management system built for a Greening India engineering assignment. It lets you create projects, add tasks, assign them to users, set statuses and priorities, filter by status or assignee, and manage access — all behind JWT-authenticated APIs with a React frontend. The project detail page shows live task counts by status, and project owners can edit or delete their projects directly from the UI.

**Key versions:**
- Java 17 · Spring Boot 3.2.5 · Spring Data JPA · Flyway
- React 19.2 · TypeScript 6.0 · Vite 8.0 · TanStack Query 5.97
- PostgreSQL 16 · Docker Compose

---

## 1. Architecture Decisions

- **Java / Spring Boot** — Chosen for its strong typing, rich ecosystem, and built-in support for validation, security, and data access. The assignment brief allowed any language with a note in the README.

- **Flyway** — Provides explicit, versioned, and deterministic database migrations. Migrations run automatically on application startup.

- **Layered Architecture** — Standard Controller → Service → Repository layering. Controllers handle HTTP, services contain business logic and authorization checks, and repositories interact with the database via Spring Data JPA.

- **TanStack Query** — Used on the frontend for server state management, caching, background refetching, and optimistic updates.

- **shadcn/ui** — Provides accessible, customizable components where you own the source code. Dark mode is implemented via CSS variables without runtime overhead.

- **Optimistic Updates** — When a task status is changed, the UI updates immediately while the PATCH request fires in the background. It automatically rolls back if the request fails.

- **Authorization** — Task deletion (`DELETE /tasks/{id}`) allows both the task creator and the project owner. Task updates (`PATCH /tasks/{id}`) require the user to be a member of the project (either the owner, or assigned to a task within). 

- **Security** — Passwords are hashed using BCrypt at cost 12. JWT is used for stateless API authentication.

- **Pagination** — Offset pagination with a `PaginationMeta` envelope is implemented on list endpoints (`GET /projects/` and `GET /projects/{id}/tasks`).

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

## 7. Future Improvements

- **Cursor-based Pagination** — Replace offset pagination with cursor-based pagination for better performance on large datasets and to prevent duplicate results during concurrent inserts.
- **WebSocket Integration** — Implement real-time task updates via WebSockets so multiple users editing the same project see changes instantly.
- **Task Reordering** — Add drag-and-drop task prioritization within columns.
- **Advanced Authentication** — Implement short-lived access tokens alongside rotating refresh tokens in HttpOnly cookies.
- **Role-Based Access Control (RBAC)** — Expand the binary ownership model to support fine-grained roles (viewer, editor, admin) and formal project invitations.
- **Background Jobs** — Add a durable message queue or task scheduler for async processing like email notifications.
