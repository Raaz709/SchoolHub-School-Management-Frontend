import { apiGet } from "../lib/api";

export type Announcement = {
  Id: number;
  Title: string;
  Content: string;
  TargetRole: string;
  CreatedAt: string;
};

export function fetchAnnouncements(signal?: AbortSignal): Promise<Announcement[]> {
  return apiGet<Announcement[]>("/api/announcements", signal);
}