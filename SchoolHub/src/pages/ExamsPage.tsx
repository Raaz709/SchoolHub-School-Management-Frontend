import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  GraduationCap,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Trash2,
  Users,
} from "lucide-react";
import {
  addExamSubject,
  createExam,
  deleteExam,
  deleteExamSubject,
  fetchAcademicYears,
  fetchExam,
  fetchExams,
  fetchMarksRoster,
  fetchMyResults,
  fetchStudentResults,
  saveMarks,
  updateExam,
  type AcademicYear,
  type Exam,
  type ExamSubject,
  type RosterStudent,
  type TranscriptRow,
} from "../api/exams";
import { fetchClasses, fetchSubjects } from "../api/academic";
import { fetchParentChildren, type Child } from "../api/portals";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../context/useAuth";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";

/* ------------------------------ styling ------------------------------ */

const card = "rounded-2xl border border-line bg-white";
const label = "mb-1.5 block text-[12px] font-semibold text-ink-700";
const field =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100 disabled:bg-line-soft/40 disabled:text-ink-400";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-mint-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-mint-500 disabled:opacity-60";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-line-soft disabled:opacity-60";
const dangerBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60";

/** Only the day matters: a DATE column arrives with a midnight time part. */
function day(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "—";
}

function toneFor(passed: boolean): string {
  return passed
    ? "bg-mint-50 text-mint-700 ring-mint-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
}

function GradePill({ grade, passed }: { grade: string; passed: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 " +
        toneFor(passed)
      }
    >
      {grade}
    </span>
  );
}

export function ExamsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  // Staff build exams and mark them. Learners only ever read their own
  // transcript, and the API enforces that independently of what is rendered.
  if (role === "Student" || role === "Parent") return <MyResults role={role} />;
  return <ManageExams />;
}

/* ------------------------------ staff ------------------------------ */

type Notice = { tone: "ok" | "err"; text: string } | null;

