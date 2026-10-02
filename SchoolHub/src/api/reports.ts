import { apiGet } from "../lib/api";

/**
 * One row of the enrolment report, per class and section.
 *
 * `SectionName` is null for a class that has no sections yet, so the row is
 * still reported rather than silently dropped by the query.
 */
export type StudentsByClassRow = {
  ClassName: string;
  SectionName: string | null;
  StudentCount: number;
};

/** Mirrors the fee status the server derives; nothing here is stored. */
export type ReportFeeStatus = "Paid" | "Partial" | "Overdue" | "Unpaid";

/**
 * Billed, collected and outstanding money grouped by the status the server
 * derives, in the same precedence as the fee ledger itself. Only the four
 * statuses can appear.
 */
export type FeeCollectionRow = {
  Status: ReportFeeStatus;
  FeeCount: number;
  TotalAmount: number;
  TotalPaid: number;
  TotalOutstanding: number;
};

/* ------------------------------- reads ------------------------------- */

/** Enrolment headcount per class and section (`GET /api/reports/students-by-class`). */
export function fetchStudentsByClass(signal?: AbortSignal): Promise<StudentsByClassRow[]> {
  return apiGet<StudentsByClassRow[]>("/api/reports/students-by-class", signal);
}

/** Fee collection grouped by derived status (`GET /api/reports/fee-collection`). */
export function fetchFeeCollection(signal?: AbortSignal): Promise<FeeCollectionRow[]> {
  return apiGet<FeeCollectionRow[]>("/api/reports/fee-collection", signal);
}
