import { apiGet, apiPatch, apiPost, apiPut } from "../lib/api";

export type Student = {
  Id: number;
  RollNumber: string;
  AdmissionDate: string | null;
  UserId: number;
  Username: string;
  Email: string;
  IsActive: boolean;
  ClassName: string | null;
  SectionName: string | null;
  /** Ids as well as names: class names are not unique, so a name match would
   *  default the assignment dialog to whichever class was created first. */
  ClassId: number | null;
  SectionId: number | null;
};

export type StudentSearchParams = {
  query?: string;
  classId?: number | null;
  sectionId?: number | null;
};

export type CreateStudentPayload = {
  Username: string;
  Email: string;
  Password: string;
  RollNumber: string;
  AdmissionDate?: string | null;
  ClassId?: number | null;
  SectionId?: number | null;
};

export type UpdateStudentPayload = {
  RollNumber: string;
};

export type AssignClassPayload = {
  ClassId: number;
  SectionId: number;
};

/** Both the full roster and the filtered search return the same row shape. */
export async function fetchStudents(signal?: AbortSignal): Promise<Student[]> {
  return apiGet<Student[]>("/api/students", signal);
}

export async function searchStudents(
  params: StudentSearchParams,
  signal?: AbortSignal,
): Promise<Student[]> {
  const q = new URLSearchParams();
  if (params.query) q.set("query", params.query);
  if (params.classId) q.set("classId", String(params.classId));
  if (params.sectionId) q.set("sectionId", String(params.sectionId));
  const qs = q.toString();
  return apiGet<Student[]>(`/api/students/search${qs ? `?${qs}` : ""}`, signal);
}

/**
 * Creates the login, the Student role grant and the student record in one
 * transaction. Admin only.
 */
export function createStudent(
  payload: CreateStudentPayload,
  signal?: AbortSignal,
): Promise<{ Message: string; StudentId: number; UserId: number }> {
  return apiPost<{ Message: string; StudentId: number; UserId: number }>(
    "/api/students",
    payload,
    signal,
  );
}

/** Roll number is the only editable field. Returns 404 for an unknown id. */
export function updateStudent(
  id: number,
  payload: UpdateStudentPayload,
  signal?: AbortSignal,
): Promise<{ Message: string }> {
  return apiPut<{ Message: string }>(`/api/students/${id}`, payload, signal);
}

/** Blocks sign-in. The student row itself is kept for reporting. */
export function deactivateStudent(
  id: number,
  signal?: AbortSignal,
): Promise<{ Message: string }> {
  return apiPatch<{ Message: string }>(`/api/students/${id}/deactivate`, undefined, signal);
}

/** The inverse of {@link deactivateStudent}, so deactivation is reversible. */
export function reactivateStudent(
  id: number,
  signal?: AbortSignal,
): Promise<{ Message: string }> {
  return apiPatch<{ Message: string }>(`/api/students/${id}/reactivate`, undefined, signal);
}

/**
 * Sets the student's class and section, replacing any previous enrolment.
 *
 * Both a class and a section are required: `Classes` and `Sections` are
 * separate tables and the UI cannot infer one from the other.
 */
export function assignStudentClass(
  id: number,
  payload: AssignClassPayload,
  signal?: AbortSignal,
): Promise<{ Message: string }> {
  return apiPost<{ Message: string }>(
    `/api/students/${id}/assign-class`,
    payload,
    signal,
  );
}
