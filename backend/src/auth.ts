import type express from "express";
import type { RequestRole } from "./types";
import {
  AUTH_PARTNER_PREFIX,
  AUTH_ROLE_MANAGER,
  AUTH_ROLE_OPERATOR,
  Role,
} from "@shared/constants";
import { sendUnauthorizedError, sendForbiddenError } from "./errors";

export function getRole(res: express.Response): RequestRole {
  return res.locals.role as RequestRole;
}

export function getPartnerName(role: RequestRole): string | undefined {
  return role.type === Role.Partner ? role.partnerName : undefined;
}

export function parseRole(
  header: string | string[] | undefined,
): RequestRole | null {
  if (!header || Array.isArray(header)) return null;

  const value = header.trim();
  if (value === AUTH_ROLE_MANAGER) return { type: Role.Manager };
  if (value === AUTH_ROLE_OPERATOR) return { type: Role.Operator };

  if (value.startsWith(AUTH_PARTNER_PREFIX)) {
    const partnerName = value.slice(AUTH_PARTNER_PREFIX.length).trim();
    if (partnerName.length > 0) return { type: Role.Partner, partnerName };
  }

  return null;
}

export function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const role = parseRole(req.headers.authorization);
  if (!role) return sendUnauthorizedError(res);

  res.locals.role = role;
  next();
}

/** Middleware — restricts access to the specified roles. Must run after requireAuth. */
export function requireRoles(allowed: Role[]): express.RequestHandler {
  return (_req, res, next) => {
    const role = getRole(res);
    if (!allowed.includes(role.type)) return sendForbiddenError(res);
    next();
  };
}

/** Derive a display label for history events from the authenticated role. */
export function actorFromRole(role: RequestRole): string {
  if (role.type === Role.Partner) return role.partnerName;
  return role.type;
}

/** Shorthand: derive the actor label directly from the response locals. */
export function getActor(res: express.Response): string {
  return actorFromRole(getRole(res));
}
