# Recolour Ticket Workflow

A full-stack application for managing recolour ticket workflows. It tracks tickets through a multi-step lifecycle — from creation and partner assignment to completion and approval — providing role-based views, filtering, and a complete audit history.

---

## Features

### Ticket Creation

Create recolour tickets with style, priority, partner, free-text instructions, and optional reference assets (photo options with thumbnail previews). Tickets start in **Pending** status and appear in the queue immediately.

### Multi-Step Workflow

Tickets follow a defined status lifecycle with enforced transition rules:

```
Pending → Sent → Received → In Progress → Completed → Approved
                    ↑ (skippable)              ↓
                                          Rejected → Pending (re-enters queue)
```

Each status change is recorded as an immutable history event with actor, timestamp, and (for rejections) a mandatory reason.

### Ticket Queue

Displays all non-approved tickets with support for:

- **Filtering** by status, priority, partner, and free-text keyword search.
- **Sorting** by any column (style, priority, status, partner, date).
- **Inline actions** — contextual workflow buttons (Send, Approve, Reject, etc.) are shown per ticket based on its current status and the logged-in user's role.

### Approval & Rejection

- **Approve**: available only for `Completed` tickets; moves them to the Approved Library.
- **Reject**: available only for `Completed` tickets; requires a non-empty reason, records a `Rejected` history entry, and returns the ticket to `Pending` so it can be reworked and sent again.

### Approved Library

A dedicated view listing all approved tickets, with their own filtering and column layout.

### Partner Overview

Summary table showing each partner's workload: total tickets, awaiting receipt, in progress, and completed counts.

### Dashboard (Manager)

KPI cards, status/priority breakdowns with percentages, and a partner overview table — all in a single view for managers.

### Role-Based Access

Three user roles with distinct permissions and views:

| Role         | Capabilities                                                                        |
| ------------ | ----------------------------------------------------------------------------------- |
| **Manager**  | Full access: dashboard, queue, partners, approved library, approve/reject tickets   |
| **Operator** | Queue management: create, send, view tickets, partners, approved library            |
| **Partner**  | Own tickets only: receive, start, complete; scoped views (My Tickets, My Completed) |

### Ticket Detail & Editing

Dedicated detail view per ticket showing all fields, reference asset image gallery, full chronological history, and an edit form for updating ticket fields (with change tracking in history).

### Image Gallery

Reference assets are displayed as clickable thumbnails that expand into a full-resolution image gallery within a modal.

### Theme Support

Light/dark theme toggle persisted across sessions.

---

## Architecture & Technical Details

### Project Structure

The repository is a monorepo with three top-level packages:

```
├── backend/
│   └── src/
│       ├── config.ts                 Centralised environment config
│       ├── app.ts                    Express app factory (wiring only)
│       ├── server.ts                 Entry point
│       ├── repositories/             Data-access layer
│       │   └── ticketRepository.ts   In-memory ticket store
│       ├── services/                 Business-logic layer
│       │   └── ticketService.ts      Workflow rules, queries, aggregations
│       ├── routes/                   Route / controller layer
│       │   ├── ticketRoutes.ts       /api/tickets endpoints
│       │   └── viewRoutes.ts         Approved, partners, dashboard, meta
│       ├── auth.ts                   Auth middleware
│       ├── validation.ts             Zod request schemas
│       ├── errors.ts                 Error response helpers
│       └── data/                     Seed data & static options
├── frontend/         Vue 3 SPA (TypeScript + Vite)
├── shared/           Shared types & constants used by both packages
└── recolour-case/    Static image assets (photos & thumbnails)
```

### Backend

| Concern       | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Runtime       | Node.js with TypeScript (compiled via tsx)              |
| Framework     | Express 5                                               |
| Validation    | Zod schemas for request body and query params           |
| Data store    | In-memory `TicketRepository` (no database — swap-ready) |
| Auth          | Token-based header (`Authorization`) parsed into roles  |
| Static assets | Express static middleware serving `/api/assets`         |

**Key design decisions:**

