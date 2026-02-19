import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, resolveApiUrl } from "./http";

vi.mock("../../composables/useAuth", () => ({
  getAuthToken: vi.fn(() => null),
}));

import { getAuthToken } from "../../composables/useAuth";
const mockGetAuthToken = vi.mocked(getAuthToken);

describe("http utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    mockGetAuthToken.mockReturnValue(null);
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

  it("throws timeout error when request exceeds timeoutMs", async () => {
    vi.useFakeTimers();

    const neverResolve = vi.fn().mockImplementation(
      (_url: string, opts: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener("abort", () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            );
          });
        }),
    );

    vi.stubGlobal("fetch", neverResolve);

    const promise = apiRequest("/api/slow", { timeoutMs: 5000 });
    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow("Request timed out");
  });

  it("includes Authorization header when auth token is available", async () => {
    mockGetAuthToken.mockReturnValue("manager");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/test");

    const callHeaders = fetchMock.mock.calls[0]![1]!.headers as Record<
      string,
      string
    >;
    expect(callHeaders.Authorization).toBe("manager");
  });

  it("omits Authorization header when auth token is null", async () => {
    mockGetAuthToken.mockReturnValue(null);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/test");

    const callHeaders = fetchMock.mock.calls[0]![1]!.headers as Record<
      string,
      string
    >;
    expect(callHeaders).not.toHaveProperty("Authorization");
  });

  it("falls back to generic message when error response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      }),
    );

    await expect(apiRequest("/api/fail")).rejects.toThrow("Request failed");
  });
});
