import { getAuthToken } from "../../composables/useAuth";

const API_BASE = (
  import.meta.env.VITE_API_BASE ?? "http://localhost:3001"
).replace(/\/$/, "");

const DEFAULT_TIMEOUT_MS = 10_000;

interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export async function apiRequest<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    signal: externalSignal,
    ...requestOptions
  } = options ?? {};

  const controller = new AbortController();
  const timeout =
    timeoutMs > 0
      ? setTimeout(() => {
          controller.abort();
        }, timeoutMs)
      : undefined;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  let response: Response;

  try {
    const authToken = getAuthToken();
    const authHeaders: Record<string, string> = authToken
      ? { Authorization: authToken }
      : {};

    response = await fetch(resolveApiUrl(path), {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
      ...requestOptions,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Request timed out");
    }

    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  if (!response.ok) {
    let message = "Request failed";

    try {
      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : null;
      message = payload?.error?.message ?? payload?.error ?? message;
    } catch {
      message = "Request failed";
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Invalid server response");
  }
}
