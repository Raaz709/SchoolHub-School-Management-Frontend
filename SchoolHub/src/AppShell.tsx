import { useNavigation } from "./context/useNavigation";
import { useAuth } from "./context/useAuth";
import { canAccess, DEFAULT_NAV_ID, findNavItem } from "./data/navigation";
import { AppLayout } from "./layouts/AppLayout";
import { ComingSoon } from "./pages/ComingSoon";
import { LoginPage } from "./pages/LoginPage";
import { SchoolOverview } from "./pages/SchoolOverview";
import { StudentInfo } from "./pages/StudentInfo";
import { TeachersPage } from "./pages/TeachersPage";
import { AcademicsPage } from "./pages/AcademicsPage";
import { AttendancePage } from "./pages/AttendancePage";
import { ExamsPage } from "./pages/ExamsPage";
import { FeesPage } from "./pages/FeesPage";
import { TimetablePage } from "./pages/TimetablePage";
import { EventsPage } from "./pages/EventsPage";
import { AssignmentsPage } from "./pages/AssignmentsPage";
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

  // Hiding a nav item is not enough on its own: activeId persists across a
  // role change, so anything this role may not open is redirected rather than
  // rendered.
  const allowed = canAccess(role, activeId) ? activeId : DEFAULT_NAV_ID;

  function renderOverview() {
    // Admin is the only role that gets the school-wide overview, because it is
    // the only one that may read /api/admin/dashboard/stats. Anything
    // unrecognised falls through to the student dashboard rather than the admin
    // one, so a malformed role can never surface an admin page.
    if (role === "Admin") return <SchoolOverview />;
    if (role === "Teacher") return <TeacherDashboard />;
    if (role === "Parent") return <ParentDashboard />;
    return <StudentDashboard />;
  }

  const page =
    allowed === "overview" ? (
      renderOverview()
    ) : allowed === "students" ? (
      <StudentInfo />
    ) : allowed === "teachers" ? (
      <TeachersPage />
    ) : allowed === "academics" ? (
      <AcademicsPage />
    ) : allowed === "timetable" ? (
      <TimetablePage />
    ) : allowed === "attendance" ? (
      <AttendancePage />
    ) : allowed === "exams" ? (
      <ExamsPage />
    ) : allowed === "fees" ? (
      <FeesPage />
    ) : allowed === "events" ? (
      <EventsPage />
    ) : allowed === "assignments" ? (
      <AssignmentsPage />
    ) : allowed === "profile" ? (
      <ProfilePage />
    ) : (
      <ComingSoon title={findNavItem(allowed)?.label ?? "Page"} />
    );

  return <AppLayout>{page}</AppLayout>;
}