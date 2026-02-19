import type { HistoryEventType, TicketStatus, Priority } from "./constants";

export type { TicketStatus, Priority };

export interface HistoryEvent {
  type: HistoryEventType;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  actor: string;
  reason?: string;
  at: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface Ticket {
  id: string;
  style: string;
  priority: Priority;
  partner: string;
  instructions: string[];
  referencePhotos: PhotoOption[];
  partnerPhotos: PhotoOption[];
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  history: HistoryEvent[];
  approvedDate?: string;
  availableActions?: string[];
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: Priority;
  partner?: string;
}

export interface TicketSort {
  sortBy?: string;
  sortOrder?: string;
}

export interface PhotoOption {
  id: string;
  label: string;
  fileName: string;
  thumbnailUrl: string;
  imageUrl: string;
}

export interface CreateTicketInput {
  style: string;
  priority: Priority;
  partner: string;
  instructions: string[];
  referencePhotos?: PhotoOption[];
}

export interface UpdateTicketFields {
  style?: string;
  priority?: Priority;
  partner?: string;
  instructions?: string[];
  referencePhotos?: PhotoOption[];
  partnerPhotos?: PhotoOption[];
}

export interface PartnerOverviewRow {
  partner: string;
  total: number;
  awaitingReceipt: number;
  inProgress: number;
  completed: number;
}

// ── View Metadata (returned inline with list endpoints) ─────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export interface FilterOptionDef {
  key: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
}

export interface ViewMeta {
  filters: FilterOptionDef[];
  sortOptions: SelectOption[];
  columns: ColumnDef[];
  defaultSort?: string;
}

export interface ListResponse<T> {
  data: T[];
  meta: ViewMeta;
}

// ── Dashboard Stats ─────────────────────────────────────────────────────────

export interface KpiCard {
  label: string;
  value: number | string;
  tone?: string;
}

export interface BreakdownRow {
  label: string;
  count: number;
  pct: number;
}

export interface DashboardStats {
  kpiCards: KpiCard[];
  statusBreakdown: BreakdownRow[];
  priorityBreakdown: BreakdownRow[];
  partnerOverview: PartnerOverviewRow[];
  partnerOverviewColumns: ColumnDef[];
}

// ── Meta Options (for forms) ────────────────────────────────────────────────

export interface MetaOptions {
  partners: string[];
  priorities: Priority[];
  styleOptions: string[];
  photoOptions: PhotoOption[];
}

export interface PhotoUploadPayload {
  imageData: string;
  thumbnailData: string;
  fileName: string;
}
