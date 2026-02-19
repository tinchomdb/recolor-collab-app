import type { Ticket } from "@shared/types";
import { Priority, TicketStatus } from "@shared/constants";

// ── Sort Defaults ─────────────────────────────────────────────────────────────

export const DEFAULT_SORT_BY = "createdAt";
export const DEFAULT_SORT_ORDER = "desc";

// ── Sort Option Definitions ───────────────────────────────────────────────────

export const SORT_OPTIONS = [
  { label: "Created Date Ascending", value: "createdAt:asc" },
  { label: "Created Date Descending", value: "createdAt:desc" },
  { label: "Priority Ascending", value: "priority:asc" },
  { label: "Priority Descending", value: "priority:desc" },
  { label: "Partner Ascending", value: "partner:asc" },
  { label: "Partner Descending", value: "partner:desc" },
  { label: "Status Ascending", value: "status:asc" },
  { label: "Status Descending", value: "status:desc" },
];

// ── Sort Comparators ──────────────────────────────────────────────────────────

export const SORT_COMPARATORS: Readonly<
  Record<string, (a: Ticket, b: Ticket) => number>
> = {
  createdAt: (a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  priority: (a, b) => {
    const w: Record<string, number> = {
      [Priority.Low]: 1,
      [Priority.Medium]: 2,
      [Priority.High]: 3,
      [Priority.Urgent]: 4,
    };
    return w[a.priority] - w[b.priority];
  },
  status: (a, b) => {
    const w: Record<string, number> = {
      [TicketStatus.Pending]: 1,
      [TicketStatus.Sent]: 2,
      [TicketStatus.Received]: 3,
      [TicketStatus.InProgress]: 4,
      [TicketStatus.Completed]: 5,
      [TicketStatus.Approved]: 6,
    };
    return w[a.status] - w[b.status];
  },
  partner: (a, b) => a.partner.localeCompare(b.partner),
};
