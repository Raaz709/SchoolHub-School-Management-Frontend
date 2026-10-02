import { useContext } from "react";
import { SidebarContext } from "./SidebarContextValue";

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}