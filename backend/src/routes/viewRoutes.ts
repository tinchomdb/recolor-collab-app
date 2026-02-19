import { Router } from "express";
import type { TicketService } from "../services/ticketService";
import type { DashboardService } from "../services/dashboardService";
import { requireAuth, requireRoles, getRole } from "../auth";
import { Role } from "@shared/constants";

export function viewRoutes(
  ticketService: TicketService,
  dashboardService: DashboardService,
): Router {
  const router = Router();

  // ── Public (no auth) ────────────────────────────────────────────────

  router.get("/api/meta/options", (_req, res) => {
    res.json(ticketService.getMetaOptions());
  });

  // ── Protected ───────────────────────────────────────────────────────

  router.use(requireAuth);

  router.get("/api/approved", (_req, res) => {
    const role = getRole(res);
    const response =
      role?.type === Role.Partner
        ? ticketService.getApprovedTicketsForPartner(role)
        : ticketService.getApprovedTickets();
    res.json(response);
  });

  router.get(
    "/api/partners/overview",
    requireRoles([Role.Manager, Role.Operator]),
    (_req, res) => {
      res.json(dashboardService.partnerOverviewResponse());
    },
  );

  router.get(
    "/api/dashboard/stats",
    requireRoles([Role.Manager]),
    (_req, res) => {
      res.json(dashboardService.getDashboardStats());
    },
  );

  return router;
}
