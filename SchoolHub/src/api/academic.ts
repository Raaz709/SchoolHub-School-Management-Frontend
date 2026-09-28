import { apiGet } from "../lib/api";

export type ClassItem = {
  Id: number;
  Name: string;
};

export type SectionItem = {
  Id: number;
  Name: string;
  ClassName: string;
};

export function fetchClasses(signal?: AbortSignal): Promise<ClassItem[]> {
  return apiGet<ClassItem[]>("/api/academic/classes", signal);
}

export function fetchSections(signal?: AbortSignal): Promise<SectionItem[]> {
  return apiGet<SectionItem[]>("/api/academic/sections", signal);
}