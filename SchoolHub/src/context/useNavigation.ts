import { createContext, useContext } from "react";

/**
 * The navigation context lives in its own module so that
 * `NavigationContext.tsx` can export nothing but a component; see the matching
 * note in `auth-context.ts`.
 */

export type NavigationContextValue = {
  activeId: string;
  setActiveId: (id: string) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
};

export const NavigationContext =
  createContext<NavigationContextValue | null>(null);

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
