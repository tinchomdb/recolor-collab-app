# Recolour Workflow Specification

## Scope

This project models **recolour ticket workflow management** only. It does not perform actual image recolouring.

## Core Entities

### Ticket

- `id`: unique string
- `style`: string (e.g., `15377486`)
- `priority`: one of `Low | Medium | High | Urgent`
- `partner`: string
- `instructions`: array of instruction lines
- `referenceAssets`: array of reference image names/paths (optional)
- `status`: one of `Pending | Sent | Received | In Progress | Completed | Approved`
- `createdAt`, `updatedAt`: ISO datetime strings
- `history`: ordered array of immutable history events

### PhotoOption

- `id`: unique string
- `label`: display name
- `fileName`: original file name
- `thumbnailUrl`: URL to the thumbnail image
- `imageUrl`: URL to the full-resolution image

### History Event

- `type`: status/action name
- `fromStatus`: previous status or `null`
- `toStatus`: next status or `null`
- `actor`: string
- `reason`: optional string (required for reject)
- `at`: ISO datetime string

## Status Workflow

- New ticket starts in `Pending`.
- Allowed transitions:
  - `Pending -> Sent` (send to partner)
  - `Sent -> Received` (partner acknowledges receipt — skippable)
  - `Sent -> In Progress` (partner started, skipping receipt)
  - `Received -> In Progress` (partner started after acknowledging receipt)
  - `In Progress -> Completed` (partner done)
  - `Completed -> Approved` via **approve** (ticket appears in Approved Library)
  - `Completed -> Pending` via **reject** (must write a `Rejected` history event, then current status becomes `Pending`)
- Invalid transitions must return a validation error and not mutate ticket.

## Required Features

### 1) Recolour Ticket Creation

- Form fields: reference assets, style, priority, partner, and instructions.
- Validation:
  - required: style, priority, partner
  - at least one instruction line
  - reference assets are optional
- On success, ticket appears in queue as `Pending`.

### 2) Ticket Queue

- Show all non-approved tickets (status !== `Approved`).
- Display: style, reference assets, partner, priority, status.
- Filters required:
  - status
  - priority
  - partner
  - style/reference-asset keyword

### 3) Partner Integration Simulation

- Send action on `Pending` ticket changes status to `Sent`.
- Receive action on `Sent` ticket changes status to `Received` (skippable).
- Partner start action changes `Sent` or `Received` to `In Progress`.
- Complete action changes `In Progress` to `Completed`.

### 4) Approval & Storage

- Approve available only for `Completed` tickets — changes status to `Approved`.
- Approved tickets are visible in Approved Library.
- Reject available only for `Completed` and requires non-empty reason.
- Reject must:
  - write history entry `Rejected` with actor, reason, timestamp
  - return current ticket status to `Pending`
  - keep all prior history entries

### 5) Navigation

- Main app layout must include sidebar/menu entries:
  - Queue
  - Approved Library
  - Partner Overview

## API Expectations (MVP)

- `GET /api/tickets` with optional query filters: `status`, `priority`, `partner`, `q`.
- `POST /api/tickets` create ticket.
- `POST /api/tickets/:id/send`
- `POST /api/tickets/:id/receipt` (marks as Received)
- `POST /api/tickets/:id/start`
- `POST /api/tickets/:id/complete`
- `POST /api/tickets/:id/approve`
- `POST /api/tickets/:id/reject` body: `{ reason, actor }`
- `GET /api/approved`
- `GET /api/partners/overview`

## Edge Cases

1. Reject without reason -> `400`.
2. Approve ticket not in `Completed` -> `400`.
3. Send ticket not in `Pending` -> `400`.
4. Complete ticket not in `In Progress` -> `400`.
5. Unknown ticket ID -> `404`.
6. Duplicate approve (ticket already `Approved`) -> `400`.
7. Filters that match no records return empty array.
8. Rejected ticket remains editable/reworkable and can be sent again.
9. History order must be chronological append-only.
10. Queue excludes approved tickets.