- **Three-layer architecture** — the backend is split into **Repository** (data access), **Service** (business logic), and **Routes** (HTTP handling). This mirrors the structure of a production application: swapping the in-memory repository for a database-backed one requires changing a single file without touching business rules or route definitions.
- **Dependency injection via constructor** — `TicketService` receives a `TicketRepository` instance through its constructor; route factories receive the service. This keeps layers decoupled and testable in isolation.
- **Route modules** — all route handlers are extracted into dedicated Express `Router` factories (`ticketRoutes`, `viewRoutes`), leaving `app.ts` as pure wiring (~20 lines).
- **Centralised config** — environment variables are read once in `config.ts` with typed defaults, documented via `.env.example`.
- **Allowed transitions map** — valid status changes are declared as a static `Record<TicketStatus, TicketStatus[]>`, so invalid transitions are caught before any mutation.
- **Role-scoped responses** — list endpoints accept the parsed role and tailor columns, available actions, and visible tickets per role (partners only see their own tickets in partner-visible statuses).
- **View metadata co-located with data** — every list endpoint returns a `ListResponse<T>` containing both `data` and `meta` (filter definitions, sort options, column definitions), allowing the frontend to render filters and tables generically without hardcoding options.
- **Seeded data** — the repository is pre-populated with sample tickets on startup for immediate demo use.

**API surface:**

| Method | Endpoint                    | Purpose                                                     |
| ------ | --------------------------- | ----------------------------------------------------------- |
| `GET`  | `/api/meta/options`         | Form metadata (partners, priorities, styles, photo options) |
| `GET`  | `/api/tickets`              | List queue tickets (with query filters)                     |
| `GET`  | `/api/tickets/:id`          | Single ticket detail                                        |
| `POST` | `/api/tickets`              | Create ticket                                               |
| `PUT`  | `/api/tickets/:id`          | Edit ticket fields                                          |
| `POST` | `/api/tickets/:id/send`     | Transition to Sent                                          |
| `POST` | `/api/tickets/:id/receipt`  | Transition to Received                                      |
| `POST` | `/api/tickets/:id/start`    | Transition to In Progress                                   |
| `POST` | `/api/tickets/:id/complete` | Transition to Completed                                     |
| `POST` | `/api/tickets/:id/approve`  | Transition to Approved                                      |
| `POST` | `/api/tickets/:id/reject`   | Reject with reason → Pending                                |
| `GET`  | `/api/approved`             | List approved tickets                                       |
| `GET`  | `/api/partners/overview`    | Partner workload summary                                    |
| `GET`  | `/api/dashboard/stats`      | Dashboard KPIs and breakdowns                               |

### Frontend

| Concern    | Technology                                                            |
| ---------- | --------------------------------------------------------------------- |
| Framework  | Vue 3 (Composition API, `<script setup>`)                             |
| Language   | TypeScript (strict mode)                                              |
| Build tool | Vite                                                                  |
| Routing    | Vue Router 5 with role-based navigation guards                        |
| State      | Composable-based reactive store (`useTicketsStore`)                   |
| Styling    | Scoped CSS with CSS custom properties (design tokens in `tokens.css`) |

**Key design decisions:**

- **No Pinia** — state is managed through a lightweight composable (`useTicketsStore`) using Vue `ref`/`computed` at module scope, keeping the dependency footprint minimal.
- **Provide/Inject for workflow actions** — `useTicketActions` is provided at the app root via an injection key, so any descendant component can trigger workflow transitions without prop drilling.
- **Generic data-driven components** — `AppDataTable`, `AppFormSelect`, and `TicketFilters` render entirely from metadata received from the API (`ViewMeta`), making them reusable across queue, approved library, and partner views.
- **Role-aware routing** — each route declares allowed roles in `meta.roles`; a global `beforeEach` guard redirects unauthorized users to their default landing page.
- **Composables for cross-cutting concerns** — `useAuth` (auth state & token generation), `useClickOutside` (dropdown dismissal), `useFilterService` (query-param-driven filtering), `useTheme` (dark/light toggle).

### Shared Package

The `shared/` directory contains TypeScript types and constants imported by both backend and frontend via path aliases (`@shared/*`). This guarantees type-safe contracts for ticket statuses, priorities, roles, history event types, and API response shapes across the full stack.

### Testing

| Layer                 | Tool                    | Location                              |
| --------------------- | ----------------------- | ------------------------------------- |
| API integration tests | Vitest + Supertest      | `backend/tests/api.test.ts`           |
| Component unit tests  | Vitest + Vue Test Utils | `frontend/src/components/*.test.ts`   |
| Composable unit tests | Vitest                  | `frontend/src/composables/*.test.ts`  |
| Store unit tests      | Vitest                  | `frontend/src/stores/*.test.ts`       |
| HTTP utility tests    | Vitest                  | `frontend/src/utils/api/http.test.ts` |

Run all tests:

```bash
npm test
```

