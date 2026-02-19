import { z } from "zod";
import { TicketStatus, Priority } from "@shared/constants";

const ticketStatusValues = Object.values(TicketStatus) as [
  TicketStatus,
  ...TicketStatus[],
];
const priorityValues = Object.values(Priority) as [Priority, ...Priority[]];

const ticketStatusSchema = z.enum(ticketStatusValues);

const prioritySchema = z.enum(priorityValues);

/**
 * Mirrors the `PhotoOption` interface from `@shared/types`.
 * Keep in sync if that interface changes.
 */
const photoOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  fileName: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  imageUrl: z.string().min(1),
});

/**
 * Factory for optional query-string parameters.
 * Normalizes array values (Express quirk), trims whitespace,
 * and converts empty strings to `undefined` so Zod `.optional()` works.
 */
function optionalQueryParam<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (typeof normalized !== "string") return normalized;
    const trimmed = normalized.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, schema);
}

const optionalQueryText = optionalQueryParam(z.string().optional());
const optionalStatusQuery = optionalQueryParam(ticketStatusSchema.optional());
const optionalPriorityQuery = optionalQueryParam(prioritySchema.optional());

export const listTicketsQuerySchema = z.object({
  status: optionalStatusQuery,
  priority: optionalPriorityQuery,
  partner: optionalQueryText,
  sortBy: optionalQueryParam(
    z.enum(["createdAt", "priority", "partner", "status"]).optional(),
  ),
  sortOrder: optionalQueryParam(z.enum(["asc", "desc"]).optional()),
});

export const createTicketSchema = z.object({
  style: z.string().min(1),
  priority: prioritySchema,
  partner: z.string().min(1),
  instructions: z.array(z.string().min(1)).min(1),
  referencePhotos: z.array(photoOptionSchema).optional(),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(1),
});

export const photoUploadSchema = z.object({
  imageData: z.string().min(1),
  thumbnailData: z.string().min(1),
  fileName: z.string().min(1),
});

export const updateTicketSchema = z
  .object({
    style: z.string().min(1).optional(),
    priority: prioritySchema.optional(),
    partner: z.string().min(1).optional(),
    instructions: z.array(z.string().min(1)).min(1).optional(),
    referencePhotos: z.array(photoOptionSchema).min(1).optional(),
    partnerPhotos: z.array(photoOptionSchema).optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "At least one editable field is required",
  });
