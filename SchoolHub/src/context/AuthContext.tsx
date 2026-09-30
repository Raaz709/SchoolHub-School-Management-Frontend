import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  SESSION_EXPIRED_EVENT,
  decodeTokenExpiry,
  getRefreshToken,
  getToken,
  isTokenExpiring,
  refreshAccessToken,
  setRefreshToken,
  setToken,
} from "../lib/api";
import type { AuthResponse } from "../api/auth";
import { logout } from "../api/auth";

const USER_KEY = "schoolhub.user";

/** Renew this long before the access token actually expires. */
const RENEW_MARGIN_MS = 2 * 60 * 1000;

export type AuthUser = {
  userId: number;
  username: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (res: AuthResponse) => void;
  signOut: () => void;
};

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Reads the stored refresh token, hands it to the API, then clears it. */
async function revokeSession(): Promise<void> {
  const token = getRefreshToken();
  if (!token) return;
  await logout(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    getToken() ? readStoredUser() : null,
  );
  const timer = useRef<number | null>(null);

  const signIn = useCallback((res: AuthResponse) => {
    const next: AuthUser = {
      userId: Number(res.userId ?? 0),
      username: String(res.username ?? ""),
      role: String(res.role ?? "Student"),
    };
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken || null);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    // Revoke server-side first, then drop local state immediately so the UI
    // never waits on the network.
    void revokeSession();

    setToken(null);
    setRefreshToken(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  /**
   * Keeps the session alive without the user ever seeing the login screen:
   * wakes up shortly before the access token expires, renews it in the
   * background, and reschedules. Gives up (and signs out) if renewal fails.
   */
  useEffect(() => {
    if (!user) return;

    const schedule = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }

      const exp = decodeTokenExpiry(getToken());
      if (exp === null) return;

      const delay = Math.max(exp - Date.now() - RENEW_MARGIN_MS, 0);

      timer.current = window.setTimeout(async () => {
        const renewed = await refreshAccessToken();
        if (renewed) schedule();
        else signOut();
      }, delay);
    };

    const onExpired = () => signOut();

    // Recover from a stale token left over from a previous browser session.
    if (isTokenExpiring(getToken(), RENEW_MARGIN_MS)) {
      void refreshAccessToken().then((renewed) => {
        if (!renewed) signOut();
        else schedule();
      });
    } else {
      schedule();
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [user, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
