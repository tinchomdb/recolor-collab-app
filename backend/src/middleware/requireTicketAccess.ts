import type { RequestHandler } from "express";
import type { TicketService } from "../services/ticketService";
import { getRole } from "../auth";
import { StoreErrorCode, TicketStatus } from "@shared/constants";
import { sendConflictError, sendDomainError } from "../errors";

/**
 * Validates that the authenticated Partner may manage photos on the requested
 * ticket: the ticket must exist (scoped to the partner) and be InProgress.
 * Stores the resolved ticket in `res.locals.ticket`.
 *
 * Must be chained after `requireAuth` and `requireRoles([Role.Partner])`.
 */
export function requireTicketAccess(
  ticketService: TicketService,
): RequestHandler<Record<string, string>> {
  return (req, res, next) => {
    const role = getRole(res);
    const ticket = ticketService.findById(req.params.id, role);

    if (!ticket) {
      return sendDomainError(res, StoreErrorCode.NotFound);
    }

    if (ticket.status !== TicketStatus.InProgress) {
      return sendConflictError(
        res,
        "Photos can only be managed when ticket is In Progress",
      );
    }

    res.locals.ticket = ticket;
    next();
  };
}
