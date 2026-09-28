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

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Sidebar items — each backed by a real backend controller.
 * `id` doubles as the internal route key.
 *
 * Backing controllers:
 *   overview    → AdminDashboardController
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
export const NAV_ITEMS: NavItem[] = [
  { id: "overview",    label: "School Overview", icon: School },
  { id: "students",    label: "Student Info",    icon: UserRound },
  { id: "teachers",    label: "Teachers",        icon: Users },
  { id: "academics",   label: "Academics",       icon: Library },
  { id: "timetable",   label: "Timetable",       icon: CalendarDays },
  { id: "attendance",  label: "Attendance",      icon: ClipboardCheck },
  { id: "exams",       label: "Examinations",    icon: ScrollText },
  { id: "assignments", label: "Assignments",     icon: FileText },
  { id: "fees",        label: "Fees Collection", icon: Wallet },
  { id: "communicate", label: "Communicate",     icon: MessageSquare },
  { id: "events",      label: "Events",          icon: PartyPopper },
  { id: "reports",     label: "Reports",         icon: BarChart3 },
  { id: "audit-logs",  label: "Audit Logs",      icon: History },
];

export const DEFAULT_NAV_ID = NAV_ITEMS[0].id;

export function findNavItem(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}