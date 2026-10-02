import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

export type TargetRole = "All" | "Admin" | "Teacher" | "Student" | "Parent";

/** The audiences the compose form offers; must match the API's check. */
export const TARGET_ROLES: TargetRole[] = ["All", "Admin", "Teacher", "Student", "Parent"];

export type Announcement = {
  Id: number;
  Title: string;
  Content: string;
  TargetRole: TargetRole;
  ClassId: number | null;
  ClassName: string | null;
  AuthorName: string | null;
  /** Timestamptz: an ISO-8601 instant. */
  CreatedAt: string;
};

export type SaveAnnouncementPayload = {
  Title: string;
  Content: string;
  TargetRole: TargetRole;
  ClassId: number | null;
};

export function formatAnnouncementDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Scoped server-side: a learner only receives what targets them. */
export function fetchAnnouncements(signal?: AbortSignal): Promise<Announcement[]> {
  return apiGet<Announcement[]>("/api/announcements", signal);
}

export function createAnnouncement(
  payload: SaveAnnouncementPayload,
): Promise<{ Message: string; AnnouncementId: number }> {
  return apiPost("/api/announcements", payload);
}

/** A teacher may only edit their own; an Admin may edit any. */
export function updateAnnouncement(
  id: number,
  payload: SaveAnnouncementPayload,
): Promise<{ Message: string }> {
  return apiPut(`/api/announcements/${id}`, payload);
}

export function deleteAnnouncement(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/announcements/${id}`);
}
