import { apiGet } from "../lib/api";

/**
 * One recorded action, newest first from the API.
 *
 * `Username` is null when the account behind the entry has since been deleted
 * (the column is `ON DELETE SET NULL`), and `IpAddress` is null for entries
 * written before it was captured.
 */
export type AuditLog = {
  Id: number;
  Action: string;
  Details: string | null;
  IpAddress: string | null;
  /** Timestamptz: an ISO-8601 instant. */
  CreatedAt: string;
  Username: string | null;
};

/** Human wording for the actions the API writes today, keyed by its own code. */
const ACTION_LABELS: Record<string, string> = {
  MARK_ATTENDANCE: "Marked attendance",
  EDIT_ATTENDANCE: "Corrected attendance",
  SAVE_MARKS: "Saved marks",
  CREATE_STUDENT: "Created student",
};

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").toLowerCase();
}

/**
 * A colour per action family, so the list can be scanned without reading every
 * row. Unknown actions fall back to a neutral tone rather than disappearing.
 */
export function auditActionTone(action: string): string {
  if (action.startsWith("MARK_")) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (action.startsWith("EDIT_")) return "bg-amber-50 text-amber-700 ring-amber-200";
  if (action.startsWith("SAVE_")) return "bg-violet-50 text-violet-700 ring-violet-200";
  if (action.startsWith("DELETE_") || action.startsWith("REMOVE_")) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  if (action.startsWith("CREATE_")) return "bg-mint-50 text-mint-700 ring-mint-200";
  return "bg-line-soft text-ink-600 ring-line";
}

/** Sorts an audit entry for display. */
export function formatAuditTimestamp(iso: string): string {
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

/** The whole trail, newest first (`GET /api/auditlogs`). Admin only. */
export function fetchAuditLogs(signal?: AbortSignal): Promise<AuditLog[]> {
  return apiGet<AuditLog[]>("/api/auditlogs", signal);
}
