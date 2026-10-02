import { useAuth } from "./context/useAuth";
import { canAccess } from "./data/navigation";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
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
import { CommunicatePage } from "./pages/CommunicatePage";
import { ReportsPage } from "./pages/ReportsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { ParentDashboard } from "./pages/ParentDashboard";
import { ProfilePage } from "./pages/ProfilePage";

/**
 * Root of the authenticated app. Shows the login screen when there is no
 * token, and the shell (sidebar + topbar + page) once signed in.
 *
 * Routing is now handled by react-router-dom. The "overview" page is
 * role-dependent: Admin → SchoolOverview, Teacher → TeacherDashboard,
 * Parent → ParentDashboard, Student → StudentDashboard.
 */
export default function AppShell() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const role = user?.role ?? "";

  return (
    <AppLayout>
      <Routes>
        {/* Overview is role-dependent */}
        <Route
          path="/overview"
          element={
            role === "Admin" ? (
              <SchoolOverview />
            ) : role === "Teacher" ? (
              <TeacherDashboard />
            ) : role === "Parent" ? (
              <ParentDashboard />
            ) : (
              <StudentDashboard />
            )
          }
        />

        {/* Static pages with role guards */}
        <Route
          path="/students"
          element={canAccess(role, "students") ? <StudentInfo /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/teachers"
          element={canAccess(role, "teachers") ? <TeachersPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/academics"
          element={canAccess(role, "academics") ? <AcademicsPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/timetable"
          element={canAccess(role, "timetable") ? <TimetablePage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/attendance"
          element={canAccess(role, "attendance") ? <AttendancePage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/exams"
          element={canAccess(role, "exams") ? <ExamsPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/fees"
          element={canAccess(role, "fees") ? <FeesPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/events"
          element={canAccess(role, "events") ? <EventsPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/assignments"
          element={canAccess(role, "assignments") ? <AssignmentsPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/communicate"
          element={canAccess(role, "communicate") ? <CommunicatePage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/reports"
          element={canAccess(role, "reports") ? <ReportsPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/audit-logs"
          element={canAccess(role, "audit-logs") ? <AuditLogsPage /> : <Navigate to="/overview" replace />}
        />
        <Route
          path="/profile"
          element={canAccess(role, "profile") ? <ProfilePage /> : <Navigate to="/overview" replace />}
        />

        {/* Catch-all: redirect unknown paths to overview */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </AppLayout>
  );
}