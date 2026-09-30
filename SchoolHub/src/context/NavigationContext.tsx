import { useCallback, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_NAV_ID } from "../data/navigation";
import { NavigationContext, type NavigationContextValue } from "./useNavigation";

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
