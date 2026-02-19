// ── Ticket Statuses ─────────────────────────────────────────────────────────

export const TicketStatus = {
  Pending: "Pending",
  Sent: "Sent",
  Received: "Received",
  InProgress: "In Progress",
  Completed: "Completed",
  Approved: "Approved",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

// ── Priorities ──────────────────────────────────────────────────────────────

export const Priority = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Urgent: "Urgent",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const DEFAULT_PRIORITY: Priority = Priority.Medium;

// ── History Event Types ─────────────────────────────────────────────────────

export const HistoryEventType = {
  Created: "Created",
  Edited: "Edited",
  StatusChanged: "StatusChanged",
} as const;

export type HistoryEventType =
  (typeof HistoryEventType)[keyof typeof HistoryEventType];

// ── Store Error Codes ───────────────────────────────────────────────────────

export const StoreErrorCode = {
  NotFound: "NOT_FOUND",
  InvalidTransition: "INVALID_TRANSITION",
} as const;

export type StoreErrorCode =
  (typeof StoreErrorCode)[keyof typeof StoreErrorCode];

// ── Auth ────────────────────────────────────────────────────────────────────

/**
 * Simple auth-token convention for this demo app.
 * Manager sends "manager"; operator sends "operator"; partner sends "partner:<name>".
 */
export const AUTH_ROLE_MANAGER = "manager" as const;
export const AUTH_ROLE_OPERATOR = "operator" as const;
export const AUTH_PARTNER_PREFIX = "partner:" as const;

// ── User Roles ──────────────────────────────────────────────────────────────

export const Role = {
  Manager: "manager",
  Operator: "operator",
  Partner: "partner",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// ── Workflow Action Keys ────────────────────────────────────────────────────

export const WorkflowAction = {
  Send: "send",
  Receive: "receive",
  Start: "start",
  Complete: "complete",
  Approve: "approve",
  Reject: "reject",
} as const;

export type WorkflowAction =
  (typeof WorkflowAction)[keyof typeof WorkflowAction];
