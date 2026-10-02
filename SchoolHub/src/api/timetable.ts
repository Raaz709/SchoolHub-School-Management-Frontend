import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

/**
 * A bell-schedule period. Times come back as `HH:mm:ss` because the column is a
 * PostgreSQL `time`; the UI trims them for display.
 */
export type TimeSlot = {
  Id: number;
  StartTime: string;
  EndTime: string;
  Label: string | null;
};

/**
 * One scheduled lesson. `DayOfWeek` is ISO-8601: 1 = Monday … 7 = Sunday, the
 * same convention the API validates against.
 */
export type TimetableEntry = {
  Id: number;
  ClassId: number;
  ClassName: string;
  SectionId: number;
  SectionName: string;
  SubjectId: number;
  SubjectName: string;
  TeacherId: number | null;
  TeacherName: string | null;
  TimeSlotId: number;
  StartTime: string;
  EndTime: string;
  SlotLabel: string | null;
  DayOfWeek: number;
};

export type SaveTimeSlotPayload = {
  StartTime: string;
  EndTime: string;
  Label?: string | null;
};

export type SaveEntryPayload = {
  ClassId: number;
  SectionId: number;
  SubjectId: number;
  /** 0 means no teacher is assigned yet. */
  TeacherId: number;
  TimeSlotId: number;
  DayOfWeek: number;
};

/** Day numbers and labels, mirroring the API's ISO-8601 convention. */
export const DAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" },
];

/** `08:00:00` (or `08:00`) to `08:00`. */
export function hhmm(time: string): string {
  return time?.slice(0, 5) ?? "";
}

/* ------------------------------- reads ------------------------------- */

export function fetchTimeSlots(signal?: AbortSignal): Promise<TimeSlot[]> {
  return apiGet<TimeSlot[]>("/api/schoolextensions/timeslots", signal);
}

export function fetchTimetable(
  classId: number,
  sectionId: number,
  signal?: AbortSignal,
): Promise<TimetableEntry[]> {
  return apiGet<TimetableEntry[]>(
    `/api/schoolextensions/timetable?classId=${classId}&sectionId=${sectionId}`,
    signal,
  );
}

/** The caller's own week: a student's class, or a teacher's lessons. */
export function fetchMyTimetable(signal?: AbortSignal): Promise<TimetableEntry[]> {
  return apiGet<TimetableEntry[]>("/api/schoolextensions/timetable/mine", signal);
}

export function fetchStudentTimetable(
  studentId: number,
  signal?: AbortSignal,
): Promise<TimetableEntry[]> {
  return apiGet<TimetableEntry[]>(
    `/api/schoolextensions/timetable/student/${studentId}`,
    signal,
  );
}

/* ------------------------------- writes (Admin only) ------------------------------- */

export function createTimeSlot(
  payload: SaveTimeSlotPayload,
): Promise<{ Message: string; TimeSlotId: number }> {
  return apiPost("/api/schoolextensions/timeslots", payload);
}

/** Refused with 409 when the new times overlap another period. */
export function updateTimeSlot(
  id: number,
  payload: SaveTimeSlotPayload,
): Promise<{ Message: string }> {
  return apiPut(`/api/schoolextensions/timeslots/${id}`, payload);
}

/** Refused with 409 while any timetable entry is scheduled into it. */
export function deleteTimeSlot(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/schoolextensions/timeslots/${id}`);
}

export function createEntry(
  payload: SaveEntryPayload,
): Promise<{ Message: string; Id: number }> {
  return apiPost("/api/schoolextensions/timetable", payload);
}

/** Refused with 409 when the section or teacher is already booked then. */
export function updateEntry(
  id: number,
  payload: SaveEntryPayload,
): Promise<{ Message: string }> {
  return apiPut(`/api/schoolextensions/timetable/${id}`, payload);
}

export function deleteEntry(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/schoolextensions/timetable/${id}`);
}
