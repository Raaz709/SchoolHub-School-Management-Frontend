import { apiGet } from "../lib/api";

/**
 * Shape returned by GET /api/admin/dashboard/stats
 * (AdminDashboardController.GetDashboardStats).
 */
export type ActivityItem = {
  Action: string;
  Details: string | null;
  CreatedAt: string;
};

export type DashboardStats = {
  TotalStudents: number;
  TotalTeachers: number;
  TotalParents: number;
  TotalClasses: number;
  TodaysAttendance: number;
  UpcomingExams: number;
  RecentAnnouncementsCount: number;
  RecentActivity: ActivityItem[];
};

export function fetchDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
  return apiGet<DashboardStats>("/api/admin/dashboard/stats", signal);
}