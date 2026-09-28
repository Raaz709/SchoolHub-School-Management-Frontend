import { apiGet } from "../lib/api";

export type TeacherClass = {
  Id: number;
  Name: string;
  SectionName: string;
};

export type TeacherSubject = {
  Id: number;
  Name: string;
  Code: string;
};

export function fetchTeacherClasses(signal?: AbortSignal): Promise<TeacherClass[]> {
  return apiGet<TeacherClass[]>("/api/teacher/classes", signal);
}

export function fetchTeacherSubjects(signal?: AbortSignal): Promise<TeacherSubject[]> {
  return apiGet<TeacherSubject[]>("/api/teacher/subjects", signal);
}