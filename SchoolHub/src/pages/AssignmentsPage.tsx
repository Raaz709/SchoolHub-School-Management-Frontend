import { useCallback, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  GraduationCap,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { fetchSubjects, type Subject } from "../api/academic";
import {
  createAssignment,
  deleteAssignment,
  fetchAssignments,
  fetchSubmissions,
  formatDue,
  gradeSubmission,
  isOverdue,
  submitAssignment,
  toIsoInstant,
  toLocalInput,
  updateAssignment,
  type Assignment,
  type Submission,
} from "../api/assignments";
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

type Notice = { tone: "ok" | "err"; text: string } | null;

function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
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
  );
}

function DueBadge({ due }: { due: string }) {
  const overdue = isOverdue(due);
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 " + (overdue ? "text-rose-600" : "text-ink-500")
      }
    >
      <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />
      Due {formatDue(due)}
      {overdue && <span className="font-semibold">· overdue</span>}
    </span>
  );
}

/**
 * Assignment deadlines, submissions and grading. Staff see every assignment
 * and grade their own; learners only ever see the ones their class offers,
 * which the API scopes before the data leaves the server.
 */
export function AssignmentsPage() {
  const { user } = useAuth();
  return user?.role === "Student" ? <StudentAssignments /> : <StaffAssignments />;
}

/* ------------------------------ staff ------------------------------ */

