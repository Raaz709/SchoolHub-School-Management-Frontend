import { API_BASE_URL } from "../lib/env";
import { apiPost } from "../lib/api";

export type LoginRequest = {
  Username: string;
  Password: string;
};

export type RegisterRequest = {
  Username: string;
  Email: string;
  Password: string;
  Role: "Student" | "Teacher" | "Parent";
  RollNumber?: string;
  EmployeeCode?: string;
  Occupation?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: string;
  userId: number;
};

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", payload);
}

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/register", payload);
}

/**
 * Revokes the refresh token server-side so the session cannot be renewed.
 *
 * Deliberately uses a raw fetch rather than `apiPost`: that helper renews the
 * access token on a 401, which would silently re-create the very session the
 * user is trying to end. `keepalive` lets the request survive a page unload.
 *
 * Best-effort — the caller clears its own tokens regardless of the outcome.
 */
export async function logout(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ RefreshToken: refreshToken }),
      keepalive: true,
    });
  } catch {
    /* ignore — the local session is cleared regardless */
  }
}
