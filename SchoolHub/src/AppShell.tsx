import { useNavigation } from "./context/NavigationContext";
import { useAuth } from "./context/AuthContext";
import { findNavItem } from "./data/navigation";
import { AppLayout } from "./layouts/AppLayout";
import { ComingSoon } from "./pages/ComingSoon";
import { LoginPage } from "./pages/LoginPage";
import { SchoolOverview } from "./pages/SchoolOverview";

/**
 * Root of the authenticated app. Shows the login screen when there is no
 * token, and the shell (sidebar + topbar + page) once signed in.
 */
export default function AppShell() {
  const { isAuthenticated } = useAuth();
  const { activeId } = useNavigation();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const page =
    activeId === "overview" ? (
      <SchoolOverview />
    ) : (
      <ComingSoon title={findNavItem(activeId)?.label ?? "Page"} />
    );

  return <AppLayout>{page}</AppLayout>;
}