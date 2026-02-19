/**
 * Ticket service — domain / business-logic layer.
 *
 * All workflow rules (allowed transitions, role restrictions, change
 * detection, history tracking) live here.  Data access is delegated to
 * the injected `TicketRepository`, keeping the persistence mechanism
 * swappable without touching business logic.
 *
 * Presentation concerns (view metadata) and reporting (dashboard KPIs)
 * are delegated to `viewMetaBuilder` and `DashboardService` respectively.
 */

import type {
  FieldChange,
  HistoryEventInput,
  PartnerRole,
  RepoTicketFilters,
  RequestRole,
  StoreResult,
} from "../types";
import type {
  CreateTicketInput,
  ListResponse,
  MetaOptions,
  Ticket,
  TicketFilters,
  TicketSort,
  UpdateTicketFields,
} from "@shared/types";
import {
  HistoryEventType,
  Role,
  StoreErrorCode,
  TicketStatus,
} from "@shared/constants";
import { PHOTO_OPTIONS, STYLE_OPTIONS } from "../data/workflowData";
import {
  ACTION_ROLE_ALLOWED,
  ALL_PRIORITIES,
  ALL_TRACKED_FIELDS,
  ALLOWED_TRANSITIONS,
  PARTNER_VISIBLE_STATUSES,
  PHOTO_FIELDS,
  QUEUE_VISIBLE_STATUSES,
  STATUS_TO_ACTION,
} from "../constants";
import { TicketRepository } from "../repositories/ticketRepository";
import {
  buildQueueMeta,
  buildPartnerTicketListMeta,
  buildApprovedMeta,
  buildApprovedMetaForPartner,
} from "./viewMetaBuilder";

export class TicketService {
  constructor(private readonly repo: TicketRepository) {}

  // ── Public API ──────────────────────────────────────────────────────────

  /** Queue list for operators / managers. */
  getTickets(
    filters: TicketFilters,
    sort: TicketSort,
    role: RequestRole,
  ): ListResponse<Ticket> {
    const repoFilters: RepoTicketFilters = {
      ...filters,
      statusIn: QUEUE_VISIBLE_STATUSES,
    };
    const tickets = this.repo.getTickets(repoFilters, sort);
    const data = tickets.map((t) => this.withActions(t, role));
    const partners = this.repo.getDistinctPartners();
    return { data, meta: buildQueueMeta(partners) };
  }

  /** Ticket list scoped to the calling partner. */
  getTicketsForPartner(
    filters: TicketFilters,
    sort: TicketSort,
    role: PartnerRole,
  ): ListResponse<Ticket> {
    const repoFilters: RepoTicketFilters = {
      ...filters,
      statusIn: PARTNER_VISIBLE_STATUSES,
    };
    const tickets = this.repo.getTicketsForPartner(
      role.partnerName,
      repoFilters,
      sort,
    );
    const data = tickets.map((ticket) => this.withActions(ticket, role));
    return { data, meta: buildPartnerTicketListMeta() };
  }

  /** Approved-tickets list for operators / managers. */
  getApprovedTickets(): ListResponse<Ticket> {
    const tickets = this.repo.getTickets({
      status: TicketStatus.Approved,
    });
    const data = tickets.map((t) => this.enrichWithApprovedDate(t));
    return { data, meta: buildApprovedMeta() };
  }

  /** Approved-tickets list scoped to the calling partner. */
  getApprovedTicketsForPartner(role: PartnerRole): ListResponse<Ticket> {
    const tickets = this.repo.getTicketsForPartner(role.partnerName, {
      status: TicketStatus.Approved,
    });
    const data = tickets.map((t) => this.enrichWithApprovedDate(t));
    return { data, meta: buildApprovedMetaForPartner() };
  }

  create(input: CreateTicketInput, actor: string): Ticket {
    const id = this.repo.generateId();
    const ticket = this.buildTicket(id, input, this.now(), actor);
    this.repo.addTicket(ticket);
    return structuredClone(ticket);
  }

  /**
   * Bulk-seeds demo tickets with deterministic, offset timestamps so that
   * createdAt values are unique and sortable. Not part of the production API.
   */
  seedTickets(inputs: CreateTicketInput[], actor: string): void {
    const base = Date.now();
    inputs.forEach((input, i) => {
      const id = this.repo.generateId();
      const createdAt = new Date(base + i).toISOString();
      this.repo.addTicket(this.buildTicket(id, input, createdAt, actor));
    });
  }

  findById(id: string, role: RequestRole): Ticket | undefined {
    const ticket = this.repo.getTicketById(id);
    if (!ticket) return undefined;

    if (role.type === Role.Partner) {
      if (ticket.partner !== role.partnerName) return undefined;
      // Pending tickets are not yet the partner's concern
      if (ticket.status === TicketStatus.Pending) return undefined;
    }

    return this.withActions(ticket, role);
  }

