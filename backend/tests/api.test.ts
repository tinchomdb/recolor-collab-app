import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { PhotoOption } from "@shared/types";

const AUTH_MANAGER = "manager";
const AUTH_PARTNER_BETA = "partner:Studio Beta";
const AUTH_PARTNER_GAMMA = "partner:Studio Gamma";
const AUTH_PARTNER_DELTA = "partner:Studio Delta";

/** Build minimal PhotoOption objects for test payloads. */
function testPhotos(...ids: string[]): PhotoOption[] {
  return ids.map((id) => ({
    id,
    label: id,
    fileName: `${id}.jpg`,
    thumbnailUrl: `/api/assets/thumbnails/${id}.jpg`,
    imageUrl: `/api/assets/images/${id}.jpg`,
  }));
}

function authGet(
  app: ReturnType<typeof createApp>,
  url: string,
  token = AUTH_MANAGER,
) {
  return request(app).get(url).set("Authorization", token);
}

function authPost(
  app: ReturnType<typeof createApp>,
  url: string,
  token = AUTH_MANAGER,
) {
  return request(app).post(url).set("Authorization", token);
}

function authPut(
  app: ReturnType<typeof createApp>,
  url: string,
  token = AUTH_MANAGER,
) {
  return request(app).put(url).set("Authorization", token);
}

