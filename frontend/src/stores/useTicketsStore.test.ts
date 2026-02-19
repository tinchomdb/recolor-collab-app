import { describe, expect, it, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { Role, Priority } from "@shared/constants";
import { useTicketsStore } from "./useTicketsStore";

const emptyMeta = { columns: [], filters: [], sortOptions: [] };

const mockRole = ref<string | null>(Role.Manager);

vi.mock("../composables/useAuth", () => ({
  useAuth: () => ({ role: mockRole }),
}));

const apiMocks = vi.hoisted(() => ({
  getTickets: vi.fn(),
  getApprovedTickets: vi.fn(),
  getPartnersOverview: vi.fn(),
  getMetaOptions: vi.fn(),
  getDashboardStats: vi.fn(),
  createTicket: vi.fn(),
  sendTicket: vi.fn(),
  receiveTicket: vi.fn(),
  startTicket: vi.fn(),
  completeTicket: vi.fn(),
  approveTicket: vi.fn(),
  rejectTicket: vi.fn(),
  updateTicket: vi.fn(),
  uploadPartnerPhoto: vi.fn(),
  deletePartnerPhoto: vi.fn(),
}));

vi.mock("../utils/api/tickets.api", () => ({
  getTickets: apiMocks.getTickets,
  getApprovedTickets: apiMocks.getApprovedTickets,
  getPartnersOverview: apiMocks.getPartnersOverview,
  getMetaOptions: apiMocks.getMetaOptions,
  getDashboardStats: apiMocks.getDashboardStats,
  createTicket: apiMocks.createTicket,
  sendTicket: apiMocks.sendTicket,
  receiveTicket: apiMocks.receiveTicket,
  startTicket: apiMocks.startTicket,
  completeTicket: apiMocks.completeTicket,
  approveTicket: apiMocks.approveTicket,
  rejectTicket: apiMocks.rejectTicket,
  updateTicket: apiMocks.updateTicket,
  uploadPartnerPhoto: apiMocks.uploadPartnerPhoto,
  deletePartnerPhoto: apiMocks.deletePartnerPhoto,
}));

describe("useTicketsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole.value = Role.Manager;

    apiMocks.getTickets.mockResolvedValue({ data: [], meta: emptyMeta });
    apiMocks.getApprovedTickets.mockResolvedValue({
      data: [],
      meta: emptyMeta,
    });
    apiMocks.getPartnersOverview.mockResolvedValue({
      data: [],
      meta: emptyMeta,
    });
    apiMocks.getMetaOptions.mockResolvedValue({
      partners: [],
      styleOptions: [],
      photoOptions: [],
      priorities: [],
    });
    apiMocks.getDashboardStats.mockResolvedValue({
      kpiCards: [],
      statusBreakdown: [],
      priorityBreakdown: [],
      partnerOverview: [],
      partnerOverviewColumns: [],
    });
  });

  it("loads all store resources successfully (manager)", async () => {
    const store = useTicketsStore();

    await store.loadAll();

    expect(apiMocks.getTickets).toHaveBeenCalledTimes(1);
    expect(apiMocks.getApprovedTickets).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPartnersOverview).toHaveBeenCalledTimes(1);
    expect(apiMocks.getMetaOptions).toHaveBeenCalledTimes(1);
    expect(apiMocks.getDashboardStats).toHaveBeenCalledTimes(1);
    expect(store.loading.value).toBe(false);
    expect(store.error.value).toBe("");
  });

  it("skips dashboard stats for operator role", async () => {
    mockRole.value = Role.Operator;
    const store = useTicketsStore();

    await store.loadAll();

    expect(apiMocks.getTickets).toHaveBeenCalledTimes(1);
    expect(apiMocks.getApprovedTickets).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPartnersOverview).toHaveBeenCalledTimes(1);
    expect(apiMocks.getDashboardStats).not.toHaveBeenCalled();
  });

  it("skips partner overview and dashboard stats for partner role", async () => {
    mockRole.value = Role.Partner;
    const store = useTicketsStore();

    await store.loadAll();

    expect(apiMocks.getTickets).toHaveBeenCalledTimes(1);
    expect(apiMocks.getApprovedTickets).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPartnersOverview).not.toHaveBeenCalled();
    expect(apiMocks.getDashboardStats).not.toHaveBeenCalled();
  });

  it("sets error when loadAll fails", async () => {
    apiMocks.getTickets.mockRejectedValueOnce(new Error("Queue down"));
    const store = useTicketsStore();

    await store.loadAll();

    expect(store.loading.value).toBe(false);
    expect(store.error.value).toBe("Queue down");
  });

  it("passes query params to loadQueue and stores view meta", async () => {
    const meta = {
      columns: [],
      filters: [],
      sortOptions: [{ value: "createdAt", label: "Date" }],
    };
    apiMocks.getTickets.mockResolvedValue({ data: [{ id: "1" }], meta });
    const store = useTicketsStore();

    await store.loadQueue({ status: "Sent" }, { sortBy: "priority" });

    expect(apiMocks.getTickets).toHaveBeenCalledWith(
      { status: "Sent" },
      { sortBy: "priority" },
    );
    expect(store.tickets.value).toEqual([{ id: "1" }]);
    expect(store.ticketsViewMeta.value).toEqual(meta);
  });

  it("sets error when loadQueue fails", async () => {
    apiMocks.getTickets.mockRejectedValueOnce(new Error("Queue down"));
    const store = useTicketsStore();

    await store.loadQueue({ status: "Sent" });

    expect(store.error.value).toBe("Queue down");
  });

  describe("actions", () => {
    it("calls sendTicket and refreshes role-appropriate data on success", async () => {
      apiMocks.sendTicket.mockResolvedValue({});
      const store = useTicketsStore();

      await store.send("t1");

      expect(apiMocks.sendTicket).toHaveBeenCalledWith("t1");
      expect(apiMocks.getTickets).toHaveBeenCalledTimes(1);
      expect(apiMocks.getApprovedTickets).toHaveBeenCalledTimes(1);
      expect(apiMocks.getPartnersOverview).toHaveBeenCalledTimes(1);
      expect(apiMocks.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(store.error.value).toBe("");
    });

    it("sets error when an action fails", async () => {
      apiMocks.sendTicket.mockRejectedValue(new Error("Network error"));
      const store = useTicketsStore();

      await store.send("t1");

      expect(store.error.value).toBe("Network error");
    });

    it("sets fallback error for non-Error rejections", async () => {
      apiMocks.approveTicket.mockRejectedValue("unknown");
      const store = useTicketsStore();

      await store.approve("t1");

      expect(store.error.value).toBe("Approve failed");
    });

    it("calls each workflow action with the ticket id", async () => {
      apiMocks.receiveTicket.mockResolvedValue({});
      apiMocks.startTicket.mockResolvedValue({});
      apiMocks.completeTicket.mockResolvedValue({});
      apiMocks.approveTicket.mockResolvedValue({});

      const store = useTicketsStore();

      await store.receive("t1");
      expect(apiMocks.receiveTicket).toHaveBeenCalledWith("t1");

      await store.start("t2");
      expect(apiMocks.startTicket).toHaveBeenCalledWith("t2");

      await store.complete("t3");
      expect(apiMocks.completeTicket).toHaveBeenCalledWith("t3");

      await store.approve("t4");
      expect(apiMocks.approveTicket).toHaveBeenCalledWith("t4");
    });

    it("calls rejectTicket with id and reason", async () => {
      apiMocks.rejectTicket.mockResolvedValue({});
      const store = useTicketsStore();

      await store.reject("t1", "Bad quality");

      expect(apiMocks.rejectTicket).toHaveBeenCalledWith("t1", "Bad quality");
    });

    it("calls createTicket with payload", async () => {
      apiMocks.createTicket.mockResolvedValue({});
      const store = useTicketsStore();

      const payload = {
        style: "Night Sky",
        priority: Priority.High,
        partner: "Alpha",
        instructions: ["Do this"],
        referencePhotos: [
          {
            id: "photo1",
            label: "Photo 1",
            fileName: "photo1.jpg",
            thumbnailUrl: "/thumbs/photo1.jpg",
            imageUrl: "/images/photo1.jpg",
          },
        ],
      };

      await store.create(payload);

      expect(apiMocks.createTicket).toHaveBeenCalledWith(payload);
    });

    it("calls updateTicket with id and payload", async () => {
      apiMocks.updateTicket.mockResolvedValue({});
      const store = useTicketsStore();

      await store.update("t1", { style: "Hedge Green" });

      expect(apiMocks.updateTicket).toHaveBeenCalledWith("t1", {
        style: "Hedge Green",
      });
    });

    it("clears previous error before running an action", async () => {
      apiMocks.sendTicket.mockRejectedValueOnce(new Error("First fail"));
      const store = useTicketsStore();

      await store.send("t1");
      expect(store.error.value).toBe("First fail");

      apiMocks.sendTicket.mockResolvedValue({});
      await store.send("t1");
      expect(store.error.value).toBe("");
    });

    it("calls uploadPartnerPhoto with ticket id and file", async () => {
      apiMocks.uploadPartnerPhoto.mockResolvedValue({});
      const store = useTicketsStore();

      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
      await store.uploadPhoto("t1", file);

      expect(apiMocks.uploadPartnerPhoto).toHaveBeenCalledWith("t1", file);
      expect(store.error.value).toBe("");
    });

    it("calls deletePartnerPhoto with ticket id and photo id", async () => {
      apiMocks.deletePartnerPhoto.mockResolvedValue({});
      const store = useTicketsStore();

      await store.removePhoto("t1", "photo-1");

      expect(apiMocks.deletePartnerPhoto).toHaveBeenCalledWith("t1", "photo-1");
      expect(store.error.value).toBe("");
    });

    it("sets error when uploadPhoto fails", async () => {
      apiMocks.uploadPartnerPhoto.mockRejectedValue(new Error("Upload failed"));
      const store = useTicketsStore();

      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
      await store.uploadPhoto("t1", file);

      expect(store.error.value).toBe("Upload failed");
    });

    it("sets error without calling API when reject has no reason", async () => {
      const store = useTicketsStore();

      await store.reject("t1", "");

      expect(apiMocks.rejectTicket).not.toHaveBeenCalled();
      expect(store.error.value).toBe("Rejection reason is required");
    });

    it("sets error without calling API when reject reason is undefined", async () => {
      const store = useTicketsStore();

      await store.reject("t1");

      expect(apiMocks.rejectTicket).not.toHaveBeenCalled();
      expect(store.error.value).toBe("Rejection reason is required");
    });
  });
});
