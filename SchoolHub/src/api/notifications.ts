import { apiDelete, apiGet, apiPatch } from "../lib/api";

/** Dispatched after any change so the top-bar badge can refresh itself. */
export const NOTIFICATIONS_CHANGED_EVENT = "schoolhub:notifications-changed";

export type Notification = {
  Id: number;
  Title: string;
  Message: string;
  /** Timestamptz: an ISO-8601 instant. */
  CreatedAt: string;
  IsRead: boolean;
};

export function fetchNotifications(signal?: AbortSignal): Promise<Notification[]> {
  return apiGet<Notification[]>("/api/schoolextensions/notifications", signal);
}

export function fetchUnreadCount(signal?: AbortSignal): Promise<{ UnreadCount: number }> {
  return apiGet<{ UnreadCount: number }>("/api/schoolextensions/notifications/unread-count", signal);
}

function announceChange(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function markNotificationRead(id: number): Promise<{ Message: string }> {
  return apiPatch<{ Message: string }>(`/api/schoolextensions/notifications/${id}/read`).then(
    (result) => {
      announceChange();
      return result;
    },
  );
}

export function markAllNotificationsRead(): Promise<{ Message: string; Updated: number }> {
  return apiPatch<{ Message: string; Updated: number }>(
    "/api/schoolextensions/notifications/read-all",
  ).then((result) => {
    announceChange();
    return result;
  });
}

export function deleteNotification(id: number): Promise<{ Message: string }> {
  return apiDelete<{ Message: string }>(`/api/schoolextensions/notifications/${id}`).then(
    (result) => {
      announceChange();
      return result;
    },
  );
}

export function formatNotificationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