describe("Recolour API", () => {
  it("returns metadata options (no auth required)", async () => {
    const app = createApp();
    const res = await request(app).get("/api/meta/options");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.partners)).toBe(true);
    expect(Array.isArray(res.body.priorities)).toBe(true);
    expect(Array.isArray(res.body.styleOptions)).toBe(true);
    expect(Array.isArray(res.body.photoOptions)).toBe(true);
    expect(res.body.photoOptions[0]).toHaveProperty("thumbnailUrl");
    expect(res.body.photoOptions[0]).toHaveProperty("imageUrl");
    expect(res.body.photoOptions[0].thumbnailUrl).toMatch(
      /^\/api\/assets\/thumbnails\/.+\.jpg$/,
    );
    expect(res.body.photoOptions[0].imageUrl).toMatch(
      /^\/api\/assets\/images\/.+\.jpg$/,
    );
  });

  it("rejects requests without Authorization header", async () => {
    const app = createApp();
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
  });

  it("returns seeded tickets in envelope format", async () => {
    const app = createApp();
    const res = await authGet(app, "/api/tickets");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.meta.filters)).toBe(true);
    expect(Array.isArray(res.body.meta.sortOptions)).toBe(true);
    expect(Array.isArray(res.body.meta.columns)).toBe(true);
    expect(res.body.meta.defaultSort).toBe("createdAt:desc");
  });

  it("includes availableActions on each ticket", async () => {
    const app = createApp();
    const res = await authGet(app, "/api/tickets");

    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      expect(Array.isArray(ticket.availableActions)).toBe(true);
    }
  });

  it("sorts tickets by sortBy and sortOrder query params", async () => {
    const app = createApp();
    // Use priority which has distinct values across seeds
    const asc = await authGet(app, "/api/tickets").query({
      sortBy: "priority",
      sortOrder: "asc",
    });
    const desc = await authGet(app, "/api/tickets").query({
      sortBy: "priority",
      sortOrder: "desc",
    });

    expect(asc.status).toBe(200);
    expect(desc.status).toBe(200);

    const ascIds = asc.body.data.map((t: { id: string }) => t.id);
    const descIds = desc.body.data.map((t: { id: string }) => t.id);
    expect(ascIds).toEqual([...descIds].reverse());
  });

  it("creates ticket with required fields", async () => {
    const app = createApp();
    const res = await authPost(app, "/api/tickets").send({
      style: "15370000",
      priority: "High",
      partner: "Studio Alpha",
      instructions: ["Keep clipping path", "Night Sky solid"],
      referencePhotos: testPhotos(
        "15370000_001",
        "15370000_002",
        "15370000_007",
      ),
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Pending");
  });

  it("rejects invalid create payload", async () => {
    const app = createApp();
    const res = await authPost(app, "/api/tickets").send({
      style: "15370000",
      priority: "High",
      partner: "Studio Alpha",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid payload");
  });

  it("returns ticket by id and 404 for unknown id", async () => {
    const app = createApp();
    const created = await authPost(app, "/api/tickets").send({
      style: "15370100",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Initial instruction"],
      referencePhotos: testPhotos("15370100_001"),
    });

    const existing = await authGet(app, `/api/tickets/${created.body.id}`);
    expect(existing.status).toBe(200);
    expect(existing.body.id).toBe(created.body.id);
    expect(Array.isArray(existing.body.availableActions)).toBe(true);

    const missing = await authGet(app, "/api/tickets/999999");
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe("Ticket not found");
  });

  it("supports status lifecycle and approval path", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370001",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Hedge Green solid"],
      referencePhotos: testPhotos(
        "15370001_001",
        "15370001_002",
        "15370001_007",
      ),
    });

    const id = created.body.id;

    expect((await authPost(app, `/api/tickets/${id}/send`)).status).toBe(200);
    expect(
      (await authPost(app, `/api/tickets/${id}/receipt`, AUTH_PARTNER_BETA))
        .status,
    ).toBe(200);
    expect(
      (await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_BETA))
        .status,
    ).toBe(200);
    expect(
      (await authPost(app, `/api/tickets/${id}/complete`, AUTH_PARTNER_BETA))
        .status,
    ).toBe(200);

    const approve = await authPost(app, `/api/tickets/${id}/approve`);
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("Approved");

    const approved = await authGet(app, "/api/approved");
    expect(approved.status).toBe(200);
    expect(
      approved.body.data.some((ticket: { id: string }) => ticket.id === id),
    ).toBe(true);

    const queue = await authGet(app, "/api/tickets");
    expect(
      queue.body.data.some((ticket: { id: string }) => ticket.id === id),
    ).toBe(false);
  });

  it("supports reject to queue with history", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370002",
      priority: "Urgent",
      partner: "Studio Gamma",
      instructions: ["Night Sky with dots"],
      referencePhotos: testPhotos(
        "15370002_001",
        "15370002_002",
        "15370002_007",
      ),
    });
    const id = created.body.id;

    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_GAMMA);
    await authPost(app, `/api/tickets/${id}/complete`, AUTH_PARTNER_GAMMA);

    const reject = await authPost(app, `/api/tickets/${id}/reject`).send({
      actor: "manager",
      reason: "Dots pattern mismatch",
    });

    expect(reject.status).toBe(200);
    expect(reject.body.status).toBe("Pending");

    const historyTypes = reject.body.history.map(
      (entry: { type: string }) => entry.type,
    );
    expect(historyTypes).toContain("StatusChanged");
  });

  it("requires reject reason", async () => {
    const app = createApp();
    const created = await authPost(app, "/api/tickets").send({
      style: "15370003",
      priority: "Low",
      partner: "Studio Delta",
      instructions: ["Navy Blazer solid"],
      referencePhotos: testPhotos(
        "15370003_001",
        "15370003_002",
        "15370003_007",
      ),
    });
    const id = created.body.id;

    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_DELTA);
    await authPost(app, `/api/tickets/${id}/complete`, AUTH_PARTNER_DELTA);

    const reject = await authPost(app, `/api/tickets/${id}/reject`).send({
      actor: "manager",
      reason: "",
    });

    expect(reject.status).toBe(400);
    expect(reject.body.error).toBe("Invalid payload");
  });

  it("filters by status, priority, partner and search query", async () => {
    const app = createApp();
    const res = await authGet(app, "/api/tickets").query({
      status: "Pending",
      priority: "High",
      partner: "Studio Alpha",
      q: "15370000",
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("rejects invalid query filters", async () => {
    const app = createApp();
    const res = await authGet(app, "/api/tickets").query({
      status: "Unknown",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query parameters");
  });

  it("returns partner overview in envelope format", async () => {
    const app = createApp();
    const res = await authGet(app, "/api/partners/overview");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.meta.columns)).toBe(true);
  });

  it("returns dashboard stats", async () => {
    const app = createApp();
    const res = await authGet(app, "/api/dashboard/stats");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.kpiCards)).toBe(true);
    expect(Array.isArray(res.body.statusBreakdown)).toBe(true);
    expect(Array.isArray(res.body.priorityBreakdown)).toBe(true);
    expect(Array.isArray(res.body.partnerOverview)).toBe(true);
    expect(Array.isArray(res.body.partnerOverviewColumns)).toBe(true);
  });

  it("updates a ticket and appends edited history", async () => {
    const app = createApp();
    const created = await authPost(app, "/api/tickets").send({
      style: "Night Sky - AOP White Dots",
      priority: "Medium",
      partner: "Studio Alpha",
      instructions: ["Initial instruction"],
      referencePhotos: testPhotos("15370099_001"),
    });

    const id = created.body.id;

    const updated = await authPut(app, `/api/tickets/${id}`).send({
      partner: "Studio Beta",
      style: "Hedge Green - solid",
      instructions: ["Updated instruction"],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.partner).toBe("Studio Beta");
    expect(updated.body.style).toBe("Hedge Green - solid");

    const editedEntries = updated.body.history.filter(
      (entry: { type: string }) => entry.type === "Edited",
    );

    expect(editedEntries.length).toBe(3);

    const changedFields = editedEntries.map(
      (entry: { field: string }) => entry.field,
    );
    expect(changedFields).toContain("style");
    expect(changedFields).toContain("partner");
    expect(changedFields).toContain("instructions");

    const styleChange = editedEntries.find(
      (entry: { field: string }) => entry.field === "style",
    );
    expect(styleChange.oldValue).toBe("Night Sky - AOP White Dots");
    expect(styleChange.newValue).toBe("Hedge Green - solid");

    const partnerChange = editedEntries.find(
      (entry: { field: string }) => entry.field === "partner",
    );
    expect(partnerChange.oldValue).toBe("Studio Alpha");
    expect(partnerChange.newValue).toBe("Studio Beta");
  });

  it("returns invalid transition errors with a stable code", async () => {
    const app = createApp();
    const created = await authPost(app, "/api/tickets").send({
      style: "15370101",
      priority: "High",
      partner: "Studio Alpha",
      instructions: ["Some instruction"],
      referencePhotos: testPhotos("15370101_001"),
    });

    const id = created.body.id;
    await authPost(app, `/api/tickets/${id}/send`);
    const invalidSecondSend = await authPost(app, `/api/tickets/${id}/send`);

    expect(invalidSecondSend.status).toBe(400);
    expect(invalidSecondSend.body.error).toBe(
      "Invalid ticket state transition",
    );
  });

  it("scopes tickets for partner role", async () => {
    const app = createApp();

    // Manager sees all tickets
    const managerTickets = await authGet(app, "/api/tickets");
    expect(managerTickets.status).toBe(200);
    const allCount = managerTickets.body.data.length;

    // Partner only sees their own tickets in Sent/Received/In Progress/Completed
    // (Pending = not yet their concern; Approved = lives in the approved library)
    const partnerTickets = await authGet(
      app,
      "/api/tickets",
      AUTH_PARTNER_BETA,
    );
    expect(partnerTickets.status).toBe(200);
    expect(partnerTickets.body.data.length).toBeLessThanOrEqual(allCount);
    for (const ticket of partnerTickets.body.data) {
      expect(ticket.partner).toBe("Studio Beta");
      expect(["Sent", "Received", "In Progress", "Completed"]).toContain(
        ticket.status,
      );
    }

    // Partner view meta should not include partner filter
    const partnerFilterKeys = partnerTickets.body.meta.filters.map(
      (f: { key: string }) => f.key,
    );
    expect(partnerFilterKeys).not.toContain("partner");

    // Manager view meta should include partner filter
    const managerFilterKeys = managerTickets.body.meta.filters.map(
      (f: { key: string }) => f.key,
    );
    expect(managerFilterKeys).toContain("partner");
  });

  it("scopes approved tickets for partner role", async () => {
    const app = createApp();

    // Create and approve a ticket for Studio Beta
    const created = await authPost(app, "/api/tickets").send({
      style: "15370200",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Test instruction"],
      referencePhotos: testPhotos("15370200_001"),
    });
    const id = created.body.id;
    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_BETA);
    await authPost(app, `/api/tickets/${id}/complete`, AUTH_PARTNER_BETA);
    await authPost(app, `/api/tickets/${id}/approve`);

    // Manager sees all approved
    const managerApproved = await authGet(app, "/api/approved");
    expect(managerApproved.status).toBe(200);
    expect(Array.isArray(managerApproved.body.data)).toBe(true);

    // Partner sees only own approved
    const partnerApproved = await authGet(
      app,
      "/api/approved",
      AUTH_PARTNER_BETA,
    );
    expect(partnerApproved.status).toBe(200);
    for (const ticket of partnerApproved.body.data) {
      expect(ticket.partner).toBe("Studio Beta");
    }
  });

  // ── Photo endpoints ──────────────────────────────────────────────────

  it("allows partner to upload a photo to an In Progress ticket", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370300",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Photo test"],
      referencePhotos: testPhotos("15370300_001"),
    });
    const id = created.body.id;

    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/receipt`, AUTH_PARTNER_BETA);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_BETA);

    const upload = await authPost(
      app,
      `/api/tickets/${id}/photos`,
      AUTH_PARTNER_BETA,
    ).send({
      imageData: Buffer.from("fake-image").toString("base64"),
      thumbnailData: Buffer.from("fake-thumb").toString("base64"),
      fileName: "test-photo.jpg",
    });

    expect(upload.status).toBe(201);
    expect(upload.body).toHaveProperty("id");
    expect(upload.body).toHaveProperty("imageUrl");
    expect(upload.body).toHaveProperty("thumbnailUrl");
    expect(upload.body.label).toBe("test-photo.jpg");
  });

  it("rejects photo upload with invalid file extension", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370301",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Photo ext test"],
      referencePhotos: testPhotos("15370301_001"),
    });
    const id = created.body.id;

    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/receipt`, AUTH_PARTNER_BETA);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_BETA);

    const upload = await authPost(
      app,
      `/api/tickets/${id}/photos`,
      AUTH_PARTNER_BETA,
    ).send({
      imageData: Buffer.from("fake").toString("base64"),
      thumbnailData: Buffer.from("fake").toString("base64"),
      fileName: "test.gif",
    });

    expect(upload.status).toBe(400);
  });

  it("rejects photo upload when ticket is not In Progress", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370302",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Not started yet"],
      referencePhotos: testPhotos("15370302_001"),
    });
    const id = created.body.id;

    // Ticket is still Pending — send it but don't start
    await authPost(app, `/api/tickets/${id}/send`);

    const upload = await authPost(
      app,
      `/api/tickets/${id}/photos`,
      AUTH_PARTNER_BETA,
    ).send({
      imageData: Buffer.from("fake").toString("base64"),
      thumbnailData: Buffer.from("fake").toString("base64"),
      fileName: "photo.jpg",
    });

    expect(upload.status).toBe(409);
  });

  it("rejects photo upload from manager (partner-only route)", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370303",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Manager upload attempt"],
      referencePhotos: testPhotos("15370303_001"),
    });
    const id = created.body.id;

    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/receipt`, AUTH_PARTNER_BETA);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_BETA);

    const upload = await authPost(
      app,
      `/api/tickets/${id}/photos`,
      AUTH_MANAGER,
    ).send({
      imageData: Buffer.from("fake").toString("base64"),
      thumbnailData: Buffer.from("fake").toString("base64"),
      fileName: "photo.jpg",
    });

    expect(upload.status).toBe(403);
  });

  it("allows partner to delete an uploaded photo", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370304",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Delete photo test"],
      referencePhotos: testPhotos("15370304_001"),
    });
    const id = created.body.id;

    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/receipt`, AUTH_PARTNER_BETA);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_BETA);

    const upload = await authPost(
      app,
      `/api/tickets/${id}/photos`,
      AUTH_PARTNER_BETA,
    ).send({
      imageData: Buffer.from("fake-image").toString("base64"),
      thumbnailData: Buffer.from("fake-thumb").toString("base64"),
      fileName: "to-delete.jpg",
    });

    const photoId = upload.body.id;

    const del = await request(app)
      .delete(`/api/tickets/${id}/photos/${photoId}`)
      .set("Authorization", AUTH_PARTNER_BETA);

    expect(del.status).toBe(204);

    // Verify photo is gone from the ticket
    const ticket = await authGet(app, `/api/tickets/${id}`, AUTH_PARTNER_BETA);
    const photoIds = ticket.body.partnerPhotos.map((p: { id: string }) => p.id);
    expect(photoIds).not.toContain(photoId);
  });

  it("returns 404 when deleting a non-existent photo", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370305",
      priority: "Medium",
      partner: "Studio Beta",
      instructions: ["Missing photo delete"],
      referencePhotos: testPhotos("15370305_001"),
    });
    const id = created.body.id;

    await authPost(app, `/api/tickets/${id}/send`);
    await authPost(app, `/api/tickets/${id}/receipt`, AUTH_PARTNER_BETA);
    await authPost(app, `/api/tickets/${id}/start`, AUTH_PARTNER_BETA);

    const del = await request(app)
      .delete(`/api/tickets/${id}/photos/nonexistent`)
      .set("Authorization", AUTH_PARTNER_BETA);

    expect(del.status).toBe(404);
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  it("returns 404 when updating a non-existent ticket", async () => {
    const app = createApp();

    const res = await authPut(app, "/api/tickets/999999").send({
      instructions: ["Updated"],
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when partner accesses a ticket they do not own", async () => {
    const app = createApp();

    const created = await authPost(app, "/api/tickets").send({
      style: "15370400",
      priority: "Medium",
      partner: "Studio Gamma",
      instructions: ["Gamma ticket"],
      referencePhotos: testPhotos("15370400_001"),
    });
    const id = created.body.id;

    // Send so it's visible to partners
    await authPost(app, `/api/tickets/${id}/send`);

    // Studio Beta tries to access Studio Gamma's ticket
    const res = await authGet(app, `/api/tickets/${id}`, AUTH_PARTNER_BETA);

    expect(res.status).toBe(404);
  });
});
