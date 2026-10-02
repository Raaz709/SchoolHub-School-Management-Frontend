import { createContext } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

export const SidebarContext = createContext<SidebarContextValue | null>(null);