### Getting Started

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start the backend (default port 3000)
npm run dev:backend

# Start the frontend (Vite dev server)
npm run dev:frontend
```

---

## Production vs. Demo Simplifications

This application is a functional demo. Several areas use lightweight stand-ins for what would be full production-grade systems. The table below summarises each simplification and what the production counterpart would look like.

| Area                                 | Demo approach                                                                                                                                                                                                                       | Production approach                                                                                                                                                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**                         | All tickets live in an in-memory `TicketStore` class. Data is lost on every server restart and seeded from a static file on boot.                                                                                                   | A persistent database (e.g. PostgreSQL, MongoDB) with migrations, indexing, and connection pooling. An ORM or query builder (Prisma, Drizzle, TypeORM) for type-safe access.                                                                                    |
| **Authentication**                   | A plain `Authorization` header carrying the literal strings `manager`, `operator`, or `partner:<name>`. No passwords, no sessions, no token expiry. The frontend stores the role in a Vue `ref` — a page refresh logs the user out. | An OAuth 2.0 / OpenID Connect flow (or SSO via Azure AD / Auth0). JWTs with refresh tokens, secure HTTP-only cookies, and server-side session validation. Passwords hashed with bcrypt/argon2 if using local accounts.                                          |
| **Authorisation**                    | Role checks are performed in a single Express middleware that reads the header and attaches the role to `res.locals`. Action-level permissions are derived from a static map inside the store.                                      | A dedicated authorisation layer (RBAC or ABAC) with permissions stored in the database, enforced by middleware **and** at the service/domain layer. Fine-grained scopes per API endpoint.                                                                       |
| **User management**                  | Users are implicit — there is no user table; the role is selected on a login screen dropdown. Partner names come from seeded ticket data.                                                                                           | A full user/account model with registration, profile management, password reset, and admin CRUD. Partners linked via organisation entities.                                                                                                                     |
| **Validation**                       | Zod schemas validate request payloads on the backend. The frontend relies on HTML attributes and light JS checks.                                                                                                                   | Shared validation schemas (Zod or similar) executed on both client and server. Backend validation remains the authoritative gate; frontend validation provides immediate UX feedback.                                                                           |
| **Error handling**                   | Errors are surfaced as simple JSON `{ error: string }` responses and displayed in a banner at the top of the page. No retry logic or error boundaries.                                                                              | Structured error responses with codes, field-level details, and correlation IDs. Global Vue error boundaries, automatic retries with exponential backoff for transient failures, and centralised error logging (Sentry, Datadog).                               |
| **Image / asset storage**            | Reference images are served from a local `recolour-case/` folder via Express static middleware.                                                                                                                                     | A cloud object store (S3, Azure Blob, GCS) with signed URLs, CDN distribution, and image optimisation (resizing, format conversion).                                                                                                                            |
| **State management**                 | A composable (`useTicketsStore`) using module-scoped `ref`s — effectively a global singleton without Pinia.                                                                                                                         | Pinia stores (or an equivalent) with persistence plugins, optimistic update patterns, and cache invalidation strategies. Server state managed via a data-fetching library (TanStack Query / Vue Query) for caching, deduplication, and background revalidation. |
| **Real-time updates**                | The UI fetches fresh data after every action via full re-fetch of all lists.                                                                                                                                                        | WebSockets or Server-Sent Events to push status changes in real time. Optimistic UI updates with rollback on failure.                                                                                                                                           |
| **Environment config**               | Hardcoded API base URL and port. No `.env` files.                                                                                                                                                                                   | Environment-specific configuration via `.env` files, CI/CD secrets, and a config service. Separate staging and production environments.                                                                                                                         |
| **CI/CD & deployment**               | None — local development only.                                                                                                                                                                                                      | Automated pipelines (GitHub Actions, GitLab CI) running lint, typecheck, tests, and build. Container images deployed to a cloud platform (AWS ECS, GCP Cloud Run, Kubernetes).                                                                                  |
| **Logging & monitoring**             | `console.log` only where necessary.                                                                                                                                                                                                 | Structured JSON logging (Winston, Pino) with log levels, request tracing, and correlation IDs. APM dashboards and alerting.                                                                                                                                     |
| **Rate limiting & security headers** | None. CORS is fully open (`*`).                                                                                                                                                                                                     | Rate limiting (express-rate-limit / API gateway), Helmet for security headers, strict CORS origins, CSRF protection, and input sanitisation.                                                                                                                    |
