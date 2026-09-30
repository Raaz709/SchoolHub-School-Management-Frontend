import { apiGet, apiPatch, apiPost, apiPut } from "../lib/api";

/**
 * Row shape returned by `GET /api/admin/teachers`, which is the only teacher
 * endpoint that includes `IsActive` — so it is the one the management UI reads.
 */
export type Teacher = {
  Id: number;
  EmployeeCode: string;
  HireDate: string | null;
  /** Null when the teacher has no department, or the department was removed. */
  DepartmentId: number | null;
  DepartmentName: string | null;
  UserId: number;
  Username: string;
  Email: string;
  IsActive: boolean;
};

export type UpdateTeacherPayload = {
  DepartmentId: number;
  EmployeeCode: string;
};

export type CreateTeacherPayload = {
  Username: string;
  Email: string;
  Password: string;
  EmployeeCode: string;
  DepartmentId?: number | null;
  HireDate?: string | null;
};

export async function fetchTeachers(signal?: AbortSignal): Promise<Teacher[]> {
  return apiGet<Teacher[]>("/api/admin/teachers", signal);
}

export function updateTeacher(
  id: number,
  payload: UpdateTeacherPayload,
  signal?: AbortSignal,
): Promise<{ Message: string }> {
  return apiPut<{ Message: string }>(`/api/admin/teachers/${id}`, payload, signal);
}

/** Deactivates the linked user account; there is no reactivate endpoint yet. */
export function deactivateTeacher(
  id: number,
  signal?: AbortSignal,
): Promise<{ Message: string }> {
  return apiPatch<{ Message: string }>(`/api/admin/teachers/${id}/deactivate`, undefined, signal);
}

/**
 * Replaces the teacher's subject allocation with `subjectIdList`.
 *
 * Requires the `subjects.teacherid` column added in
 * `migrations/001_subjects_teacherid.sql`; before that the endpoint returned
 * 500 with "column teacherid of relation subjects does not exist".
 */
export function assignTeacherSubjects(
  id: number,
  subjectIdList: number[],
  signal?: AbortSignal,
): Promise<{ Message: string }> {
  return apiPost<{ Message: string }>(
    `/api/admin/teachers/${id}/assign-subjects`,
    { SubjectIdList: subjectIdList },
    signal,
  );
}

export function createTeacher(
  payload: CreateTeacherPayload,
  signal?: AbortSignal,
): Promise<{ Message: string; TeacherId: number; UserId: number }> {
  return apiPost<{ Message: string; TeacherId: number; UserId: number }>(
    "/api/teachers",
    payload,
    signal,
  );
}
