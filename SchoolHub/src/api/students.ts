import { apiGet } from "../lib/api";

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
};

export type StudentSearchParams = {
  query?: string;
  classId?: number | null;
  sectionId?: number | null;
};

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