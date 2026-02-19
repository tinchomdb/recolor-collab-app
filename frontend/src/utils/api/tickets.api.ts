import type {
  Ticket,
  CreateTicketInput,
  DashboardStats,
  ListResponse,
  MetaOptions,
  PartnerOverviewRow,
  PhotoOption,
  TicketFilters,
  TicketSort,
  UpdateTicketFields,
} from "@shared/types";
import { apiRequest } from "./http";
import { fileToBase64, generateThumbnail } from "../imageUtils";

// ── Ticket CRUD ───────────────────────────────────────────────────────────

export async function getTickets(
  filters: TicketFilters = {},
  sort: TicketSort = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.partner) params.set("partner", filters.partner);
  if (sort.sortBy) params.set("sortBy", sort.sortBy);
  if (sort.sortOrder) params.set("sortOrder", sort.sortOrder);

  const queryString = params.toString();
  const query = queryString ? `?${queryString}` : "";
  return apiRequest<ListResponse<Ticket>>(`/api/tickets${query}`);
}

export async function getApprovedTickets() {
  return apiRequest<ListResponse<Ticket>>("/api/approved");
}

export async function getPartnersOverview() {
  return apiRequest<ListResponse<PartnerOverviewRow>>("/api/partners/overview");
}

export async function getDashboardStats() {
  return apiRequest<DashboardStats>("/api/dashboard/stats");
}

export async function getMetaOptions() {
  return apiRequest<MetaOptions>("/api/meta/options");
}

export async function createTicket(payload: CreateTicketInput) {
  return apiRequest<Ticket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTicket(id: string, payload: UpdateTicketFields) {
  return apiRequest<Ticket>(`/api/tickets/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function ticketAction(
  id: string,
  action: string,
  body?: Record<string, unknown>,
) {
  return apiRequest<Ticket>(`/api/tickets/${id}/${action}`, {
    method: "POST",
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

export const sendTicket = (id: string) => ticketAction(id, "send");
export const receiveTicket = (id: string) => ticketAction(id, "receipt");
export const startTicket = (id: string) => ticketAction(id, "start");
export const completeTicket = (id: string) => ticketAction(id, "complete");
export const approveTicket = (id: string) => ticketAction(id, "approve");
export const rejectTicket = (id: string, reason: string) =>
  ticketAction(id, "reject", { reason: reason.trim() });

// ── Partner Photo Endpoints ───────────────────────────────────────────────

export async function uploadPartnerPhoto(
  ticketId: string,
  file: File,
): Promise<PhotoOption> {
  const [imageData, thumbnailData] = await Promise.all([
    fileToBase64(file),
    generateThumbnail(file),
  ]);

  return apiRequest<PhotoOption>(`/api/tickets/${ticketId}/photos`, {
    method: "POST",
    body: JSON.stringify({ imageData, thumbnailData, fileName: file.name }),
  });
}

export async function deletePartnerPhoto(
  ticketId: string,
  photoId: string,
): Promise<void> {
  await apiRequest<void>(`/api/tickets/${ticketId}/photos/${photoId}`, {
    method: "DELETE",
  });
}
