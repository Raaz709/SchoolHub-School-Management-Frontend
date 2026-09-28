import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./AppShell";
import { AuthProvider } from "./context/AuthContext";
import { NavigationProvider } from "./context/NavigationContext";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <NavigationProvider>
        <AppShell />
      </NavigationProvider>
    </AuthProvider>
  </StrictMode>,
);
