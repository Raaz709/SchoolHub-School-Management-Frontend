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

/** Reads a value that the API may send as either PascalCase or camelCase. */
function pick(row: Record<string, unknown>, name: string): unknown {
  return row[name] ?? row[name.charAt(0).toLowerCase() + name.slice(1)];
}

export async function fetchStudentDashboard(
  signal?: AbortSignal,
): Promise<StudentDashboard> {
  const raw = await apiGet<Record<string, unknown>>(
    "/api/portals/student/dashboard",
    signal,
  );

  return {
    AttendancePercentage: Number(pick(raw, "AttendancePercentage") ?? 100),
    PendingAssignments: Number(pick(raw, "PendingAssignments") ?? 0),
    UpcomingExam: String(pick(raw, "UpcomingExam") ?? "None scheduled"),
    UnreadNotifications: Number(pick(raw, "UnreadNotifications") ?? 0),
  };
}

export async function fetchParentChildren(
  signal?: AbortSignal,
): Promise<Child[]> {
  const rows = await apiGet<Record<string, unknown>[]>(
    "/api/portals/parent/children",
    signal,
  );

  return (rows ?? []).map((row) => ({
    StudentId: Number(pick(row, "StudentId") ?? 0),
    RollNumber: String(pick(row, "RollNumber") ?? ""),
    StudentName: String(pick(row, "StudentName") ?? ""),
    ClassName: (pick(row, "ClassName") as string | null) ?? null,
    SectionName: (pick(row, "SectionName") as string | null) ?? null,
  }));
}
