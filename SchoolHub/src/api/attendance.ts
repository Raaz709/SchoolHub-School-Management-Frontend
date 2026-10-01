import { apiGet, apiPost, apiPut } from "../lib/api";

/**
 * The four statuses the API accepts. Anything else is refused server-side, so a
 * typo cannot become a fifth status that no report counts — which previously
 * inflated a student's attendance percentage instead of recording the mistake.
 */
export const STATUSES = ["Present", "Absent", "Late", "Excused"] as const;

export type AttendanceStatus = (typeof STATUSES)[number];

export type StatusTone = "ok" | "warn" | "bad" | "muted";

const STATUS_TONES: Record<AttendanceStatus, StatusTone> = {
  Present: "ok",
  Late: "warn",
  Absent: "bad",
  Excused: "muted",
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONES[status as AttendanceStatus] ?? "muted";
}

/**
 * One marked day for a section.
 *
 * `Total` and `Marked` are counted by the API in the same query. `Marked` counts
 * non-absent rows, so an unmarked student shows up as missing from the tally
 * rather than as present.
 */
export type SessionSummary = {
  Id: number;
  /** Date-only; the column is `date`, not a timestamp. */
  Date: string;
  ClassId: number;
  SectionId: number;
  TeacherId: number | null;
  ClassName: string;
  SectionName: string;
  TeacherName: string | null;
  Marked: number;
  Total: number;
};

/** A session reopened for correction. */
export type SessionDetail = {
  Id: number;
  Date: string;
  ClassId: number;
  SectionId: number;
  TeacherId: number | null;
  ClassName: string;
  SectionName: string;
};

export type SessionRecord = {
  Id: number;
  StudentId: number;
  Status: string;
  Remarks: string;
  RollNumber: string;
  Username: string;
};

/**
 * A student to mark.
 *
 * `Status` and `Remarks` are null when that student has no mark for the date yet,
 * which is how the marking screen tells "not decided" from "decided absent".
 */
export type RosterStudent = {
  StudentId: number;
  RollNumber: string;
  Username: string;
  RecordId: number | null;
  Status: string | null;
  Remarks: string | null;
};

export type Roster = {
  ClassId: number;
  SectionId: number;
  Date: string;
  Students: RosterStudent[];
};

/**
 * One student's own attendance. Carries `ClassName`/`SectionName` so a student or
 * parent sees where each day was marked without the UI needing a class list.
 */
export type StudentAttendance = {
  Id: number;
  Status: string;
  Remarks: string;
  SessionId: number;
  Date: string;
  ClassId: number;
  ClassName: string;
  SectionName: string;
};

export type MarkInput = {
  StudentId: number;
  Status: string;
  Remarks: string;
};

export type SessionPayload = {
  ClassId: number;
  SectionId: number;
  Date: string;
  Records: MarkInput[];
};

/* --------------------------- staff reads --------------------------- */

/**
 * Marking history, newest first. Omit the filters for everything.
 *
 * The date bounds are optional, so the API has to type the parameters itself —
 * that is why the omitted case is a cast rather than a bare null comparison.
 */
export function fetchSessions(
  filters: { classId?: number; sectionId?: number; from?: string; to?: string } = {},
  signal?: AbortSignal,
): Promise<SessionSummary[]> {
  const params = new URLSearchParams();
  if (filters.classId) params.set("classId", String(filters.classId));
  if (filters.sectionId) params.set("sectionId", String(filters.sectionId));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return apiGet<SessionSummary[]>(`/api/attendance/sessions${query ? `?${query}` : ""}`, signal);
}

export function fetchSession(id: number, signal?: AbortSignal): Promise<{ Session: SessionDetail; Records: SessionRecord[] }> {
  return apiGet(`/api/attendance/sessions/${id}`, signal);
}

export function fetchRoster(
  classId: number,
  sectionId: number,
  date: string,
  signal?: AbortSignal,
): Promise<Roster> {
  const params = new URLSearchParams({ classId: String(classId), sectionId: String(sectionId), date });
  return apiGet<Roster>(`/api/attendance/roster?${params.toString()}`, signal);
}

/* --------------------------- learner reads --------------------------- */

/**
 * The signed-in student's own attendance.
 *
 * Preferred over `fetchStudentAttendance` for a Student because nothing exposed
 * the caller's Students.Id; the API resolves it from the token instead.
 */
export function fetchMyAttendance(signal?: AbortSignal): Promise<StudentAttendance[]> {
  return apiGet<StudentAttendance[]>("/api/attendance/mine", signal);
}

/**
 * One student's attendance. The API scopes this itself: a Student may only read
 * their own id and a Parent only a linked child, so the id is not a loophole.
 */
export function fetchStudentAttendance(
  studentId: number,
  signal?: AbortSignal,
): Promise<StudentAttendance[]> {
  return apiGet<StudentAttendance[]>(`/api/attendance/student/${studentId}`, signal);
}

/* --------------------------- writes (staff) --------------------------- */

/**
 * Records a day. Refuses with 409 if that section was already marked for that
 * date, returning the existing `SessionId` so the caller can jump to editing it
 * instead of leaving the teacher stuck.
 */
export function markSession(payload: SessionPayload): Promise<{ Message: string; SessionId: number }> {
  return apiPost("/api/attendance/session", payload);
}

/**
 * Replaces every mark on an existing session. Updates in place, so a re-mark
 * cannot duplicate a student or orphan their original remark. Refuses if the
 * payload tries to move the session to another section.
 */
export function updateSession(
  id: number,
  payload: SessionPayload,
): Promise<{ Message: string; SessionId: number }> {
  return apiPut(`/api/attendance/sessions/${id}`, payload);
}