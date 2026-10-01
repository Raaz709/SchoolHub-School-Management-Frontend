import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileText,
  History,
  Library,
  MessageSquare,
  PartyPopper,
  School,
  ScrollText,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Role = "Admin" | "Teacher" | "Student" | "Parent";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /**
   * Roles allowed to see and open this page.
   *
   * Derived from the backend's own authorization, not from preference:
   *   - Admin-only pages are backed by `api/admin/*`, `api/AuditLogs` and
   *     `api/reports/*`, which carry a class-level
   *     `[Authorize(Roles = "Admin")]`.
   *   - "Attendance", "Examinations" and "Communicate" are backed by endpoints
   *     restricted to Admin,Teacher (or readable by everyone, written by staff).
   *   - Timetable and Events are readable by any signed-in user.
   */
  roles: Role[];
  /**
   * Reachable but not listed in the sidebar. The profile page is opened from
   * the top-bar avatar, so it must still pass {@link canAccess} even though it
   * has no sidebar entry.
   */
  hidden?: boolean;
};

/**
 * Sidebar items — each backed by a real backend controller.
 * `id` doubles as the internal route key.
 *
 * Backing controllers:
 *   overview    → PortalsController (+ AdminDashboardController)
 *   students    → StudentsController
 *   teachers    → TeachersController + AdminManagementController
 *   academics   → AcademicController
 *   timetable   → SchoolExtensionsController
 *   attendance  → AttendanceController
 *   exams       → ExamsController
 *   assignments → AssignmentsController
 *   fees        → FeesController + ReportsController
 *   communicate → AnnouncementsController + Notifications
 *   events      → SchoolExtensionsController
 *   reports     → ReportsController
 *   audit-logs  → AuditLogsController
 */
const ALL: Role[] = ["Admin", "Teacher", "Student", "Parent"];
const STAFF: Role[] = ["Admin", "Teacher"];
const ADMIN_ONLY: Role[] = ["Admin"];
/** Staff set the work, learners see and respond to it. */
const STAFF_AND_STUDENT: Role[] = ["Admin", "Teacher", "Student"];
/** Reads a student legitimately needs for themselves or their child. */
const LEARNER: Role[] = ["Admin", "Teacher", "Student", "Parent"];

export const NAV_ITEMS: NavItem[] = [
  { id: "overview",    label: "School Overview", icon: School,       roles: ALL },
  { id: "students",    label: "Student Info",    icon: UserRound,    roles: STAFF },
  { id: "teachers",    label: "Teachers",        icon: Users,        roles: ADMIN_ONLY },
  { id: "academics",   label: "Academics",       icon: Library,      roles: STAFF },
  { id: "timetable",   label: "Timetable",       icon: CalendarDays, roles: ALL },
  { id: "attendance",  label: "Attendance",      icon: ClipboardCheck, roles: LEARNER },
  { id: "exams",       label: "Examinations",    icon: ScrollText,   roles: STAFF_AND_STUDENT },
  { id: "assignments", label: "Assignments",     icon: FileText,     roles: STAFF_AND_STUDENT },
  { id: "fees",        label: "Fees Collection", icon: Wallet,       roles: ADMIN_ONLY },
  { id: "communicate", label: "Communicate",     icon: MessageSquare, roles: ALL },
  { id: "events",      label: "Events",          icon: PartyPopper,  roles: ALL },
  { id: "reports",     label: "Reports",         icon: BarChart3,    roles: ADMIN_ONLY },
  { id: "audit-logs",  label: "Audit Logs",      icon: History,      roles: ADMIN_ONLY },

  // Not in the sidebar: opened from the avatar button in the top bar. Every
  // signed-in role has a profile, and /api/profile only ever returns the
  // caller's own row.
  { id: "profile",     label: "My Profile",      icon: UserRound,    roles: ALL, hidden: true },
];

export const DEFAULT_NAV_ID = "overview";

/** Narrow an unknown/empty role to a safe default so nothing is ever over-exposed. */
function normalizeRole(role: string | undefined | null): Role {
  return role === "Admin" || role === "Teacher" || role === "Student" || role === "Parent"
    ? role
    : "Student";
}

/** The nav items a role is allowed to see, in display order. */
export function navItemsForRole(role: string | undefined | null): NavItem[] {
  const r = normalizeRole(role);
  return NAV_ITEMS.filter((item) => !item.hidden && item.roles.includes(r));
}

export function findNavItem(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}

/**
 * True when a role may open a page. Used to guard rendering, not just the
 * sidebar, so a stale `activeId` cannot display an admin-only page.
 *
 * Hidden items (the profile page) are included here: they are reachable, just
 * not listed in the sidebar.
 */
export function canAccess(role: string | undefined | null, id: string): boolean {
  const r = normalizeRole(role);
  return NAV_ITEMS.some((item) => item.id === id && item.roles.includes(r));
}