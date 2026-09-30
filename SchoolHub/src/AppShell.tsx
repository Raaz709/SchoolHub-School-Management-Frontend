import { useNavigation } from "./context/NavigationContext";
import { useAuth } from "./context/AuthContext";
import { findNavItem } from "./data/navigation";
import { AppLayout } from "./layouts/AppLayout";
import { ComingSoon } from "./pages/ComingSoon";
import { LoginPage } from "./pages/LoginPage";
import { SchoolOverview } from "./pages/SchoolOverview";
import { StudentInfo } from "./pages/StudentInfo";
import { TeachersPage } from "./pages/TeachersPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { ParentDashboard } from "./pages/ParentDashboard";
import { ProfilePage } from "./pages/ProfilePage";

/**
 * Root of the authenticated app. Shows the login screen when there is no
 * token, and the shell (sidebar + topbar + page) once signed in.
 *
 * The "overview" page is role-dependent: Admin/other → SchoolOverview,
 * Student → StudentDashboard, Teacher → TeacherDashboard, Parent → ParentDashboard.
 */
export default function AppShell() {
  const { isAuthenticated, user } = useAuth();
  const { activeId } = useNavigation();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const role = user?.role ?? "";

  function renderOverview() {
    if (role === "Student") return <StudentDashboard />;
    if (role === "Teacher") return <TeacherDashboard />;
    if (role === "Parent") return <ParentDashboard />;
    return <SchoolOverview />;
  }

  const page =
    activeId === "overview" ? (
      renderOverview()
    ) : activeId === "students" ? (
      <StudentInfo />
    ) : activeId === "teachers" ? (
      <TeachersPage />
    ) : activeId === "profile" ? (
      <ProfilePage />
    ) : (
      <ComingSoon title={findNavItem(activeId)?.label ?? "Page"} />
    );

  return <AppLayout>{page}</AppLayout>;
}