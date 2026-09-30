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

export async function fetchStudentDashboard(
  signal?: AbortSignal,
): Promise<StudentDashboard> {
  const raw = await apiGet<any>("/api/portals/student/dashboard", signal);
  return {
    AttendancePercentage: Number(raw.AttendancePercentage ?? raw.attendancePercentage ?? 100),
    PendingAssignments: Number(raw.PendingAssignments ?? raw.pendingAssignments ?? 0),
    UpcomingExam: String(raw.UpcomingExam ?? raw.upcomingExam ?? "None scheduled"),
    UnreadNotifications: Number(raw.UnreadNotifications ?? raw.unreadNotifications ?? 0),
  };
}

export async function fetchParentChildren(signal?: AbortSignal): Promise<Child[]> {
  const raw = await apiGet<any[]>("/api/portals/parent/children", signal);
  return (raw ?? []).map((c) => ({
    StudentId: Number(c.StudentId ?? c.studentId ?? 0),
    RollNumber: String(c.RollNumber ?? c.rollNumber ?? ""),
    StudentName: String(c.StudentName ?? c.studentName ?? ""),
    ClassName: c.ClassName ?? c.className ?? null,
    SectionName: c.SectionName ?? c.sectionName ?? null,
  }));
}