import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_NAV_ID } from "../data/navigation";

type NavigationContextValue = {
  activeId: string;
  setActiveId: (id: string) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string>(DEFAULT_NAV_ID);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({ activeId, setActiveId, collapsed, toggleCollapsed }),
    [activeId, collapsed, toggleCollapsed],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}