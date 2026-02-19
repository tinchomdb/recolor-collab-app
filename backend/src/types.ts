import type { Role, StoreErrorCode } from "@shared/constants";
import type { HistoryEvent, Ticket, TicketFilters } from "@shared/types";

/**
 * Extended filter object used internally by the repository.
 * Adds access-control scoping and multi-status filtering on top of
 * the public `TicketFilters` (which map to HTTP query params).
 * In production these translate to additional SQL WHERE clauses.
 */
export interface RepoTicketFilters extends TicketFilters {
  /** Restrict results to a single partner (access control, not user filter). */
  partnerScope?: string;
  /** Include only tickets whose status is in this set. */
  statusIn?: readonly string[];
}

export type RequestRole =
  | { type: typeof Role.Manager }
  | { type: typeof Role.Operator }
  | { type: typeof Role.Partner; partnerName: string };

export type PartnerRole = Extract<RequestRole, { type: typeof Role.Partner }>;

export type HistoryEventInput = Omit<HistoryEvent, "at"> & { at?: string };

export interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export type StoreResult = { error: StoreErrorCode } | { ticket: Ticket };
