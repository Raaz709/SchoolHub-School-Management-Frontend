import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./AppShell";
import { NavigationProvider } from "./context/NavigationContext";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <NavigationProvider>
      <AppShell />
    </NavigationProvider>
  </StrictMode>,
);
