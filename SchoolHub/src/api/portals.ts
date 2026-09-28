import { apiGet } from "../lib/api";

export type StudentDashboard = {
  AttendancePercentage: number;
  PendingAssignments: number;
  UpcomingExam: string;
  UnreadNotifications: number;
};

export type Child = {
  StudentId: number;
  RollNumber: string;
  StudentName: string;
  ClassName: string | null;
  SectionName: string | null;
};

export function fetchStudentDashboard(
  signal?: AbortSignal,
): Promise<StudentDashboard> {
  return apiGet<StudentDashboard>("/api/portals/student/dashboard", signal);
}

export function fetchParentChildren(signal?: AbortSignal): Promise<Child[]> {
  return apiGet<Child[]>("/api/portals/parent/children", signal);
}