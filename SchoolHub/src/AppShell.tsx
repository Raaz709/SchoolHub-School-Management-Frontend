import { useNavigation } from "./context/NavigationContext";
import { findNavItem } from "./data/navigation";
import { AppLayout } from "./layouts/AppLayout";
import { ComingSoon } from "./pages/ComingSoon";
import { SchoolOverview } from "./pages/SchoolOverview";

/**
 * New frontend entry point. Replaces the old `App.tsx` demo.
 */
export default function AppShell() {
  const { activeId } = useNavigation();

  const page =
    activeId === "overview" ? (
      <SchoolOverview />
    ) : (
      <ComingSoon title={findNavItem(activeId)?.label ?? "Page"} />
    );

  return <AppLayout>{page}</AppLayout>;
}