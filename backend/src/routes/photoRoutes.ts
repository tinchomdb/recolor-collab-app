import { Router } from "express";
import type { TicketService } from "../services/ticketService";
import type { PhotoService } from "../services/photoService";
import type { Ticket } from "@shared/types";
import { requireAuth, requireRoles, getActor } from "../auth";
import { Role } from "@shared/constants";
import { photoUploadSchema } from "../validation";
import {
  sendInvalidPayloadError,
  sendNotFoundError,
  sendBadRequestError,
} from "../errors";
import { requireTicketAccess } from "../middleware/requireTicketAccess";

export function photoRoutes(
  ticketService: TicketService,
  photoService: PhotoService,
): Router {
  const router = Router();

  router.use(requireAuth);

  // ── Upload a partner photo ────────────────────────────────────────────

  router.post(
    "/:id/photos",
    requireRoles([Role.Partner]),
    requireTicketAccess(ticketService),
    (req, res) => {
      const ticket = res.locals.ticket as Ticket;

      const parsed = photoUploadSchema.safeParse(req.body);
      if (!parsed.success) return sendInvalidPayloadError(res);

      const { imageData, thumbnailData, fileName } = parsed.data;

      let photo;
      try {
        photo = photoService.upload(
          ticket.id,
          imageData,
          thumbnailData,
          fileName,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        return sendBadRequestError(res, message);
      }

      const actor = getActor(res);
      ticketService.updateTicket(
        ticket.id,
        {
          partnerPhotos: [...ticket.partnerPhotos, photo],
        },
        actor,
      );

      return res.status(201).json(photo);
    },
  );

  // ── Delete a partner photo ────────────────────────────────────────────

  router.delete(
    "/:id/photos/:photoId",
    requireRoles([Role.Partner]),
    requireTicketAccess(ticketService),
    (req, res) => {
      const ticket = res.locals.ticket as Ticket;

      const { photoId } = req.params;
      const photo = ticket.partnerPhotos.find((p) => p.id === photoId);
      if (!photo) {
        return sendNotFoundError(res, "Photo not found on this ticket");
      }

      photoService.deleteFiles(ticket.id, photo.fileName);

      const actor = getActor(res);
      ticketService.updateTicket(
        ticket.id,
        {
          partnerPhotos: ticket.partnerPhotos.filter((p) => p.id !== photoId),
        },
        actor,
      );

      return res.status(204).send();
    },
  );

  return router;
}
