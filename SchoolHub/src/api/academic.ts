import { apiGet } from "../lib/api";

export type ClassItem = {
  Id: number;
  Name: string;
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

export type Department = {
  Id: number;
  Name: string;
};

export function fetchDepartments(signal?: AbortSignal): Promise<Department[]> {
  return apiGet<Department[]>("/api/admin/departments", signal);
}