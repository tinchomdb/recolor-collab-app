import type { Ticket, UpdateTicketFields } from "@shared/types";
import {
  Priority,
  Role,
  TicketStatus,
  WorkflowAction,
} from "@shared/constants";

// ── Status Visibility Lists ──────────────────────────────────────────────────

export const ALL_STATUSES = [
  TicketStatus.Pending,
  TicketStatus.Sent,
  TicketStatus.Received,
  TicketStatus.InProgress,
  TicketStatus.Completed,
  TicketStatus.Approved,
];

export const PARTNER_VISIBLE_STATUSES = ALL_STATUSES.filter(
  (s): s is typeof s =>
    s !== TicketStatus.Pending && s !== TicketStatus.Approved,
) as readonly (typeof ALL_STATUSES)[number][];

/** All statuses shown in the operator/manager queue (everything except Approved). */
export const QUEUE_VISIBLE_STATUSES = ALL_STATUSES.filter(
  (s): s is typeof s => s !== TicketStatus.Approved,
) as readonly (typeof ALL_STATUSES)[number][];

export const ALL_PRIORITIES = [
  Priority.Low,
  Priority.Medium,
  Priority.High,
  Priority.Urgent,
];

// ── Workflow Rules ────────────────────────────────────────────────────────────

export const ALLOWED_TRANSITIONS: Readonly<
  Record<TicketStatus, readonly TicketStatus[]>
> = {
  [TicketStatus.Pending]: [TicketStatus.Sent],
  [TicketStatus.Sent]: [TicketStatus.Received, TicketStatus.InProgress],
  [TicketStatus.Received]: [TicketStatus.InProgress],
  [TicketStatus.InProgress]: [TicketStatus.Completed],
  [TicketStatus.Completed]: [TicketStatus.Approved, TicketStatus.Pending],
  [TicketStatus.Approved]: [],
};

/** Maps a target status to the action key that reaches it. */
export const STATUS_TO_ACTION: Readonly<Record<string, string>> = {
  [TicketStatus.Sent]: WorkflowAction.Send,
  [TicketStatus.Received]: WorkflowAction.Receive,
  [TicketStatus.InProgress]: WorkflowAction.Start,
  [TicketStatus.Completed]: WorkflowAction.Complete,
  [TicketStatus.Approved]: WorkflowAction.Approve,
  [TicketStatus.Pending]: WorkflowAction.Reject,
};

/** Role restrictions per action. `undefined` means no restriction. */
export const ACTION_ROLE_ALLOWED: Readonly<
  Record<string, readonly Role[] | undefined>
> = {
  [WorkflowAction.Send]: [Role.Manager, Role.Operator],
  [WorkflowAction.Receive]: [Role.Partner],
  [WorkflowAction.Start]: [Role.Partner],
  [WorkflowAction.Complete]: [Role.Partner],
  [WorkflowAction.Approve]: [Role.Manager],
  [WorkflowAction.Reject]: [Role.Manager],
};

// ── Change Tracking ───────────────────────────────────────────────────────────

/** Scalar fields tracked for change-detection. */
const SCALAR_FIELDS = ["style", "priority", "partner"] as const;

/** Array fields tracked with JSON comparison. */
const ARRAY_FIELDS = [
  "instructions",
  "referencePhotos",
  "partnerPhotos",
] as const;

/** Photo array fields — serialized as label lists rather than full JSON. */
export const PHOTO_FIELDS: ReadonlySet<string> = new Set([
  "referencePhotos",
  "partnerPhotos",
]);

export const ALL_TRACKED_FIELDS: readonly (keyof Ticket &
  keyof UpdateTicketFields)[] = [...SCALAR_FIELDS, ...ARRAY_FIELDS];
