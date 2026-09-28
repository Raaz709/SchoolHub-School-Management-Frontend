import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getToken, setToken } from "../lib/api";
import type { AuthResponse } from "../api/auth";

const USER_KEY = "schoolhub.user";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    getToken() ? readStoredUser() : null,
  );

  const signIn = useCallback((res: AuthResponse) => {
    const next: AuthUser = {
      userId: res.UserId,
      username: res.Username,
      role: res.Role,
    };
    setToken(res.AccessToken);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

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