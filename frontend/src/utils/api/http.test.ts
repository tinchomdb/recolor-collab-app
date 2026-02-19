import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, resolveApiUrl } from "./http";

describe("http utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves relative API paths with base URL", () => {
    expect(resolveApiUrl("/api/tickets")).toBe(
      "http://localhost:3001/api/tickets",
    );
    expect(resolveApiUrl("api/tickets")).toBe(
      "http://localhost:3001/api/tickets",
    );
  });

  it("keeps absolute URLs unchanged", () => {
    expect(resolveApiUrl("https://example.com/items")).toBe(
      "https://example.com/items",
    );
  });

  it("returns parsed JSON for successful responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ value: 1 }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ value: number }>("/api/demo")).resolves.toEqual({
      value: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => "",
      }),
    );

    await expect(apiRequest<void>("/api/empty")).resolves.toBeUndefined();
  });

  it("throws server error payload message when request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: "Invalid payload" }),
      }),
    );

    await expect(apiRequest("/api/fail")).rejects.toThrow("Invalid payload");
  });

  it("throws invalid response error when success body is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "not-json",
      }),
    );

    await expect(apiRequest("/api/malformed")).rejects.toThrow(
      "Invalid server response",
    );
  });
});
