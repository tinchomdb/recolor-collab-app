# Recolour Ticket Workflow

A full-stack application for managing recolour ticket workflows. It tracks tickets through a multi-step lifecycle — from creation and partner assignment to completion and approval — providing role-based views, filtering, and a complete audit history.

---

### Getting Started

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start the backend (default port 3001)
npm run dev:backend

# Start the frontend (Vite dev server)
npm run dev:frontend
```

Run all tests:

```bash
npm test
```

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

- **Filtering** by status, priority, and partner.
- **Sorting** by date, priority, status, and partner.
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

### Partner Photo Uploads

Partners can upload progress photos directly from the ticket detail view while a ticket is in the active partner workflow (`In Progress`).

- Upload actions are available only to the assigned partner.
- New uploads are enabled only when the ticket is `In Progress`.
- Uploaded photos are shown as thumbnails in the ticket gallery and can be removed by the partner.
- Partner photos remain attached to the ticket and are visible in ticket details/history context.

### Theme Support

Light/dark theme toggle persisted across sessions.

---

## Engineering Highlights

- **Contract-first monorepo design** — backend and frontend share domain models and constants from `shared/`, reducing API drift and keeping workflow/state types aligned across the stack.
- **Layered backend architecture** — route handlers are kept thin, business rules live in services, and persistence is isolated in repositories, which keeps workflow logic testable and storage-swappable.
- **Dependency injection at composition root** — services and route modules are wired in one place (`createApp`), enabling isolated tests and cleaner replacement of infrastructure concerns.
- **Defense-in-depth authorization** — role parsing, route-level role guards, and partner-scoped ticket access checks are combined so users only see and mutate allowed resources.
- **Strict workflow governance** — transitions are validated against an explicit allowed-transition map, with immutable history events for status and field edits to preserve auditability.
- **Metadata-driven UI rendering** — list filters, sort options, and table columns are delivered by API metadata so multiple views reuse the same generic table/filter components.
- **Role-aware frontend data orchestration** — the store fetch strategy adapts by role (manager/operator/partner), preventing unnecessary calls and aligning data loading with permissions.
- **Typed HTTP layer with resilience primitives** — centralized API client supports auth header injection, timeout/abort handling, normalized error surfacing, and typed responses.
- **Image pipeline for partner updates** — partner uploads include client-side thumbnail generation and backend file-type checks, with restricted upload/removal to in-progress partner tickets.
- **Quality gates by script and test layer** — API integration tests, frontend component/store/HTTP tests, and combined quality scripts (`lint` + coverage) support regression-safe iteration.
- **Discriminated unions and result types** — `RequestRole` uses a TypeScript discriminated union for exhaustive role handling; service methods return `StoreResult` (error-as-value pattern) instead of throwing exceptions.
- **Generic Vue components** — `AppDataTable` uses `<script setup generic="TRow extends Record<string, any>">` for type-safe, reusable row rendering across all list views.
- **Immutable data boundaries** — the service layer returns `structuredClone`d data on every outbound call, preventing callers from mutating repository internal state.
- **Field-level change detection** — `applyAndDetectChanges` tracks per-field diffs when editing tickets, serialising photo arrays as human-readable label lists for audit history.
- **Comprehensive design token system** — 50+ CSS custom properties organised into font scales, semantic colours (with full dark-theme overrides), spacing, radii, borders, focus rings, and layout tokens — zero hardcoded values in component styles.
- **Accessibility throughout** — ARIA attributes (`role="dialog"`, `aria-modal`, `aria-expanded`, `aria-haspopup`, `aria-label`, `aria-hidden`), `:focus-visible` on all interactive elements, keyboard navigation support, and semantic HTML.
- **Transition handler factory** — a single factory function generates all six workflow transition route handlers, eliminating repetitive boilerplate.
- **Centralised error normalisation** — eight typed error helpers funnel through a private `sendApiError` on the backend; a `safe()` wrapper in the store clears, executes, and catches every action uniformly on the frontend.
- **Route meta module augmentation** — Vue Router's `RouteMeta` interface is extended with `roles` and `public` fields for fully type-safe navigation guards.
- **Zod preprocessor utilities** — custom `optionalQueryParam` factory normalises Express array quirks, trims whitespace, and converts empty strings to `undefined`; `.refine()` on update schemas prevents empty payloads.

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
│       ├── constants/                Workflow, column, and sort constants
│       ├── data/                     Seed data & static options
│       ├── middleware/               Route-level access guards
│       │   └── requireTicketAccess.ts Partner-scoped ticket checks
│       ├── repositories/             Data-access layer
│       │   └── ticketRepository.ts   In-memory ticket store
│       ├── services/                 Business-logic layer
│       │   ├── ticketService.ts      Workflow rules, queries, aggregations
│       │   ├── dashboardService.ts   KPI and breakdown calculations
│       │   ├── photoService.ts       File I/O for partner uploads
│       │   └── viewMetaBuilder.ts    Column/filter/sort metadata assembly
│       ├── routes/                   Route / controller layer
│       │   ├── ticketRoutes.ts       /api/tickets endpoints
│       │   ├── viewRoutes.ts         Approved, partners, dashboard, meta
│       │   └── photoRoutes.ts        Partner photo upload/delete
│       ├── auth.ts                   Auth middleware
│       ├── validation.ts             Zod request schemas
│       ├── errors.ts                 Error response helpers
│       └── types.ts                  Internal backend types
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
- **Centralised config** — environment variables are read once in `config.ts` with typed defaults.
- **Allowed transitions map** — valid status changes are declared as a static `Record<TicketStatus, TicketStatus[]>`, so invalid transitions are caught before any mutation.
- **Role-scoped responses** — list endpoints accept the parsed role and tailor columns, available actions, and visible tickets per role (partners only see their own tickets in partner-visible statuses).
- **View metadata co-located with data** — every list endpoint returns a `ListResponse<T>` containing both `data` and `meta` (filter definitions, sort options, column definitions), allowing the frontend to render filters and tables generically without hardcoding options.
- **Seeded data** — the repository is pre-populated with sample tickets on startup for immediate demo use.

**API surface:**

| Method   | Endpoint                           | Purpose                                                     |
| -------- | ---------------------------------- | ----------------------------------------------------------- |
| `GET`    | `/api/meta/options`                | Form metadata (partners, priorities, styles, photo options) |
| `GET`    | `/api/tickets`                     | List queue tickets (with query filters)                     |
| `GET`    | `/api/tickets/:id`                 | Single ticket detail                                        |
| `POST`   | `/api/tickets`                     | Create ticket                                               |
| `PUT`    | `/api/tickets/:id`                 | Edit ticket fields                                          |
| `POST`   | `/api/tickets/:id/send`            | Transition to Sent                                          |
| `POST`   | `/api/tickets/:id/receipt`         | Transition to Received                                      |
| `POST`   | `/api/tickets/:id/start`           | Transition to In Progress                                   |
| `POST`   | `/api/tickets/:id/complete`        | Transition to Completed                                     |
| `POST`   | `/api/tickets/:id/approve`         | Transition to Approved                                      |
| `POST`   | `/api/tickets/:id/reject`          | Reject with reason → Pending                                |
| `POST`   | `/api/tickets/:id/photos`          | Upload partner photo                                        |
| `DELETE` | `/api/tickets/:id/photos/:photoId` | Delete partner photo                                        |
| `GET`    | `/api/approved`                    | List approved tickets                                       |
| `GET`    | `/api/partners/overview`           | Partner workload summary                                    |
| `GET`    | `/api/dashboard/stats`             | Dashboard KPIs and breakdowns                               |

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
- **Event-driven workflow actions** — workflow transitions are dispatched through the store composable and propagated via `@action` event emissions, keeping components decoupled without prop drilling.
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
| Store unit tests      | Vitest                  | `frontend/src/stores/*.test.ts`       |
| HTTP utility tests    | Vitest                  | `frontend/src/utils/api/http.test.ts` |

---

## Production vs. Demo Simplifications

This application is a functional demo. Several areas use lightweight stand-ins for what would be full production-grade systems. The table below summarises each simplification and what the production counterpart would look like.

| Area                                 | Demo approach                                                                                                                                                                                                                       | Production approach                                                                                                                                                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**                         | All tickets live in an in-memory `TicketRepository` class. Data is lost on every server restart and seeded from a static file on boot.                                                                                              | A persistent database (e.g. PostgreSQL, MongoDB) with migrations, indexing, and connection pooling. An ORM or query builder (Prisma, Drizzle, TypeORM) for type-safe access.                                                                                    |
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