  updateTicket(
    id: string,
    input: UpdateTicketFields,
    actor: string,
  ): StoreResult {
    const ticket = this.repo.getTicketById(id);
    if (!ticket) return { error: StoreErrorCode.NotFound };

    const changes = this.applyAndDetectChanges(ticket, input);
    if (changes.length > 0) {
      ticket.updatedAt = this.now();
      for (const change of changes) {
        this.addHistory(ticket, {
          type: HistoryEventType.Edited,
          fromStatus: ticket.status,
          toStatus: ticket.status,
          actor,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        });
      }
    }

    return { ticket: structuredClone(ticket) };
  }

  changeTicketStatus(
    id: string,
    toStatus: TicketStatus,
    actor: string,
    reason?: string,
  ): StoreResult {
    const ticket = this.repo.getTicketById(id);
    if (!ticket) return { error: StoreErrorCode.NotFound };

    if (!ALLOWED_TRANSITIONS[ticket.status].includes(toStatus)) {
      return { error: StoreErrorCode.InvalidTransition };
    }

    const fromStatus = ticket.status;
    ticket.status = toStatus;
    ticket.updatedAt = this.now();

    this.addHistory(ticket, {
      type: HistoryEventType.StatusChanged,
      fromStatus,
      toStatus,
      actor,
      ...(reason !== undefined && { reason }),
    });

    return { ticket: structuredClone(ticket) };
  }

  getMetaOptions(): MetaOptions {
    return {
      partners: this.repo.getDistinctPartners(),
      priorities: [...ALL_PRIORITIES],
      styleOptions: [...STYLE_OPTIONS],
      photoOptions: structuredClone(PHOTO_OPTIONS),
    };
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private addHistory(ticket: Ticket, event: HistoryEventInput) {
    ticket.history.push({
      ...event,
      at: event.at ?? this.now(),
    });
  }

  private buildTicket(
    id: string,
    input: CreateTicketInput,
    createdAt: string,
    actor: string,
  ): Ticket {
    return {
      id,
      style: input.style,
      priority: input.priority,
      partner: input.partner,
      instructions: [...input.instructions],
      referencePhotos: [...(input.referencePhotos ?? [])],
      partnerPhotos: [],
      status: TicketStatus.Pending,
      createdAt,
      updatedAt: createdAt,
      history: [
        {
          type: HistoryEventType.Created,
          fromStatus: null,
          toStatus: TicketStatus.Pending,
          actor,
          at: createdAt,
        },
      ],
    };
  }

  private now(): string {
    return new Date().toISOString();
  }

  /** Compute available workflow actions for a ticket based on role. */
  private getAvailableActions(ticket: Ticket, role: RequestRole): string[] {
    const reachableStatuses = ALLOWED_TRANSITIONS[ticket.status] ?? [];
    const actions: string[] = [];

    for (const status of reachableStatuses) {
      const action = STATUS_TO_ACTION[status];
      if (action && this.isAllowedForRole(action, role.type)) {
        actions.push(action);
      }
    }

    return actions;
  }

  /** Check whether a role is permitted to perform a given action. */
  private isAllowedForRole(
    action: string,
    roleType: RequestRole["type"],
  ): boolean {
    const allowedRoles = ACTION_ROLE_ALLOWED[action];

    // No restriction means every role can perform it
    if (!allowedRoles) return false;

    return allowedRoles.includes(roleType);
  }

  /** Clone a ticket and attach its available workflow actions. */
  private withActions(ticket: Ticket, role: RequestRole): Ticket {
    const clone = structuredClone(ticket);
    clone.availableActions = this.getAvailableActions(clone, role);
    return clone;
  }

  /** Clone a ticket and attach its approval date from history. */
  private enrichWithApprovedDate(ticket: Ticket): Ticket {
    const clone = structuredClone(ticket);
    const approvalEvent = clone.history.findLast(
      (e) =>
        e.type === HistoryEventType.StatusChanged &&
        e.toStatus === TicketStatus.Approved,
    );
    clone.approvedDate = approvalEvent?.at;
    return clone;
  }

  /**
   * Detects changed fields, applies them to the ticket, and returns the list
   * of changes (empty if nothing changed).
   */
  private applyAndDetectChanges(
    ticket: Ticket,
    input: UpdateTicketFields,
  ): FieldChange[] {
    const changes: FieldChange[] = [];

    for (const field of ALL_TRACKED_FIELDS) {
      if (input[field] === undefined) continue;

      const isArray = Array.isArray(ticket[field]);
      const serialize = PHOTO_FIELDS.has(field)
        ? TicketService.serializePhotoField
        : isArray
          ? JSON.stringify
          : String;
      const oldValue = serialize(ticket[field]);
      const newValue = serialize(input[field]);

      if (oldValue !== newValue) {
        changes.push({ field, oldValue, newValue });
        (ticket[field] as Ticket[typeof field]) = input[
          field
        ] as Ticket[typeof field];
      }
    }

    return changes;
  }

  /** Serialize a photo array as a comma-separated list of labels for readable history. */
  private static serializePhotoField(value: unknown): string {
    if (!Array.isArray(value) || value.length === 0) return "(none)";
    return value
      .map((p: { label?: string; fileName?: string }) => p.label ?? p.fileName ?? "unknown")
      .join(", ");
  }
}
