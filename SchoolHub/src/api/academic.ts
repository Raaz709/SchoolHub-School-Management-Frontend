import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

export type ClassItem = {
  Id: number;
  Name: string;
  /** How many sections the class has, so the admin can spot unconfigured ones. */
  SectionCount: number;
};

/**
 * `ClassId` is returned by the API but was previously absent from this type,
 * which forced the UI to match a section to its class by name. Two classes can
 * share a name, and a rename silently broke the pairing.
 */
export type SectionItem = {
  Id: number;
  Name: string;
  ClassId: number | null;
  ClassName: string;
};

/** `TeacherId` is nullable: subjects are unassigned until an admin assigns them. */
export type Subject = {
  Id: number;
  Name: string;
  Code: string;
  TeacherId: number | null;
  /** Joined in by the API so the teacher module can show ownership directly. */
  TeacherName: string | null;
};

export function fetchClasses(signal?: AbortSignal): Promise<ClassItem[]> {
  return apiGet<ClassItem[]>("/api/academic/classes", signal);
}

export function fetchSections(signal?: AbortSignal): Promise<SectionItem[]> {
  return apiGet<SectionItem[]>("/api/academic/sections", signal);
}

export function fetchSubjects(signal?: AbortSignal): Promise<Subject[]> {
  return apiGet<Subject[]>("/api/academic/subjects", signal);
}

/** Subjects offered in a class. Readable by staff; writes are admin-only. */
export function fetchClassSubjects(classId: number, signal?: AbortSignal): Promise<Subject[]> {
  return apiGet<Subject[]>(`/api/academic/classes/${classId}/subjects`, signal);
}

/* --------------------------- writes (Admin only) --------------------------- */

export function createClass(name: string): Promise<{ Message: string; ClassId: number }> {
  return apiPost("/api/academic/classes", { Name: name });
}

export function updateClass(id: number, name: string): Promise<{ Message: string }> {
  return apiPut(`/api/academic/classes/${id}`, { Name: name });
}

/** Refuses with 409 when students are still enrolled in the class. */
export function deleteClass(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/academic/classes/${id}`);
}

export function createSection(name: string, classId: number): Promise<{ Message: string; SectionId: number }> {
  return apiPost("/api/academic/sections", { Name: name, ClassId: classId });
}

export function updateSection(
  id: number,
  name: string,
  classId: number,
): Promise<{ Message: string }> {
  return apiPut(`/api/academic/sections/${id}`, { Name: name, ClassId: classId });
}

/** Refuses with 409 when students are still in the section. */
export function deleteSection(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/academic/sections/${id}`);
}

export function createSubject(name: string, code: string): Promise<{ Message: string; SubjectId: number }> {
  return apiPost("/api/academic/subjects", { Name: name, Code: code });
}

export function updateSubject(id: number, name: string, code: string): Promise<{ Message: string }> {
  return apiPut(`/api/academic/subjects/${id}`, { Name: name, Code: code });
}

/** Refuses with 409 when the subject is still used by assignments, exams, etc. */
export function deleteSubject(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/academic/subjects/${id}`);
}

/**
 * Replaces the class's subject list wholesale. The API validates every id in one
 * statement and applies the whole list atomically, so a retry is safe.
 */
export function setClassSubjects(
  classId: number,
  subjectIds: number[],
): Promise<{ Message: string; Assigned: number }> {
  return apiPut(`/api/academic/classes/${classId}/subjects`, { SubjectIdList: subjectIds });
}

export type Department = {
  Id: number;
  Name: string;
};

export function fetchDepartments(signal?: AbortSignal): Promise<Department[]> {
  return apiGet<Department[]>("/api/admin/departments", signal);
}