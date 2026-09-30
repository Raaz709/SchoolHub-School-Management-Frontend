import { API_BASE_URL } from "./env";

const TOKEN_KEY = "schoolhub.token";
const REFRESH_TOKEN_KEY = "schoolhub.refreshToken";

/** Fired when a refresh attempt definitively fails and the session is over. */
export const SESSION_EXPIRED_EVENT = "schoolhub:session-expired";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Reads the `exp` claim as a millisecond timestamp, or null if unreadable. */
export function decodeTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when the token is missing, expired, or about to expire within `ms`. */
export function isTokenExpiring(token: string | null, ms = 0): boolean {
  const exp = decodeTokenExpiry(token);
  if (exp === null) return token !== null;
  return Date.now() >= exp - ms;
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for a new access token.
 *
 * Calls are de-duplicated behind a single in-flight promise because the
 * backend rotates refresh tokens: parallel refreshes would each invalidate
 * the other and lock the user out.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const stored = getRefreshToken();
  if (!stored) return Promise.resolve(null);

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ RefreshToken: stored }),
      });

      if (!res.ok) {
        setRefreshToken(null);
        setToken(null);
        return null;
      }

      const data = (await res.json()) as {
        accessToken?: string;
        AccessToken?: string;
        refreshToken?: string;
        RefreshToken?: string;
      };

      const accessToken = data.accessToken ?? data.AccessToken ?? null;
      const refreshToken = data.refreshToken ?? data.RefreshToken ?? null;

      setToken(accessToken);
      setRefreshToken(refreshToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function readError(res: Response, fallback: string): Promise<ApiError> {
  let message = fallback;
  try {
    const text = await res.text();
    if (text) {
      try {
        const parsed = JSON.parse(text) as { message?: string; title?: string; Message?: string };
        message = parsed.message ?? parsed.Message ?? parsed.title ?? text;
      } catch {
        message = text;
      }
    }
  } catch {
    /* keep fallback */
  }
  return new ApiError(res.status, message);
}

async function request<T>(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
  allowRetry = true,
): Promise<T> {
  const token = getToken();
  const hasBody = init.body != null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  // A 401 on an authenticated call means the access token aged out. Try one
  // silent renewal, then replay the original request exactly once.
  if (res.status === 401 && allowRetry && token) {
    const renewed = await refreshAccessToken();
    if (renewed) {
      return request<T>(path, init, signal, false);
    }
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!res.ok) {
    throw await readError(res, `${init.method ?? "GET"} ${path} failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "GET" }, signal);
}

export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) }, signal);
}

export function apiPut<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) }, signal);
}

export function apiDelete<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "DELETE" }, signal);
}
