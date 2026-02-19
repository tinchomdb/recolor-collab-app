import { Router } from "express";
import type express from "express";
import type { ZodTypeAny } from "zod";
import type { TicketService } from "../services/ticketService";
import { requireAuth, requireRoles, getRole, getActor } from "../auth";
import { Role, StoreErrorCode, TicketStatus } from "@shared/constants";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  rejectSchema,
  updateTicketSchema,
} from "../validation";
import {
  sendDomainError,
  sendInvalidPayloadError,
  sendInvalidQueryError,
} from "../errors";

export function ticketRoutes(ticketService: TicketService): Router {
  const router = Router();

  router.use(requireAuth);

  // ── List ────────────────────────────────────────────────────────────

  router.get("/", (req, res) => {
    const parsed = listTicketsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return sendInvalidQueryError(res);
    }

    const { sortBy, sortOrder, ...filters } = parsed.data;
    const role = getRole(res);
    const sort = { sortBy, sortOrder };

    const response =
      role?.type === Role.Partner
        ? ticketService.getTicketsForPartner(filters, sort, role)
        : ticketService.getTickets(filters, sort, role);

    res.json(response);
  });

  // ── Detail ──────────────────────────────────────────────────────────

  router.get("/:id", (req, res) => {
    const ticket = ticketService.findById(req.params.id, getRole(res));
    if (!ticket) {
      return sendDomainError(res, StoreErrorCode.NotFound);
    }

    return res.json(ticket);
  });

  // ── Create ──────────────────────────────────────────────────────────

  router.post("/", (req, res) => {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendInvalidPayloadError(res);
    }

    const actor = getActor(res);
    const ticket = ticketService.create(parsed.data, actor);
    return res.status(201).json(ticket);
  });

  // ── Update ──────────────────────────────────────────────────────────

  router.put("/:id", (req, res) => {
    const parsed = updateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendInvalidPayloadError(res);
    }

    const actor = getActor(res);
    const result = ticketService.updateTicket(
      req.params.id,
      parsed.data,
      actor,
    );
    if ("error" in result) return sendDomainError(res, result.error);

    return res.json(result.ticket);
  });

  // ── Workflow Transitions ────────────────────────────────────────────

  router.post(
    "/:id/send",
    requireRoles([Role.Manager, Role.Operator]),
    transitionHandler(TicketStatus.Sent),
  );
  router.post(
    "/:id/receipt",
    requireRoles([Role.Partner]),
    transitionHandler(TicketStatus.Received),
  );
  router.post(
    "/:id/start",
    requireRoles([Role.Partner]),
    transitionHandler(TicketStatus.InProgress),
  );
  router.post(
    "/:id/complete",
    requireRoles([Role.Partner]),
    transitionHandler(TicketStatus.Completed),
  );
  router.post(
    "/:id/approve",
    requireRoles([Role.Manager]),
    transitionHandler(TicketStatus.Approved),
  );
  router.post(
    "/:id/reject",
    requireRoles([Role.Manager]),
    transitionHandler(TicketStatus.Pending, rejectSchema),
  );

  // ── Helpers ─────────────────────────────────────────────────────────

  function transitionHandler(
    toStatus: TicketStatus,
    bodySchema?: ZodTypeAny,
  ): express.RequestHandler<{ id: string }> {
    return (req, res) => {
      let reason: string | undefined;
      if (bodySchema) {
        const parsed = bodySchema.safeParse(req.body);
        if (!parsed.success) return sendInvalidPayloadError(res);
        reason = (parsed.data as { reason?: string }).reason;
      }

      const actor = getActor(res);
      const result = ticketService.changeTicketStatus(
        req.params.id,
        toStatus,
        actor,
        reason,
      );
      if ("error" in result) return sendDomainError(res, result.error);
      return res.json(result.ticket);
    };
  }

  return router;
}
