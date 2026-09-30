import { createContext, useContext } from "react";
import type { AuthResponse } from "../api/auth";

/**
 * The auth context lives in its own module so that `AuthContext.tsx` can export
 * nothing but a component. Mixing a hook and a component in one file defeats
 * React Fast Refresh, which then re-mounts the whole subtree on every edit
 * (react-refresh/only-export-components).
 */

export type AuthUser = {
  userId: number;
  username: string;
  role: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (res: AuthResponse) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
