import { ref } from "vue";
import type {
  Ticket,
  MetaOptions,
  PartnerOverviewRow,
  TicketFilters,
  TicketSort,
  ViewMeta,
  DashboardStats,
  CreateTicketInput,
  UpdateTicketFields,
} from "@shared/types";
import { Role } from "@shared/constants";
import {
  approveTicket,
  completeTicket,
  createTicket,
  getApprovedTickets,
  getDashboardStats,
  getMetaOptions,
  getPartnersOverview,
  getTickets,
  receiveTicket,
  rejectTicket,
  sendTicket,
  startTicket,
  updateTicket,
  uploadPartnerPhoto,
  deletePartnerPhoto,
} from "../utils/api/tickets.api";
import { normalizeError } from "../utils/errors";
import { useAuth } from "../composables/useAuth";

const tickets = ref<Ticket[]>([]);
const approvedTickets = ref<Ticket[]>([]);
const partnerOverview = ref<PartnerOverviewRow[]>([]);
const metadata = ref<MetaOptions | null>(null);
const loading = ref(false);
const error = ref("");

/** View metadata returned alongside the last tickets query. */
const ticketsViewMeta = ref<ViewMeta | null>(null);
const approvedViewMeta = ref<ViewMeta | null>(null);
const partnerOverviewViewMeta = ref<ViewMeta | null>(null);
const dashboardStats = ref<DashboardStats | null>(null);

export function useTicketsStore() {
  // ─── Public API ──────────────────────────────────────

  async function loadAll() {
    loading.value = true;
    await safe(
      () => Promise.all([refreshData(), fetchMetadata()]),
      "Failed to load data",
    );
    loading.value = false;
  }

  async function loadQueue(filters: TicketFilters = {}, sort: TicketSort = {}) {
    await safe(() => fetchQueue(filters, sort), "Failed to load tickets");
  }

  async function create(payload: CreateTicketInput) {
    await safe(async () => {
      await createTicket(payload);
      await refreshData();
    }, "Failed to create ticket");
  }

  async function send(id: string) {
    await safe(async () => {
      await sendTicket(id);
      await refreshData();
    }, "Send failed");
  }

  async function receive(id: string) {
    await safe(async () => {
      await receiveTicket(id);
      await refreshData();
    }, "Receive failed");
  }

  async function start(id: string) {
    await safe(async () => {
      await startTicket(id);
      await refreshData();
    }, "Start failed");
  }

  async function complete(id: string) {
    await safe(async () => {
      await completeTicket(id);
      await refreshData();
    }, "Complete failed");
  }

  async function approve(id: string) {
    await safe(async () => {
      await approveTicket(id);
      await refreshData();
    }, "Approve failed");
  }

  async function reject(id: string, reason?: string) {
    if (!reason) {
      setError("Rejection reason is required");
      return;
    }
    await safe(async () => {
      await rejectTicket(id, reason);
      await refreshData();
    }, "Reject failed");
  }

  async function update(id: string, payload: UpdateTicketFields) {
    await safe(async () => {
      await updateTicket(id, payload);
      await refreshData();
    }, "Update failed");
  }

  async function uploadPhoto(ticketId: string, file: File) {
    await safe(async () => {
      await uploadPartnerPhoto(ticketId, file);
      await refreshData();
    }, "Photo upload failed");
  }

  async function removePhoto(ticketId: string, photoId: string) {
    await safe(async () => {
      await deletePartnerPhoto(ticketId, photoId);
      await refreshData();
    }, "Photo removal failed");
  }

  // ─── Private helpers ─────────────────────────────────

  async function safe(action: () => Promise<unknown>, fallbackError: string) {
    try {
      clearError();
      await action();
    } catch (err) {
      setError(normalizeError(err, fallbackError));
    }
  }

  async function fetchQueue(
    filters: TicketFilters = {},
    sort: TicketSort = {},
  ) {
    const response = await getTickets(filters, sort);
    tickets.value = response.data;
    ticketsViewMeta.value = response.meta;
  }

  async function fetchApproved() {
    const response = await getApprovedTickets();
    approvedTickets.value = response.data;
    approvedViewMeta.value = response.meta;
  }

  async function fetchPartnerOverview() {
    const response = await getPartnersOverview();
    partnerOverview.value = response.data;
    partnerOverviewViewMeta.value = response.meta;
  }

  async function fetchMetadata() {
    metadata.value = await getMetaOptions();
  }

  async function fetchDashboardStats() {
    dashboardStats.value = await getDashboardStats();
  }

  async function refreshData() {
    const { role } = useAuth();
    const currentRole = role.value;

    const tasks: Promise<void>[] = [fetchQueue(), fetchApproved()];

    if (currentRole === Role.Manager || currentRole === Role.Operator) {
      tasks.push(fetchPartnerOverview());
    }

    if (currentRole === Role.Manager) {
      tasks.push(fetchDashboardStats());
    }

    await Promise.all(tasks);
  }

  function setError(message: string) {
    error.value = message;
  }

  function clearError() {
    error.value = "";
  }

  return {
    tickets,
    approvedTickets,
    partnerOverview,
    metadata,
    loading,
    error,
    ticketsViewMeta,
    approvedViewMeta,
    partnerOverviewViewMeta,
    dashboardStats,
    setError,
    loadAll,
    loadQueue,
    create,
    send,
    receive,
    start,
    complete,
    approve,
    reject,
    update,
    uploadPhoto,
    removePhoto,
  };
}
