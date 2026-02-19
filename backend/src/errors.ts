import type express from "express";
import { StoreErrorCode } from "@shared/constants";

function sendApiError(res: express.Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export function sendDomainError(
  res: express.Response,
  code: string | undefined,
) {
  if (code === StoreErrorCode.NotFound) {
    return sendApiError(res, 404, "Ticket not found");
  }

  if (code === StoreErrorCode.InvalidTransition) {
    return sendApiError(res, 400, "Invalid ticket state transition");
  }

  return sendApiError(res, 400, "Invalid request");
}

export function sendInvalidPayloadError(res: express.Response) {
  return sendApiError(res, 400, "Invalid payload");
}

export function sendInvalidQueryError(res: express.Response) {
  return sendApiError(res, 400, "Invalid query parameters");
}

export function sendUnauthorizedError(res: express.Response) {
  return sendApiError(res, 401, "Missing or invalid Authorization header");
}

export function sendForbiddenError(res: express.Response) {
  return sendApiError(res, 403, "Insufficient permissions");
}

export function sendNotFoundError(
  res: express.Response,
  message = "Not found",
) {
  return sendApiError(res, 404, message);
}

export function sendConflictError(res: express.Response, message: string) {
  return sendApiError(res, 409, message);
}

export function sendBadRequestError(res: express.Response, message: string) {
  return sendApiError(res, 400, message);
}