function StaffAssignments() {
  const [notice, setNotice] = useState<Notice>(null);
  /** `"new"` opens the create form, a row opens it for editing, null closes. */
  const [editing, setEditing] = useState<Assignment | "new" | null>(null);

  const assignments = useAsync(useCallback((signal: AbortSignal) => fetchAssignments(signal), []));
  const subjects = useAsync(useCallback((signal: AbortSignal) => fetchSubjects(signal), []));
  const rows = useMemo(() => assignments.data ?? [], [assignments.data]);
  const subjectOptions = useMemo(() => subjects.data ?? [], [subjects.data]);

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Set work, track submissions and return scores to your classes."
        action={
          <button onClick={() => setEditing("new")} className={ghostBtn}>
            <Plus className="h-4 w-4" />
            New assignment
          </button>
        }
      />

      <NoticeBar notice={notice} />

      {editing !== null && (
        <AssignmentForm
          assignment={editing === "new" ? null : editing}
          subjects={subjectOptions}
          onDone={(text) => {
            setNotice({ tone: "ok", text });
            setEditing(null);
            assignments.refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className={`${card} mb-5 overflow-hidden`}>
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
          <ClipboardList className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
          All assignments
          <span className="text-[12px] font-normal text-ink-500">
            {rows.length} assignment{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        {assignments.error ? (
          <div className="p-5">
            <ErrorState
              message={assignments.error.message}
              status={assignments.status}
              onRetry={assignments.refetch}
            />
          </div>
        ) : assignments.loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <ClipboardList className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
            <p className="text-[13px] text-ink-500">No assignments have been set yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((assignment) => (
              <AssignmentRow
                key={assignment.Id}
                assignment={assignment}
                onNotice={setNotice}
                onEdit={setEditing}
                onChanged={() => assignments.refetch()}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function AssignmentForm({
  assignment,
  subjects,
  onDone,
  onCancel,
}: {
  assignment: Assignment | null;
  subjects: Subject[];
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const isEdit = assignment != null;
  const [title, setTitle] = useState(assignment?.Title ?? "");
  const [subjectId, setSubjectId] = useState<string>(
    assignment?.SubjectId != null ? String(assignment.SubjectId) : "",
  );
  const [description, setDescription] = useState(assignment?.Description ?? "");
  const [due, setDue] = useState(toLocalInput(assignment?.DueDate));
  const [maxScore, setMaxScore] = useState(
    assignment?.MaxScore != null ? String(assignment.MaxScore) : "100",
  );
  const [attachmentUrl, setAttachmentUrl] = useState(assignment?.AttachmentUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const payload = {
      SubjectId: Number(subjectId),
      Title: title.trim(),
      Description: description.trim() || null,
      DueDate: toIsoInstant(due),
      MaxScore: Number(maxScore),
      AttachmentUrl: attachmentUrl.trim() || null,
    };
    try {
      const result =
        assignment == null
          ? await createAssignment(payload)
          : await updateAssignment(assignment.Id, payload);
      onDone(result.Message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const ready =
    title.trim().length > 0 &&
    subjectId !== "" &&
    due !== "" &&
    Number(maxScore) > 0 &&
    !busy;

  return (
    <div className={`${card} mb-5 p-5`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="as-title">Title</label>
          <input
            id="as-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quadratic equations — worksheet 3"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="as-subject">Subject</label>
          <select
            id="as-subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={field}
          >
            <option value="">Choose a subject…</option>
            {subjects.map((s) => (
              <option key={s.Id} value={s.Id}>{s.Name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="as-due">Due date and time</label>
          <input
            id="as-due"
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="as-max">Max score</label>
          <input
            id="as-max"
            type="number"
            min={1}
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className={field}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={label} htmlFor="as-attachment">Attachment URL</label>
          <input
            id="as-attachment"
            type="url"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="https://… (optional)"
            className={field}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={label} htmlFor="as-desc">Instructions</label>
          <textarea
            id="as-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details for learners."
            className={field}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5">
        <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
        <button onClick={() => void submit()} className={primaryBtn} disabled={!ready}>
          <Save className="h-4 w-4" />
          {busy ? "Saving..." : isEdit ? "Save changes" : "Create assignment"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] font-medium text-rose-600">
          {error}
        </div>
      )}
    </div>
  );
}

function AssignmentRow({
  assignment,
  onNotice,
  onEdit,
  onChanged,
}: {
  assignment: Assignment;
  onNotice: (n: Notice) => void;
  onEdit: (assignment: Assignment) => void;
  onChanged: () => void;
}) {
  const [showSubmissions, setShowSubmissions] = useState(false);

  async function remove() {
    try {
      const result = await deleteAssignment(assignment.Id);
      onNotice({ tone: "ok", text: result.Message });
      onChanged();
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[14px] font-semibold text-ink-900">{assignment.Title}</span>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.8} />
              {assignment.SubjectName}
            </span>
            {assignment.TeacherName && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" strokeWidth={1.8} />
                {assignment.TeacherName}
              </span>
            )}
            <DueBadge due={assignment.DueDate} />
            {assignment.MaxScore != null && <span>Max {assignment.MaxScore}</span>}
            <button
              onClick={() => setShowSubmissions((v) => !v)}
              className="inline-flex items-center gap-1.5 font-medium text-mint-700 hover:underline"
            >
              <BookOpenCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
              {assignment.SubmissionCount} submission{assignment.SubmissionCount === 1 ? "" : "s"}
              {showSubmissions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
          {assignment.Description && (
            <p className="mt-1.5 text-[12.5px] text-ink-600">{assignment.Description}</p>
          )}
          {assignment.AttachmentUrl && (
            <a
              href={assignment.AttachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-mint-700 hover:underline"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
              Attachment
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(assignment)} className={ghostBtn}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button onClick={() => void remove()} className={dangerBtn}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {showSubmissions && (
        <SubmissionsPanel
          assignmentId={assignment.Id}
          maxScore={assignment.MaxScore}
          onNotice={onNotice}
          onChanged={onChanged}
        />
      )}
    </li>
  );
}

/* ------------------------------ grading ------------------------------ */

function SubmissionsPanel({
  assignmentId,
  maxScore,
  onNotice,
  onChanged,
}: {
  assignmentId: number;
  maxScore: number | null;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
}) {
  const submissions = useAsync(
    useCallback((signal: AbortSignal) => fetchSubmissions(assignmentId, signal), [assignmentId]),
  );
  const rows = useMemo(() => submissions.data ?? [], [submissions.data]);

  return (
    <div className="mt-3 rounded-xl border border-line bg-line-soft/30 p-3">
      {submissions.error ? (
        <ErrorState
          message={submissions.error.message}
          status={submissions.status}
          onRetry={submissions.refetch}
        />
      ) : submissions.loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-2 text-center text-[12.5px] text-ink-500">
          No submissions for this assignment yet.
        </p>
      ) : (
        <ul className="divide-y divide-line/60">
          {rows.map((submission) => (
            <GradeRow
              key={submission.Id}
              submission={submission}
              maxScore={maxScore}
              onNotice={onNotice}
              onChanged={() => {
                submissions.refetch();
                onChanged();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function GradeRow({
  submission,
  maxScore,
  onNotice,
  onChanged,
}: {
  submission: Submission;
  maxScore: number | null;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
}) {
  const [score, setScore] = useState(submission.Score != null ? String(submission.Score) : "");
  const [feedback, setFeedback] = useState(submission.Feedback ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      // An empty score clears the grade; the API accepts a null here.
      const value = score.trim() === "" ? null : Number(score);
      const result = await gradeSubmission(submission.Id, value, feedback.trim() || null);
      onNotice({ tone: "ok", text: result.Message });
      onChanged();
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5 text-[12.5px]">
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-ink-900">{submission.StudentName}</span>
        {submission.RollNumber && (
          <span className="ml-2 text-ink-500">Roll {submission.RollNumber}</span>
        )}
        <div className="mt-0.5 text-ink-500">Submitted {formatDue(submission.SubmittedAt)}</div>
        {submission.FilePath && (
          <a
            href={submission.FilePath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-mint-700 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
            Open work
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={maxScore ?? undefined}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Score"
          className="w-20 rounded-xl border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        />
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback"
          className="w-40 rounded-xl border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        />
        <button onClick={() => void save()} disabled={busy} className={ghostBtn}>
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
    </li>
  );
}

/* ------------------------------ student ------------------------------ */

function StudentAssignments() {
  const [notice, setNotice] = useState<Notice>(null);
  const assignments = useAsync(useCallback((signal: AbortSignal) => fetchAssignments(signal), []));
  const rows = useMemo(() => assignments.data ?? [], [assignments.data]);

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Work set by your teachers. Submit a link to your file before the deadline."
      />

      <NoticeBar notice={notice} />

      {assignments.error ? (
        <div className={`${card} p-5`}>
          <ErrorState
            message={assignments.error.message}
            status={assignments.status}
            onRetry={assignments.refetch}
          />
        </div>
      ) : assignments.loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className={`${card} grid place-items-center py-16 text-center`}>
          <BookOpenCheck className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">No assignments have been set for your class.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((assignment) => (
            <StudentCard
              key={assignment.Id}
              assignment={assignment}
              onNotice={setNotice}
              onChanged={() => assignments.refetch()}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function StudentCard({
  assignment,
  onNotice,
  onChanged,
}: {
  assignment: Assignment;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
}) {
  const [filePath, setFilePath] = useState(assignment.MyFilePath ?? "");
  const [busy, setBusy] = useState(false);

  const submitted = assignment.MySubmissionId != null;
  const graded = assignment.MyScore != null;

  async function submit() {
    setBusy(true);
    try {
      const result = await submitAssignment(assignment.Id, filePath.trim());
      onNotice({ tone: "ok", text: result.Message });
      onChanged();
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[14px] font-semibold text-ink-900">{assignment.Title}</span>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.8} />
              {assignment.SubjectName}
            </span>
            {assignment.TeacherName && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" strokeWidth={1.8} />
                {assignment.TeacherName}
              </span>
            )}
            <DueBadge due={assignment.DueDate} />
            {assignment.MaxScore != null && <span>Max {assignment.MaxScore}</span>}
          </div>
          {assignment.Description && (
            <p className="mt-1.5 text-[12.5px] text-ink-600">{assignment.Description}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 " +
              (submitted
                ? "bg-mint-50 text-mint-700 ring-mint-200"
                : "bg-line-soft text-ink-600 ring-line")
            }
          >
            {submitted ? "Submitted" : "Not submitted"}
          </span>
          {graded && (
            <span className="text-[12.5px] font-semibold text-ink-900">
              Score {assignment.MyScore}
              {assignment.MaxScore != null ? ` / ${assignment.MaxScore}` : ""}
            </span>
          )}
        </div>
      </div>

      {assignment.AttachmentUrl && (
        <a
          href={assignment.AttachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-mint-700 hover:underline"
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
          Teacher's attachment
        </a>
      )}

      {submitted && (
        <p className="mt-2 text-[12px] text-ink-500">
          Last submitted {assignment.MySubmittedAt ? formatDue(assignment.MySubmittedAt) : ""}
        </p>
      )}

      {graded && assignment.MyFeedback && (
        <p className="mt-1 rounded-xl border border-line bg-line-soft/40 px-3 py-2 text-[12.5px] text-ink-700">
          <span className="font-semibold text-ink-900">Feedback: </span>
          {assignment.MyFeedback}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <label className="sr-only" htmlFor={`as-submit-${assignment.Id}`}>File link</label>
        <input
          id={`as-submit-${assignment.Id}`}
          type="url"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="https://… link to your work"
          className={`${field} max-w-md flex-1`}
        />
        <button
          onClick={() => void submit()}
          disabled={busy || filePath.trim() === ""}
          className={primaryBtn}
        >
          <Upload className="h-4 w-4" />
          {busy ? "Submitting..." : submitted ? "Update submission" : "Submit"}
        </button>
      </div>
    </li>
  );
}
