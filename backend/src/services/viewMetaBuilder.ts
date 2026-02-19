import type { ColumnDef, FilterOptionDef, ViewMeta } from "@shared/types";
import {
  ALL_PRIORITIES,
  ALL_STATUSES,
  APPROVED_COLUMNS,
  APPROVED_COLUMNS_PARTNER,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  PARTNER_OVERVIEW_COLUMNS,
  PARTNER_TICKET_COLUMNS,
  PARTNER_VISIBLE_STATUSES,
  QUEUE_COLUMNS,
  SORT_OPTIONS,
} from "../constants";

// ── Shared helpers ────────────────────────────────────────────────────────

const toOptions = (values: readonly string[]) =>
  values.map((v) => ({ label: v, value: v }));

const statusFilter = (
  statuses: readonly string[],
): FilterOptionDef => ({
  key: "status",
  label: "Status",
  options: toOptions(statuses),
  placeholder: "All Statuses",
});

const PRIORITY_FILTER: FilterOptionDef = {
  key: "priority",
  label: "Priority",
  options: toOptions(ALL_PRIORITIES),
  placeholder: "All Priorities",
};

function buildListMeta(
  filters: FilterOptionDef[],
  columns: ColumnDef[],
): ViewMeta {
  return {
    filters,
    sortOptions: SORT_OPTIONS,
    columns,
    defaultSort: `${DEFAULT_SORT_BY}:${DEFAULT_SORT_ORDER}`,
  };
}

const columnsOnlyMeta = (columns: ColumnDef[]): ViewMeta => ({
  filters: [],
  sortOptions: [],
  columns,
});

// ── Queue (operator / manager) ────────────────────────────────────────────

export function buildQueueMeta(partners: string[]): ViewMeta {
  return buildListMeta(
    [
      statusFilter(ALL_STATUSES),
      PRIORITY_FILTER,
      {
        key: "partner",
        label: "Partner",
        options: toOptions(partners),
        placeholder: "All Partners",
      },
    ],
    QUEUE_COLUMNS,
  );
}

// ── Partner ticket list ───────────────────────────────────────────────────

export function buildPartnerTicketListMeta(): ViewMeta {
  return buildListMeta(
    [statusFilter(PARTNER_VISIBLE_STATUSES), PRIORITY_FILTER],
    PARTNER_TICKET_COLUMNS,
  );
}

// ── Approved views ────────────────────────────────────────────────────────

export function buildApprovedMeta(): ViewMeta {
  return columnsOnlyMeta(APPROVED_COLUMNS);
}

export function buildApprovedMetaForPartner(): ViewMeta {
  return columnsOnlyMeta(APPROVED_COLUMNS_PARTNER);
}

// ── Partner overview ──────────────────────────────────────────────────────

export const PARTNER_OVERVIEW_META: ViewMeta = columnsOnlyMeta(
  PARTNER_OVERVIEW_COLUMNS,
);
