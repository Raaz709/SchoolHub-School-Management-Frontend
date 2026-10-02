import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

export type Exam = {
  Id: number;
  Title: string;
  AcademicYearId: number | null;
  /** `yyyy-mm-ddT00:00:00`: a DATE column still carries a midnight time part. */
  StartDate: string | null;
  EndDate: string | null;
  /** Pass threshold as a percentage. Stored since forever, previously never read. */
  PassingMarks: number | null;
  AcademicYearName: string | null;
  /** Distinct classes across the exam's papers: an exam may span several grades. */
  ClassCount: number;
  /** A freshly created exam has none, which is not the same as a finished one. */
  SubjectCount: number;
  MarkCount: number;
};

export type ExamSubject = {
  Id: number;
  ExamId: number;
  ClassId: number;
  SubjectId: number | null;
  MaxMarks: number;
  ExamDate: string | null;
  ClassName: string;
  SubjectName: string | null;
  SubjectCode: string | null;
  MarkCount: number;
};

export type ExamDetail = { Exam: Exam; Subjects: ExamSubject[] };

export type RosterStudent = {
  StudentId: number;
  RollNumber: string;
  Username: string;
  MarkId: number | null;
  /** Null until marked. Never defaulted to 0, which would read as a real fail. */
  MarksObtained: number | null;
  Grade: string | null;
  Remarks: string | null;
};

export type MarksRoster = {
  ExamSubjectId: number;
  ExamId: number;
  ExamTitle: string;
  ClassId: number;
  ClassName: string;
  SubjectId: number | null;
  SubjectName: string | null;
  MaxMarks: number;
  PassingPercentage: number;
  ExamDate: string | null;
  Students: RosterStudent[];
};

/** One exam's result for a student, rolled up by the server. */
export type TranscriptRow = {
  ExamId: number;
  ExamTitle: string | null;
  PassingPercentage: number;
  SubjectCount: number;
  PassedCount: number;
  TotalObtained: number;
  TotalMax: number;
  OverallPercentage: number;
  Passed: boolean;
};

/** What the server graded, echoed back so the screen can show the same verdict. */
export type MarkResult = {
  StudentId: number;
  MarksObtained: number;
  MaxMarks: number;
  Percentage: number;
  Grade: string;
  Passed: boolean;
};

export type SaveMarksResult = {
  Message: string;
  ExamSubjectId: number;
  Saved: number;
  Marks: MarkResult[];
};

export type SaveExamPayload = {
  Title: string;
  AcademicYearId: number;
  StartDate?: string | null;
  EndDate?: string | null;
  PassingMarks?: number | null;
};

export type SaveExamSubjectPayload = {
  ClassId: number;
  SubjectId: number;
  MaxMarks: number;
  ExamDate?: string | null;
};

export type MarkItem = { StudentId: number; MarksObtained: number; Remarks: string };

/* ------------------------------- read ------------------------------- */

export type AcademicYear = {
  Id: number;
  Name: string;
  StartDate: string | null;
  EndDate: string | null;
  IsCurrent: boolean;
};

/**
 * Academic years, for the exam form's year picker.
 *
 * Ids rather than names: the seed data holds two years both called "2024-2025",
 * so a name-keyed picker would silently offer the wrong one.
 */
export function fetchAcademicYears(signal?: AbortSignal): Promise<AcademicYear[]> {
  return apiGet<AcademicYear[]>("/api/schoolextensions/academic-years", signal);
}

/** Newest first, with class coverage and marking progress. Parent is not allowed. */
export function fetchExams(signal?: AbortSignal): Promise<Exam[]> {
  return apiGet<Exam[]>("/api/exams", signal);
}

export function fetchExam(id: number, signal?: AbortSignal): Promise<ExamDetail> {
  return apiGet<ExamDetail>(`/api/exams/${id}`, signal);
}

/** The paper's class roster, with stored marks attached for re-marking. */
export function fetchMarksRoster(examSubjectId: number, signal?: AbortSignal): Promise<MarksRoster> {
  return apiGet<MarksRoster>(`/api/exams/subjects/${examSubjectId}/roster`, signal);
}

/**
 * The caller's own transcript.
 *
 * Resolved from the token rather than passed in: nothing exposed a student's own
 * `Students.Id`, so the page had no id to build a by-id request from.
 */
export function fetchMyResults(signal?: AbortSignal): Promise<TranscriptRow[]> {
  return apiGet<TranscriptRow[]>("/api/exams/mine", signal);
}

/** The API re-checks the parent link server-side, so a swapped id returns 403. */
export function fetchStudentResults(studentId: number, signal?: AbortSignal): Promise<TranscriptRow[]> {
  return apiGet<TranscriptRow[]>(`/api/exams/student/${studentId}`, signal);
}

/* ------------------------------ writes ------------------------------ */

export function createExam(payload: SaveExamPayload): Promise<{ Message: string; ExamId: number }> {
  return apiPost("/api/exams", payload);
}

/** Papers are left alone: renaming an exam does not change which papers it holds. */
export function updateExam(
  id: number,
  payload: SaveExamPayload,
): Promise<{ Message: string; ExamId: number }> {
  return apiPut(`/api/exams/${id}`, payload);
}

/** Admin only. Refuses with 409 while the exam still holds papers. */
export function deleteExam(id: number): Promise<{ Message: string }> {
  return apiDelete(`/api/exams/${id}`);
}

/** One subject, for one class, out of one exam. */
export function addExamSubject(
  examId: number,
  payload: SaveExamSubjectPayload,
): Promise<{ Message: string; ExamSubjectId: number }> {
  return apiPost(`/api/exams/${examId}/subjects`, payload);
}

/** Refuses with 409 once any mark has been recorded against the paper. */
export function deleteExamSubject(
  examId: number,
  examSubjectId: number,
): Promise<{ Message: string }> {
  return apiDelete(`/api/exams/${examId}/subjects/${examSubjectId}`);
}

/**
 * Saves a paper's whole roster at once.
 *
 * One request rather than one per student: the server applies them in a single
 * transaction, so a teacher cannot stop halfway and leave a paper that looks
 * finished in the list. Marks are upserted, so re-saving corrects in place.
 */
export function saveMarks(
  examSubjectId: number,
  marks: MarkItem[],
): Promise<SaveMarksResult> {
  return apiPut(`/api/exams/subjects/${examSubjectId}/marks`, { Marks: marks });
}