function ManageExams() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  /** `"new"` opens the create form, an exam opens it on that row, null closes it. */
  const [editing, setEditing] = useState<Exam | "new" | null>(null);
  const [markingPaperId, setMarkingPaperId] = useState<number | null>(null);

  const exams = useAsync(useCallback((signal: AbortSignal) => fetchExams(signal), []));
  const rows = useMemo(() => exams.data ?? [], [exams.data]);

  /**
   * The exam in view. Derived rather than seeded, so deleting the selected exam
   * moves the selection instead of leaving a panel for a row that no longer
   * exists.
   */
  const examId =
    selectedExamId != null && rows.some((e) => e.Id === selectedExamId)
      ? selectedExamId
      : rows.length
        ? rows[0].Id
        : null;

  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle="Set up an exam, add its papers, then mark each class's roster in one save."
        action={
          <button onClick={() => setEditing("new")} className={ghostBtn}>
            <Plus className="h-4 w-4" />
            New exam
          </button>
        }
      />

      {notice && (
        <div
          className={
            "mb-4 rounded-xl border px-4 py-2.5 text-[12.5px] font-medium " +
            (notice.tone === "ok"
              ? "border-mint-200 bg-mint-50 text-mint-600"
              : "border-rose-200 bg-rose-50 text-rose-600")
          }
        >
          {notice.text}
        </div>
      )}

      {editing !== null && (
        <ExamForm
          exam={editing === "new" ? null : editing}
          onDone={(text) => {
            setNotice({ tone: "ok", text });
            setEditing(null);
            exams.refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <ExamList
        rows={rows}
        loading={exams.loading}
        error={exams.error && { message: exams.error.message, status: exams.status }}
        onRetry={exams.refetch}
        selectedId={examId}
        isAdmin={isAdmin}
        onSelect={setSelectedExamId}
        onEdit={(exam) => {
          setSelectedExamId(exam.Id);
          setEditing(exam);
        }}
        onDeleted={(text) => {
          setNotice({ tone: "ok", text });
          setSelectedExamId(null);
          exams.refetch();
        }}
        onFailed={(text) => setNotice({ tone: "err", text })}
      />

      {examId != null && (
        <ExamDetail
          examId={examId}
          markingPaperId={markingPaperId}
          onMarkPaper={setMarkingPaperId}
          onChanged={() => exams.refetch()}
          onNotice={setNotice}
        />
      )}
    </>
  );
}

/**
 * Create and edit share one form. The initial state comes from the exam being
 * edited, read once at mount: the form is only mounted while it is open, so an
 * effect to sync the fields would be a second source of truth for no gain.
 */
function ExamForm({
  exam,
  onDone,
  onCancel,
}: {
  exam: Exam | null;
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const isEdit = exam != null;
  const years = useAsync(useCallback((signal: AbortSignal) => fetchAcademicYears(signal), []));
  const [title, setTitle] = useState(exam?.Title ?? "");
  const [yearId, setYearId] = useState(exam?.AcademicYearId == null ? "" : String(exam.AcademicYearId));
  const [startDate, setStartDate] = useState(day(exam?.StartDate) === "—" ? "" : day(exam?.StartDate));
  const [endDate, setEndDate] = useState(day(exam?.EndDate) === "—" ? "" : day(exam?.EndDate));
  const [passingMarks, setPassingMarks] = useState(
    exam?.PassingMarks == null ? "40" : String(exam.PassingMarks),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearRows = useMemo(() => years.data ?? [], [years.data]);

  // Current year preferred, else the first offered. The picker uses ids: the
  // seed data has two years both named "2024-2025", so matching on the name
  // would submit whichever was created first.
  const effectiveYearId =
    yearId !== "" && yearRows.some((y) => String(y.Id) === yearId)
      ? yearId
      : String(yearRows.find((y) => y.IsCurrent)?.Id ?? yearRows[0]?.Id ?? "");

  async function submit() {
    setBusy(true);
    setError(null);
    // The same payload either way: an edit is a full replace of the exam's own
    // fields, and papers are left untouched by both calls.
    const payload = {
      Title: title.trim(),
      AcademicYearId: Number(effectiveYearId),
      StartDate: startDate || null,
      EndDate: endDate || null,
      PassingMarks: passingMarks === "" ? null : Number(passingMarks),
    };
    try {
      const result = exam == null ? await createExam(payload) : await updateExam(exam.Id, payload);
      onDone(result.Message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const ready = title.trim().length > 0 && effectiveYearId !== "" && !busy;

  return (
    <div className={`${card} mb-5 p-5`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className={label} htmlFor="ex-title">Title</label>
          <input
            id="ex-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mid-Term Exam"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="ex-year">Academic year</label>
          <select
            id="ex-year"
            value={effectiveYearId}
            onChange={(e) => setYearId(e.target.value)}
            className={field}
            disabled={years.loading || yearRows.length === 0}
          >
            {years.loading && <option value="">Loading years...</option>}
            {yearRows.map((y: AcademicYear) => (
              <option key={y.Id} value={y.Id}>
                {y.Name}
                {y.IsCurrent ? " (current)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="ex-start">Start date</label>
          <input id="ex-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ex-end">End date</label>
          <input id="ex-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="w-full sm:w-48">
          <label className={label} htmlFor="ex-pass">Pass mark (%)</label>
          <input
            id="ex-pass"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={passingMarks}
            onChange={(e) => setPassingMarks(e.target.value)}
            className={field}
          />
          <p className="mt-1.5 text-[11.5px] text-ink-400">
            Grades stay on the fixed bands; this is the pass/fail line.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
          <button onClick={() => void submit()} className={primaryBtn} disabled={!ready}>
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : isEdit ? "Save changes" : "Create exam"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] font-medium text-rose-600">
          {error}
        </div>
      )}
    </div>
  );
}

function ExamList({
  rows,
  loading,
  error,
  onRetry,
  selectedId,
  isAdmin,
  onSelect,
  onEdit,
  onDeleted,
  onFailed,
}: {
  rows: Exam[];
  loading: boolean;
  error: { message: string; status: number | null } | null;
  onRetry: () => void;
  selectedId: number | null;
  isAdmin: boolean;
  onSelect: (id: number) => void;
  onEdit: (exam: Exam) => void;
  onDeleted: (text: string) => void;
  onFailed: (text: string) => void;
}) {
  async function remove(exam: Exam) {
    try {
      const result = await deleteExam(exam.Id);
      onDeleted(result.Message);
    } catch (err) {
      // A refused delete is the expected path here, not a failure: the message
      // names the papers still attached.
      onFailed(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className={`${card} mb-5 overflow-hidden`}>
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
        <ScrollText className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
        Exams
        <span className="text-[12px] font-normal text-ink-500">
          {rows.length} total
        </span>
      </div>

      {error ? (
        <div className="p-5">
          <ErrorState message={error.message} status={error.status} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <FileText className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">No exams yet. Create one to add its papers.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((e: Exam) => (
            <li
              key={e.Id}
              className={
                "flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px] transition-colors " +
                (e.Id === selectedId ? "bg-mint-50/50" : "hover:bg-line-soft/40")
              }
            >
              <button
                onClick={() => onSelect(e.Id)}
                className="min-w-0 flex-1 text-left"
                aria-current={e.Id === selectedId}
              >
                <span className="font-semibold text-ink-900">{e.Title}</span>
                <span className="ml-2 text-[11.5px] text-ink-400">
                  {e.AcademicYearName ?? "No year"}
                </span>
                <span className="ml-3 text-[12px] text-ink-500">
                  {day(e.StartDate)} → {day(e.EndDate)}
                </span>
                <span className="ml-3 text-[12px] text-ink-500">pass {e.PassingMarks ?? 40}%</span>
              </button>

              <span className="flex items-center gap-3">
                {/* Zero papers is the state a new exam starts in, and it looks
                    nothing like a finished one, so it is called out. */}
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 " +
                    (e.SubjectCount === 0
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : "bg-line-soft text-ink-600 ring-line")
                  }
                >
                  {e.SubjectCount === 0 && <AlertTriangle className="h-3 w-3" strokeWidth={2.2} />}
                  {e.SubjectCount} paper{e.SubjectCount === 1 ? "" : "s"}
                  {e.ClassCount > 1 ? ` · ${e.ClassCount} classes` : ""}
                </span>
                <span className="text-[12px] text-ink-500">{e.MarkCount} marks</span>
                <button onClick={() => onEdit(e)} className={ghostBtn}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                {/* Admin only, matching the API: a teacher may not delete. */}
                {isAdmin && (
                  <button onClick={() => void remove(e)} className={dangerBtn}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExamDetail({
  examId,
  markingPaperId,
  onMarkPaper,
  onChanged,
  onNotice,
}: {
  examId: number;
  markingPaperId: number | null;
  onMarkPaper: (id: number | null) => void;
  onChanged: () => void;
  onNotice: (n: Notice) => void;
}) {
  const detail = useAsync(useCallback((signal: AbortSignal) => fetchExam(examId, signal), [examId]));
  const classes = useAsync(useCallback((signal: AbortSignal) => fetchClasses(signal), []));
  const subjects = useAsync(useCallback((signal: AbortSignal) => fetchSubjects(signal), []));

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const classRows = useMemo(() => classes.data ?? [], [classes.data]);
  const subjectRows = useMemo(() => subjects.data ?? [], [subjects.data]);

  async function addPaper() {
    setBusy(true);
    setFormError(null);
    try {
      const result = await addExamSubject(examId, {
        ClassId: Number(classId),
        SubjectId: Number(subjectId),
        MaxMarks: Number(maxMarks),
      });
      onNotice({ tone: "ok", text: result.Message });
      setClassId("");
      setSubjectId("");
      detail.refetch();
      onChanged();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function removePaper(paper: ExamSubject) {
    try {
      const result = await deleteExamSubject(examId, paper.Id);
      onNotice({ tone: "ok", text: result.Message });
      if (markingPaperId === paper.Id) onMarkPaper(null);
      detail.refetch();
      onChanged();
    } catch (err) {
      // Refused while marks exist: the message says how many.
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    }
  }

  if (detail.error) {
    return <ErrorState message={detail.error.message} status={detail.status} onRetry={detail.refetch} />;
  }
  if (detail.loading || !detail.data) {
    return (
      <div className={`${card} space-y-3 p-5`}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const { Exam: exam, Subjects: papers } = detail.data;
  const ready = classId !== "" && subjectId !== "" && Number(maxMarks) > 0 && !busy;

  return (
    <>
      {markingPaperId != null && (
        <MarkSheet
          examSubjectId={markingPaperId}
          onDone={(text) => {
            onNotice({ tone: "ok", text });
            onMarkPaper(null);
            detail.refetch();
            onChanged();
          }}
          onCancel={() => onMarkPaper(null)}
        />
      )}

      <div className={`${card} mb-5 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
            <FileText className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
            {exam.Title} · papers
            <span className="text-[12px] font-normal text-ink-500">
              {papers.length} total
            </span>
          </div>
        </div>

        {papers.length === 0 ? (
          <div className="grid place-items-center py-14 text-center">
            <Users className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
            <p className="text-[13px] text-ink-500">
              This exam has no papers yet, so there is nothing to mark.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {papers.map((p: ExamSubject) => (
              <li
                key={p.Id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px] text-ink-700"
              >
                <span className="min-w-0">
                  <span className="font-medium text-ink-900">{p.SubjectName ?? "Unknown subject"}</span>
                  {p.SubjectCode && <span className="ml-1.5 text-[11.5px] text-ink-400">{p.SubjectCode}</span>}
                  <span className="ml-3 text-[12px] text-ink-500">{p.ClassName}</span>
                  <span className="ml-3 text-[12px] text-ink-500">out of {p.MaxMarks}</span>
                  {p.ExamDate && (
                    <span className="ml-3 text-[12px] text-ink-500">{day(p.ExamDate)}</span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-[12px] text-ink-500">{p.MarkCount} marked</span>
                  <button onClick={() => onMarkPaper(p.Id)} className={ghostBtn}>
                    <Pencil className="h-3.5 w-3.5" />
                    {p.MarkCount > 0 ? "Re-mark" : "Mark"}
                  </button>
                  <button onClick={() => void removePaper(p)} className={dangerBtn}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-line bg-line-soft/30 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto] sm:items-end">
            <div>
              <label className={label} htmlFor="ex-paper-class">Class</label>
              <select
                id="ex-paper-class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className={field}
                disabled={classRows.length === 0}
              >
                <option value="">Select a class</option>
                {classRows.map((c) => (
                  <option key={c.Id} value={c.Id}>{c.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="ex-paper-subject">Subject</label>
              <select
                id="ex-paper-subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className={field}
                disabled={subjectRows.length === 0}
              >
                <option value="">Select a subject</option>
                {subjectRows.map((s) => (
                  <option key={s.Id} value={s.Id}>{s.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="ex-paper-max">Max marks</label>
              <input
                id="ex-paper-max"
                type="number"
                min={1}
                step="0.01"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className={field}
              />
            </div>
            <button onClick={() => void addPaper()} className={primaryBtn} disabled={!ready}>
              <Plus className="h-4 w-4" />
              {busy ? "Adding..." : "Add paper"}
            </button>
          </div>
          {formError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] font-medium text-rose-600">
              {formError}
            </div>
          )}
          <p className="mt-2.5 text-[11.5px] text-ink-400">
            A paper is one subject for one class, so one exam can cover several classes. Removing a
            paper is refused once any marks have been recorded against it.
          </p>
        </div>
      </div>
    </>
  );
}

/** Marks in progress, keyed by student. Stored marks stay in the roster response. */
type Draft = Record<number, { obtained: string; remarks: string }>;

function MarkSheet({
  examSubjectId,
  onDone,
  onCancel,
}: {
  examSubjectId: number;
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const roster = useAsync(
    useCallback((signal: AbortSignal) => fetchMarksRoster(examSubjectId, signal), [examSubjectId]),
  );
  const [overrides, setOverrides] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => roster.data?.Students ?? [], [roster.data]);

  /**
   * The marks on screen: what the API already holds, overlaid with what has been
   * typed since.
   *
   * Derived rather than seeded into state, so reopening a paper cannot carry the
   * previous one's numbers over, and there is no effect to fire after unmount.
   * Remarks come from the stored row too, because the save replaces them.
   */
  const draft = useMemo<Draft>(() => {
    const merged: Draft = {};
    for (const r of rows) {
      merged[r.StudentId] = {
        obtained: r.MarksObtained == null ? "" : String(r.MarksObtained),
        remarks: r.Remarks ?? "",
      };
    }
    return { ...merged, ...overrides };
  }, [rows, overrides]);

  const entered = useMemo(
    () => Object.values(draft).filter((d) => d.obtained.trim() !== "").length,
    [draft],
  );

  const meta = roster.data;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const items = Object.entries(draft)
        .filter(([, v]) => v.obtained.trim() !== "")
        .map(([studentId, v]) => ({
          StudentId: Number(studentId),
          MarksObtained: Number(v.obtained),
          Remarks: v.remarks,
        }));

      const result = await saveMarks(examSubjectId, items);
      onDone(`${result.Message} · ${result.Saved} student(s) recorded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${card} mb-5 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0 text-[13px] font-semibold text-ink-900">
          Marking {meta?.SubjectName ?? "paper"} · {meta?.ClassName ?? ""}
          {meta && (
            <span className="ml-2 text-[12px] font-normal text-ink-500">
              out of {meta.MaxMarks}, pass {meta.PassingPercentage}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
          <button onClick={() => void submit()} className={primaryBtn} disabled={busy || entered === 0}>
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : `Save marks (${entered})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-[12.5px] font-medium text-rose-600">
          {error}
        </div>
      )}

      {roster.error ? (
        <div className="p-5">
          <ErrorState message={roster.error.message} status={roster.status} onRetry={roster.refetch} />
        </div>
      ) : roster.loading || !meta ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <Users className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">
            No students are enrolled in {meta.ClassName}, so there is nobody to mark.
          </p>
        </div>
      ) : (
        <>
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[160px_140px_110px_1fr] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Student</span>
              <span>Marks</span>
              <span>Stored</span>
              <span>Remarks</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((r: RosterStudent) => {
                const value = draft[r.StudentId];
                const storedPct =
                  r.MarksObtained == null || meta.MaxMarks === 0
                    ? null
                    : (r.MarksObtained / meta.MaxMarks) * 100;
                return (
                  <li
                    key={r.StudentId}
                    className="grid grid-cols-[160px_140px_110px_1fr] items-center gap-4 px-5 py-2.5 text-[13px] text-ink-700"
                  >
                    <span className="truncate">
                      <span className="font-medium text-ink-900">{r.Username}</span>
                      <span className="ml-1.5 text-[11.5px] text-ink-400">{r.RollNumber}</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={meta.MaxMarks}
                      step="0.01"
                      value={value?.obtained ?? ""}
                      onChange={(e) =>
                        setOverrides((o) => ({
                          ...o,
                          [r.StudentId]: { obtained: e.target.value, remarks: o[r.StudentId]?.remarks ?? "" },
                        }))
                      }
                      placeholder={`0–${meta.MaxMarks}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
                    />
                    {r.Grade ? (
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink-900">{r.Grade}</span>
                        {storedPct != null && (
                          <span className="text-[11.5px] text-ink-400">{storedPct.toFixed(1)}%</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[11.5px] text-ink-400">—</span>
                    )}
                    <input
                      type="text"
                      value={value?.remarks ?? ""}
                      onChange={(e) =>
                        setOverrides((o) => ({
                          ...o,
                          [r.StudentId]: { obtained: o[r.StudentId]?.obtained ?? "", remarks: e.target.value },
                        }))
                      }
                      placeholder="Optional"
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-400">
            The whole roster saves in one request, so a paper is never left half-marked. Blank rows
            are skipped, and marks outside 0–{meta.MaxMarks} are rejected.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------ learners ------------------------------ */

/**
 * A Student or Parent's transcript.
 *
 * A parent may have several children, so they pick which one to view. Each id is
 * sent to an endpoint that re-checks the link server-side, so switching the
 * selector cannot reach an unlinked student.
 */
function MyResults({ role }: { role: string }) {
  const isParent = role === "Parent";
  const [pickedChildId, setPickedChildId] = useState<number | null>(null);

  const children = useAsync(
    useCallback(
      (signal: AbortSignal) => {
        if (!isParent) return Promise.resolve([] as Child[]);
        return fetchParentChildren(signal);
      },
      [isParent],
    ),
  );

  const childRows = useMemo(() => children.data ?? [], [children.data]);

  // The child in view: the one picked, else the first linked. Derived so a parent
  // lands on a transcript instead of an empty screen, and so a child who unlinks
  // cannot stay selected.
  const childId =
    pickedChildId != null && childRows.some((c) => c.StudentId === pickedChildId)
      ? pickedChildId
      : childRows.length
        ? childRows[0].StudentId
        : null;

  const mine = useAsync(
    useCallback(
      (signal: AbortSignal) => {
        if (isParent) {
          if (childId == null) return Promise.resolve([] as TranscriptRow[]);
          return fetchStudentResults(childId, signal);
        }
        return fetchMyResults(signal);
      },
      [isParent, childId],
    ),
  );

  const rows = useMemo(() => mine.data ?? [], [mine.data]);

  if (children.error) {
    return (
      <>
        <PageHeader title="Examinations" subtitle="Your results." />
        <ErrorState message={children.error.message} status={children.status} onRetry={children.refetch} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle={isParent ? "Your child's results." : "Your results."}
      />

      {isParent && (
        <div className={`${card} mb-5 p-5`}>
          <label className={label} htmlFor="ex-child">Child</label>
          <select
            id="ex-child"
            value={childId ?? ""}
            onChange={(e) => setPickedChildId(Number(e.target.value))}
            className={`${field} max-w-sm`}
            disabled={children.loading || childRows.length === 0}
          >
            {children.loading && <option value="">Loading children...</option>}
            {!children.loading && childRows.length === 0 && (
              <option value="">No children linked to this account</option>
            )}
            {childRows.map((c) => (
              <option key={c.StudentId} value={c.StudentId}>
                {c.StudentName}
                {c.ClassName ? ` · ${c.ClassName}${c.SectionName ? ` ${c.SectionName}` : ""}` : ""}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11.5px] text-ink-400">
            Only children linked to this account are listed, and the API checks the link again
            before returning anything.
          </p>
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        {mine.error ? (
          <div className="p-5">
            <ErrorState message={mine.error.message} status={mine.status} onRetry={mine.refetch} />
          </div>
        ) : mine.loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <GraduationCap className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
            <p className="text-[13px] text-ink-500">
              {isParent && childRows.length === 0
                ? "No children are linked to this account yet."
                : "No results have been recorded yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1fr_120px_150px_110px_110px] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                <span>Exam</span>
                <span>Subjects</span>
                <span>Score</span>
                <span>Percentage</span>
                <span>Result</span>
              </div>
              <ul className="divide-y divide-line">
                {rows.map((t: TranscriptRow) => (
                  <li
                    key={t.ExamId}
                    className="grid grid-cols-[1fr_120px_150px_110px_110px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700"
                  >
                    <span className="truncate font-medium text-ink-900">{t.ExamTitle}</span>
                    <span className="text-ink-500">
                      {t.PassedCount}/{t.SubjectCount} passed
                    </span>
                    <span className="text-ink-500">
                      {t.TotalObtained} / {t.TotalMax}
                    </span>
                    <span className="font-semibold text-ink-900">{t.OverallPercentage}%</span>
                    <span>
                      <GradePill grade={t.Passed ? "Pass" : "Fail"} passed={t.Passed} />
                      <span className="ml-1.5 text-[11px] text-ink-400">
                        at {t.PassingPercentage}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-400">
              {rows.length} exam{rows.length === 1 ? "" : "s"} · newest first. Each pass mark is the
              one set on that exam.
            </p>
          </>
        )}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-ink-400">
        <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />
        Subject-level marks for a single paper are on the class results page.
      </p>
    </>
  );
}
