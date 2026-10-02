import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

/**
 * A chargeable fee, optionally tied to one class. `AssignedCount` is how many
 * students currently owe it: the screen shows it because a structure with
 * assignments cannot be deleted or have its amount changed.
 */
export type FeeStructure = {
  Id: number;
  Name: string;
  Amount: number;
  /** Null means the fee applies school-wide. */
  ClassId: number | null;
  ClassName: string | null;
  AssignedCount: number;
};

export type FeeStatus = "Paid" | "Partial" | "Overdue" | "Unpaid";

/**
 * One fee a student owes, with paid and outstanding derived by the server from
 * the payments behind it. There is no stored status to trust instead.
 */
export type Assignment = {
  Id: number;
  StudentId: number;
  StudentName: string;
  AdmissionNumber: string | null;
  ClassId: number | null;
  ClassName: string | null;
  FeeStructureId: number;
  FeeName: string;
  Amount: number;
  /** `yyyy-mm-ddT00:00:00`: a DATE column still carries a midnight time part. */
  DueDate: string;
  Paid: number;
  Outstanding: number;
  Status: FeeStatus;
};

export type Payment = {
  Id: number;
  StudentFeeId: number;
  StudentId: number;
  StudentName: string;
  AdmissionNumber: string | null;
  FeeName: string;
  Amount: number;
  AmountPaid: number;
  PaymentDate: string;
  PaymentMethod: string | null;
  TransactionReference: string | null;
};

export type CollectionSummary = {
  TotalBilled: number;
  TotalCollected: number;
  TotalOutstanding: number;
  TotalOverdue: number;
  StudentCount: number;
};

export type AssignmentFilters = {
  classId?: number | null;
  status?: string | null;
  search?: string | null;
};

export type SaveFeeStructurePayload = {
  Name: string;
  Amount: number;
  ClassId?: number | null;
};

export type AssignFeePayload = {
  FeeStructureId: number;
  /** Exactly one of StudentId or ClassId is set. */
  StudentId?: number | null;
  ClassId?: number | null;
  DueDate: string;
};

export type RecordPaymentPayload = {
  StudentFeeId: number;
  AmountPaid: number;
  PaymentMethod: string;
  TransactionReference?: string;
};

/** The payment methods the API accepts, echoed here so the picker cannot drift. */
export const PAYMENT_METHODS = [
  "Cash",
  "Card",
  "Bank Transfer",
  "Cheque",
  "Mobile Money",
] as const;

/* ------------------------------- reads ------------------------------- */

export function fetchFeeStructures(signal?: AbortSignal): Promise<FeeStructure[]> {
  return apiGet<FeeStructure[]>("/api/fees/structures", signal);
}

export function fetchAssignments(
  filters: AssignmentFilters = {},
  signal?: AbortSignal,
): Promise<Assignment[]> {
  const q = new URLSearchParams();
  if (filters.classId) q.set("classId", String(filters.classId));
  if (filters.status) q.set("status", filters.status);
  if (filters.search) q.set("search", filters.search);
  const qs = q.toString();
  return apiGet<Assignment[]>(`/api/fees/assignments${qs ? `?${qs}` : ""}`, signal);
}

export function fetchPayments(studentId?: number | null, signal?: AbortSignal): Promise<Payment[]> {
  const qs = studentId ? `?studentId=${studentId}` : "";
  return apiGet<Payment[]>(`/api/fees/payments${qs}`, signal);
}

export function fetchCollectionSummary(signal?: AbortSignal): Promise<CollectionSummary> {
  return apiGet<CollectionSummary>("/api/fees/summary", signal);
}

/* ------------------------------- writes ------------------------------- */

export function createFeeStructure(
  payload: SaveFeeStructurePayload,
): Promise<{ Message: string; FeeStructureId: number }> {
  return apiPost("/api/fees/structures", payload);
}

/** Refused with 409 when the amount changes on a fee students already owe. */
export function updateFeeStructure(
  id: number,
  payload: SaveFeeStructurePayload,
): Promise<{ Message: string; FeeStructureId: number }> {
  return apiPut(`/api/fees/structures/${id}`, payload);
}

/** Refused with 409 while any student still has it assigned. */
export function deleteFeeStructure(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/fees/structures/${id}`);
}

export function assignFee(
  payload: AssignFeePayload,
): Promise<{ Message: string; Assigned: number; Skipped: number }> {
  return apiPost("/api/fees/assignments", payload);
}

/** Refused with 409 once any money has been collected against it. */
export function removeAssignment(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/fees/assignments/${id}`);
}

export function recordPayment(
  payload: RecordPaymentPayload,
): Promise<{ Message: string; PaymentId: number; Paid: number; Outstanding: number }> {
  return apiPost("/api/fees/payments", payload);
}
