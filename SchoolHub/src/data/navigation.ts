import {
  Bell,
  BookOpenCheck,
  Building2,
  Eye,
  Globe,
  Layers,
  Library,
  MessageSquare,
  MonitorPlay,
  Network,
  NotebookText,
  School,
  ScrollText,
  Target,
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
 * Sidebar items in the exact order shown in the reference design.
 * `id` doubles as the internal route key.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "overview",       label: "School Overview",     icon: School },
  { id: "front-office",   label: "Front Office",        icon: Building2 },
  { id: "students",       label: "Student Info",        icon: UserRound },
  { id: "online-course",  label: "Online Course",       icon: MonitorPlay },
  { id: "branches",       label: "Multi Branch",        icon: Network },
  { id: "live-classes",   label: "Live Classes",        icon: Eye },
  { id: "behavior",       label: "Behavior Records",    icon: Target },
  { id: "income-expense", label: "Income & Expense",    icon: Wallet },
  { id: "cbse",           label: "CBSE Examination",    icon: BookOpenCheck },
  { id: "exams",          label: "Examinations",        icon: ScrollText },
  { id: "attendance",     label: "Attendance",          icon: Bell },
  { id: "online-exams",   label: "Online Examinations", icon: Globe },
  { id: "academics",      label: "Academics",           icon: Library },
  { id: "lesson-plan",    label: "Lesson Plan",         icon: NotebookText },
  { id: "hr",             label: "Human Resource",      icon: Users },
  { id: "communicate",    label: "Communicate",         icon: MessageSquare },
  { id: "fees",           label: "Fees Collection",     icon: Layers },
];

export const DEFAULT_NAV_ID = NAV_ITEMS[0].id;

export function findNavItem(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}