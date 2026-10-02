import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

/**
 * One assignment. The learner-only fields (`MySubmissionId` …) are null for
 * staff, whose rows fill `SubmissionCount` instead.
 */
export type Assignment = {
  Id: number;
  SubjectId: number;
  SubjectName: string;
  Title: string;
  Description: string | null;
  /** Timestamptz: an ISO-8601 instant. */
  DueDate: string;
  MaxScore: number | null;
  AttachmentUrl: string | null;
  TeacherName: string | null;
  SubmissionCount: number;
  MySubmissionId: number | null;
  MySubmittedAt: string | null;
  MyScore: number | null;
  MyFeedback: string | null;
  MyFilePath: string | null;
};

export type Submission = {
  Id: number;
  StudentId: number;
  StudentName: string;
  RollNumber: string | null;
  FilePath: string | null;
  SubmittedAt: string;
  Score: number | null;
  Feedback: string | null;
};

export type SaveAssignmentPayload = {
  SubjectId: number;
  Title: string;
  Description?: string | null;
  DueDate: string;
  MaxScore: number;
  AttachmentUrl?: string | null;
};

/* ------------------------------- formatting ------------------------------- */

export function formatDue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `datetime-local` value → a UTC instant the API stores against a timestamptz. */
export function toIsoInstant(localValue: string): string {
  return new Date(localValue).toISOString();
}

/** A stored instant → the `datetime-local` control's expected `YYYY-MM-DDTHH:mm`. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isOverdue(iso: string): boolean {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

/* ------------------------------- reads ------------------------------- */

export function fetchAssignments(signal?: AbortSignal): Promise<Assignment[]> {
  return apiGet<Assignment[]>("/api/assignments", signal);
}

export function fetchAssignment(id: number, signal?: AbortSignal): Promise<Assignment> {
  return apiGet<Assignment>(`/api/assignments/${id}`, signal);
}

export function fetchSubmissions(id: number, signal?: AbortSignal): Promise<Submission[]> {
  return apiGet<Submission[]>(`/api/assignments/${id}/submissions`, signal);
}

/* ------------------------------- staff writes ------------------------------- */

export function createAssignment(
  payload: SaveAssignmentPayload,
): Promise<{ Message: string; AssignmentId: number }> {
  return apiPost("/api/assignments", payload);
}

/** A teacher may only edit their own; an Admin may edit any. */
export function updateAssignment(
  id: number,
  payload: SaveAssignmentPayload,
): Promise<{ Message: string }> {
  return apiPut(`/api/assignments/${id}`, payload);
}

export function deleteAssignment(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/assignments/${id}`);
}

/** Set or clear a submission's score and feedback. */
export function gradeSubmission(
  submissionId: number,
  score: number | null,
  feedback: string | null,
): Promise<{ Message: string }> {
  return apiPut(`/api/assignments/submissions/${submissionId}`, { Score: score, Feedback: feedback });
}

/* ------------------------------- student write ------------------------------- */

/** A second call replaces the learner's previous submission. */
export function submitAssignment(
  assignmentId: number,
  filePath: string,
): Promise<{ Message: string; SubmissionId: number }> {
  return apiPost("/api/assignments/submit", { AssignmentId: assignmentId, FilePath: filePath });
}
