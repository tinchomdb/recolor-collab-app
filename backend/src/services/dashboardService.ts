import type {
  BreakdownRow,
  DashboardStats,
  KpiCard,
  ListResponse,
  PartnerOverviewRow,
} from "@shared/types";
import { Priority, TicketStatus } from "@shared/constants";
import { PARTNER_OVERVIEW_COLUMNS } from "../constants";
import { TicketRepository } from "../repositories/ticketRepository";
import { PARTNER_OVERVIEW_META } from "./viewMetaBuilder";

// ── Service ───────────────────────────────────────────────────────────────

export class DashboardService {
  constructor(private readonly repo: TicketRepository) {}

  getDashboardStats(): DashboardStats {
    const allTickets = this.repo.getTickets();

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalApproved = 0;
    let urgentOpen = 0;

    for (const ticket of allTickets) {
      if (ticket.status === TicketStatus.Approved) {
        totalApproved += 1;
      } else {
        byStatus[ticket.status] = (byStatus[ticket.status] ?? 0) + 1;
        byPriority[ticket.priority] = (byPriority[ticket.priority] ?? 0) + 1;
        if (
          ticket.priority === Priority.Urgent &&
          ticket.status !== TicketStatus.Completed
        ) {
          urgentOpen += 1;
        }
      }
    }

    const overview = this.computePartnerOverview();
    const totalActive = Object.values(byStatus).reduce((s, n) => s + n, 0);

    const awaitingReceipt = byStatus[TicketStatus.Sent] ?? 0;
    const awaitingApproval = byStatus[TicketStatus.Completed] ?? 0;

    const topPartner =
      overview.length > 0
        ? [...overview].sort((a, b) => b.total - a.total)[0]
        : null;

    const kpiCards: KpiCard[] = [
      { label: "Active Tickets", value: totalActive, tone: "accent" },
      { label: "Pending", value: byStatus[TicketStatus.Pending] ?? 0 },
      {
        label: "In Progress",
        value: byStatus[TicketStatus.InProgress] ?? 0,
        tone: "accent",
      },
      { label: "Awaiting Receipt", value: awaitingReceipt, tone: "warning" },
      { label: "Awaiting Approval", value: awaitingApproval, tone: "warning" },
      { label: "Approved Total", value: totalApproved, tone: "success" },
      { label: "Urgent Open", value: urgentOpen, tone: "error" },
      {
        label: "Top Partner",
        value: topPartner ? `${topPartner.partner} (${topPartner.total})` : "—",
      },
    ];

    const statusBreakdown: BreakdownRow[] = Object.entries(byStatus)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => ({
        label: status,
        count,
        pct: totalActive ? Math.round((count / totalActive) * 100) : 0,
      }));

    const priorityOrder = [
      Priority.Urgent,
      Priority.High,
      Priority.Medium,
      Priority.Low,
    ];
    const priorityBreakdown: BreakdownRow[] = priorityOrder
      .filter((p) => (byPriority[p] ?? 0) > 0)
      .map((priority) => ({
        label: priority,
        count: byPriority[priority] ?? 0,
        pct: totalActive
          ? Math.round(((byPriority[priority] ?? 0) / totalActive) * 100)
          : 0,
      }));

    return {
      kpiCards,
      statusBreakdown,
      priorityBreakdown,
      partnerOverview: overview,
      partnerOverviewColumns: PARTNER_OVERVIEW_COLUMNS,
    };
  }

  partnerOverviewResponse(): ListResponse<PartnerOverviewRow> {
    return { data: this.computePartnerOverview(), meta: PARTNER_OVERVIEW_META };
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private computePartnerOverview(): PartnerOverviewRow[] {
    const map = new Map<string, PartnerOverviewRow>();
    for (const ticket of this.repo.getTickets()) {
      const row = map.get(ticket.partner) ?? {
        partner: ticket.partner,
        total: 0,
        awaitingReceipt: 0,
        inProgress: 0,
        completed: 0,
      };
      row.total += 1;
      if (ticket.status === TicketStatus.Sent) row.awaitingReceipt += 1;
      if (ticket.status === TicketStatus.InProgress) row.inProgress += 1;
      if (ticket.status === TicketStatus.Completed) row.completed += 1;
      map.set(ticket.partner, row);
    }
    return Array.from(map.values());
  }
}
