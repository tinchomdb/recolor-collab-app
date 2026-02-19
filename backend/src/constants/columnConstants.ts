// ── Column Definitions ────────────────────────────────────────────────────────

export const QUEUE_COLUMNS = [
  { key: "id", label: "Ticket ID" },
  { key: "priority", label: "Priority" },
  { key: "partner", label: "Partner" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export const PARTNER_TICKET_COLUMNS = [
  { key: "id", label: "Ticket ID" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export const APPROVED_COLUMNS = [
  { key: "id", label: "Ticket ID" },
  { key: "partner", label: "Partner" },
  { key: "approvedDate", label: "Approved Date" },
];

export const APPROVED_COLUMNS_PARTNER = [
  { key: "id", label: "Ticket ID" },
  { key: "approvedDate", label: "Approved Date" },
];

export const PARTNER_OVERVIEW_COLUMNS = [
  { key: "partner", label: "Partner" },
  { key: "total", label: "Total" },
  { key: "awaitingReceipt", label: "Awaiting Receipt" },
  { key: "inProgress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];
