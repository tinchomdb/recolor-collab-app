/**
 * In-memory ticket repository.
 *
 * This class owns the raw data store (a `Ticket[]` array) and exposes
 * CRUD operations. In production this would be backed by a
 * database client.
 */

import type { Ticket, TicketSort } from "@shared/types";
import type { RepoTicketFilters } from "../types";
import {
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  SORT_COMPARATORS,
} from "../constants";

export class TicketRepository {
  private tickets: Ticket[] = [];
  private nextId = 1;

  // ── Queries ───────────────────────────────────────────────────────────

  getTickets(filters?: RepoTicketFilters, sort?: TicketSort): Ticket[] {
    let result = this.tickets.filter((t) => {
      if (filters?.partnerScope && t.partner !== filters.partnerScope)
        return false;
      if (filters?.status && t.status !== filters.status) return false;
      if (filters?.priority && t.priority !== filters.priority) return false;
      if (filters?.partner && t.partner !== filters.partner) return false;
      if (filters?.statusIn && !filters.statusIn.includes(t.status))
        return false;
      return true;
    });

    const sortBy = sort?.sortBy ?? DEFAULT_SORT_BY;
    const sortOrder = sort?.sortOrder ?? DEFAULT_SORT_ORDER;
    const comparator = SORT_COMPARATORS[sortBy] ?? SORT_COMPARATORS.partner;
    const multiplier = sortOrder === "asc" ? 1 : -1;
    return [...result].sort((a, b) => comparator(a, b) * multiplier);
  }

  /** Returns tickets scoped to a single partner, with additional filters/sort. */
  getTicketsForPartner(
    partnerName: string,
    filters?: RepoTicketFilters,
    sort?: TicketSort,
  ): Ticket[] {
    return this.getTickets({ ...filters, partnerScope: partnerName }, sort);
  }

  getTicketById(id: string): Ticket | undefined {
    return this.tickets.find((ticket) => ticket.id === id);
  }

  /** Returns a sorted, deduplicated list of all partner names across all tickets. */
  getDistinctPartners(): string[] {
    return [...new Set(this.tickets.map((t) => t.partner))].sort();
  }

  // ── Mutations ─────────────────────────────────────────────────────────

  addTicket(ticket: Ticket): void {
    this.tickets.push(ticket);
  }

  // ── ID Generation ─────────────────────────────────────────────────────

  generateId(): string {
    const id = String(this.nextId);
    this.nextId += 1;
    return id;
  }
}
