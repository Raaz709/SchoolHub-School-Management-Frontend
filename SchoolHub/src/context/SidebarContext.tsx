import { useState, type ReactNode, useCallback } from "react";
import { SidebarContext } from "./SidebarContextValue";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}