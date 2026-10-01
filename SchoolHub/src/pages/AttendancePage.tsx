import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardCheck,
  History,
  Pencil,
  Save,
  Users,
} from "lucide-react";
import {
  fetchMyAttendance,
  fetchRoster,
  fetchSession,
  fetchSessions,
  fetchStudentAttendance,
  markSession,
  updateSession,
  STATUSES,
  statusTone,
  type AttendanceStatus,
  type RosterStudent,
  type SessionSummary,
  type StatusTone,
} from "../api/attendance";
import { fetchClasses, fetchSections } from "../api/academic";
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

const TONES: Record<StatusTone, string> = {
  ok: "bg-mint-50 text-mint-700 ring-mint-200",
  warn: "bg-amber-50 text-amber-700 ring-amber-200",
  bad: "bg-rose-50 text-rose-700 ring-rose-200",
  muted: "bg-line-soft text-ink-600 ring-line",
};

function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 " + TONES[tone]
      }
    >
      {status}
    </span>
  );
}

/** Today as `yyyy-mm-dd`, matching the API's date-only input. */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function AttendancePage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  // Staff mark attendance per section. Learners only ever read their own
  // records, and the API enforces that independently of what is rendered here.
  if (role === "Student" || role === "Parent") return <MyAttendance role={role} />;
  return <MarkAttendance />;
}

/* ------------------------------ staff ------------------------------ */

type Mode = { kind: "mark" } | { kind: "edit"; sessionId: number };

function MarkAttendance() {
  const [mode, setMode] = useState<Mode>({ kind: "mark" });
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Mark a section for a day, or reopen a past one to correct it."
        action={
          mode.kind === "edit" ? (
            <button onClick={() => setMode({ kind: "mark" })} className={ghostBtn}>
              <Check className="h-4 w-4" />
              Done editing
            </button>
          ) : null
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

      {mode.kind === "edit" ? (
        <EditSession
          sessionId={mode.sessionId}
          onDone={(text) => {
            setNotice({ tone: "ok", text });
            setMode({ kind: "mark" });
          }}
          onCancel={() => setMode({ kind: "mark" })}
          onError={(text) => setNotice({ tone: "err", text })}
        />
      ) : (
        <MarkNew onEditExisting={(id) => setMode({ kind: "edit", sessionId: id })} />
      )}
    </>
  );
}

function MarkNew({ onEditExisting }: { onEditExisting: (id: number) => void }) {
  const [classId, setClassId] = useState("");
  const [pickedSectionId, setPickedSectionId] = useState("");
  const [date, setDate] = useState(today());

  const classes = useAsync(useCallback((signal: AbortSignal) => fetchClasses(signal), []));
  const sections = useAsync(useCallback((signal: AbortSignal) => fetchSections(signal), []));

  const classRows = useMemo(() => classes.data ?? [], [classes.data]);
  const sectionRows = useMemo(() => sections.data ?? [], [sections.data]);

  // Filtered by class rather than paired by name: a class and a section can
  // share a name, and matching on it silently picked the wrong one.
  const sectionsForClass = useMemo(
    () => sectionRows.filter((s) => String(s.ClassId) === classId),
    [sectionRows, classId],
  );

  // The section in force, derived from the stored choice. Changing class drops a
  // selection that no longer belongs to it without an effect having to repair
  // it, which would cascade a render on every keystroke.
  const sectionId = sectionsForClass.some((s) => String(s.Id) === pickedSectionId)
    ? pickedSectionId
    : sectionsForClass.length
      ? String(sectionsForClass[0].Id)
      : "";

  if (classes.error || sections.error) {
    return (
      <ErrorState
        message={(classes.error ?? sections.error)!.message}
        status={classes.status ?? sections.status}
        onRetry={() => {
          classes.refetch();
          sections.refetch();
        }}
      />
    );
  }

  const ready = classId && sectionId && date && !classes.loading && !sections.loading;

  return (
    <>
      <div className={`${card} mb-5 p-5`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="att-class">Class</label>
            <select
              id="att-class"
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
            <label className={label} htmlFor="att-section">Section</label>
            <select
              id="att-section"
              value={sectionId}
              onChange={(e) => setPickedSectionId(e.target.value)}
              className={field}
              disabled={!classId || sectionsForClass.length === 0}
            >
              {!classId && <option value="">Select a class first</option>}
              {classId && sectionsForClass.length === 0 && (
                <option value="">No sections in this class</option>
              )}
              {sectionsForClass.map((s) => (
                <option key={s.Id} value={s.Id}>{s.Name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="att-date">Date</label>
            <input
              id="att-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={field}
            />
          </div>
        </div>
      </div>

      {ready && classId && sectionId ? (
        <MarkGrid
          classId={Number(classId)}
          sectionId={Number(sectionId)}
          date={date}
          onMarked={onEditExisting}
        />
      ) : (
        <div className={`${card} p-5`}>
          <p className="text-[12.5px] text-ink-400">
            {classes.loading || sections.loading
              ? "Loading classes and sections..."
              : "Choose a class and section to load its roster."}
          </p>
        </div>
      )}

      <SessionHistory onEdit={onEditExisting} />
    </>
  );
}

type Draft = Record<number, { status: AttendanceStatus; remarks: string }>;

function MarkGrid({
  classId,
  sectionId,
  date,
  onMarked,
}: {
  classId: number;
  sectionId: number;
  date: string;
  onMarked: (id: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roster = useAsync(
    useCallback(
      (signal: AbortSignal) => fetchRoster(classId, sectionId, date, signal),
      [classId, sectionId, date],
    ),
  );

  /**
   * Only the teacher's changes live here, keyed by student. The stored marks
   * come from the roster response instead of being copied into state, which is
   * what keeps a section or date change from reusing the last one's picks.
   */
  const [overrides, setOverrides] = useState<Draft>({});

  const rows = useMemo(() => roster.data?.Students ?? [], [roster.data]);

  /**
   * The marks in progress: what the API already holds, overlaid with what the
   * teacher has changed since.
   *
   * Derived rather than seeded into state, so switching section or date cannot
   * leave the previous day's choices on screen or submit them under the new one.
   */
  const draft = useMemo<Draft>(() => {
    const merged: Draft = {};
    for (const r of rows) {
      merged[r.StudentId] = {
        status: (
          STATUSES.includes(r.Status as AttendanceStatus) ? r.Status : "Present"
        ) as AttendanceStatus,
        remarks: r.Remarks ?? "",
      };
    }
    return { ...merged, ...overrides };
  }, [rows, overrides]);

  const chosen = useMemo(() => Object.keys(draft).length, [draft]);

  function setStatus(studentId: number, status: AttendanceStatus) {
    setOverrides((o) => ({ ...o, [studentId]: { status, remarks: o[studentId]?.remarks ?? "" } }));
  }

  function setRemarks(studentId: number, remarks: string) {
    setOverrides((o) => ({
      ...o,
      [studentId]: { status: o[studentId]?.status ?? "Present", remarks },
    }));
  }

  /** Fills every student at once, for the common all-present case. */
  function markAll(status: AttendanceStatus) {
    setOverrides(
      Object.fromEntries(
        rows.map((r) => [r.StudentId, { status, remarks: overrides[r.StudentId]?.remarks ?? "" }]),
      ),
    );
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await markSession({
        ClassId: classId,
        SectionId: sectionId,
        Date: date,
        Records: Object.entries(draft).map(([studentId, value]) => ({
          StudentId: Number(studentId),
          Status: value.status,
          Remarks: value.remarks,
        })),
      });
      onMarked(result.SessionId);
      roster.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${card} mb-5 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          <Users className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
          Roster
          <span className="text-[12px] font-normal text-ink-500">
            {rows.length} student{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUSES.filter((s) => s === "Present" || s === "Absent").map((s) => (
            <button key={s} onClick={() => markAll(s)} className={ghostBtn} disabled={busy || rows.length === 0}>
              All {s.toLowerCase()}
            </button>
          ))}
          <button onClick={() => void submit()} disabled={busy || chosen === 0} className={primaryBtn}>
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : "Save attendance"}
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
      ) : roster.loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <Users className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">No students are enrolled in this section.</p>
        </div>
      ) : (
        <>
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[120px_1fr_240px] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Student</span>
              <span>Status</span>
              <span>Remarks</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((r: RosterStudent) => {
                const value = draft[r.StudentId];
                return (
                  <li
                    key={r.StudentId}
                    className="grid grid-cols-[120px_1fr_240px] items-center gap-4 px-5 py-2.5 text-[13px] text-ink-700"
                  >
                    <span className="truncate">
                      <span className="font-medium text-ink-900">{r.Username}</span>
                      <span className="ml-1.5 text-[11.5px] text-ink-400">{r.RollNumber}</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(r.StudentId, s)}
                          aria-pressed={value?.status === s}
                          className={
                            "rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 transition-colors " +
                            (value?.status === s
                              ? TONES[statusTone(s)] + " ring-2"
                              : "bg-white text-ink-500 ring-line hover:bg-line-soft")
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={value?.remarks ?? ""}
                      onChange={(e) => setRemarks(r.StudentId, e.target.value)}
                      placeholder="Optional"
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-400">
            One session per section per day. If this day is already marked, saving opens it for
            correction instead of creating a second one.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Reopens a stored session. Marking and editing share one payload shape, so this
 * is the same grid against a session id instead of a new roster.
 */
function EditSession({
  sessionId,
  onDone,
  onCancel,
  onError,
}: {
  sessionId: number;
  onDone: (text: string) => void;
  onCancel: () => void;
  onError: (text: string) => void;
}) {
  const detail = useAsync(useCallback((signal: AbortSignal) => fetchSession(sessionId, signal), [sessionId]));
  const [overrides, setOverrides] = useState<Draft>({});
  const [busy, setBusy] = useState(false);

  // Stored marks overlaid with this session's edits, derived from the response
  // so there is no seeding effect that could fire after the component unmounted.
  const draft = useMemo<Draft>(() => {
    const merged: Draft = {};
    for (const r of detail.data?.Records ?? []) {
      merged[r.StudentId] = {
        status: (
          STATUSES.includes(r.Status as AttendanceStatus) ? r.Status : "Present"
        ) as AttendanceStatus,
        remarks: r.Remarks ?? "",
      };
    }
    return { ...merged, ...overrides };
  }, [detail.data, overrides]);

  if (detail.error) {
    return (
      <ErrorState message={detail.error.message} status={detail.status} onRetry={detail.refetch} />
    );
  }
  if (detail.loading || !detail.data) {
    return (
      <div className={`${card} mb-5 space-y-3 p-5`}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const { Session: session, Records: records } = detail.data;

  async function submit() {
    setBusy(true);
    try {
      const result = await updateSession(sessionId, {
        ClassId: session.ClassId,
        SectionId: session.SectionId,
        Date: session.Date,
        Records: Object.entries(draft).map(([studentId, value]) => ({
          StudentId: Number(studentId),
          Status: value.status,
          Remarks: value.remarks,
        })),
      });
      onDone(result.Message);
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${card} mb-5 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          <Pencil className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
          Editing {session.ClassName} · {session.SectionName}
          <span className="text-[12px] font-normal text-ink-500">
            {session.Date?.slice(0, 10)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
          <button onClick={() => void submit()} className={primaryBtn} disabled={busy}>
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-ink-400">
          This session has no marks stored.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {records.map((r) => {
            const value = draft[r.StudentId];
            return (
              <li
                key={r.Id}
                className="grid grid-cols-[160px_1fr_240px] items-center gap-4 px-5 py-2.5 text-[13px] text-ink-700"
              >
                <span className="truncate">
                  <span className="font-medium text-ink-900">{r.Username}</span>
                  <span className="ml-1.5 text-[11.5px] text-ink-400">{r.RollNumber}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setOverrides((o) => ({
                          ...o,
                          [r.StudentId]: { status: s, remarks: o[r.StudentId]?.remarks ?? "" },
                        }))
                      }
                      aria-pressed={value?.status === s}
                      className={
                        "rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 transition-colors " +
                        (value?.status === s
                          ? TONES[statusTone(s)] + " ring-2"
                          : "bg-white text-ink-500 ring-line hover:bg-line-soft")
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={value?.remarks ?? ""}
                  onChange={(e) =>
                    setOverrides((o) => ({
                      ...o,
                      [r.StudentId]: {
                        status: o[r.StudentId]?.status ?? "Present",
                        remarks: e.target.value,
                      },
                    }))
                  }
                  placeholder="Optional"
                  className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SessionHistory({ onEdit }: { onEdit: (id: number) => void }) {
  const [classId, setClassId] = useState("");
  const sessions = useAsync(
    useCallback(
      (signal: AbortSignal) => fetchSessions(classId ? { classId: Number(classId) } : {}, signal),
      [classId],
    ),
  );
  const classes = useAsync(useCallback((signal: AbortSignal) => fetchClasses(signal), []));

  const rows = useMemo(() => sessions.data ?? [], [sessions.data]);

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          <History className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
          Marking history
        </div>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          aria-label="Filter history by class"
          className="rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink-700 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        >
          <option value="">All classes</option>
          {(classes.data ?? []).map((c) => (
            <option key={c.Id} value={c.Id}>{c.Name}</option>
          ))}
        </select>
      </div>

      {sessions.error ? (
        <div className="p-5">
          <ErrorState message={sessions.error.message} status={sessions.status} onRetry={sessions.refetch} />
        </div>
      ) : sessions.loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center py-14 text-center">
          <CalendarDays className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">Nothing has been marked yet.</p>
        </div>
      ) : (
        <>
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[130px_1fr_1fr_140px_90px] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Date</span>
              <span>Class</span>
              <span>Section</span>
              <span>Marked</span>
              <span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((s: SessionSummary) => (
                <li
                  key={s.Id}
                  className="grid grid-cols-[130px_1fr_1fr_140px_90px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700 hover:bg-line-soft/40"
                >
                  <span className="text-ink-500">{s.Date?.slice(0, 10)}</span>
                  <span className="font-medium text-ink-900">{s.ClassName}</span>
                  <span className="truncate text-ink-500">{s.SectionName}</span>
                  <span className="text-ink-500">
                    {s.Marked}/{s.Total}
                    {/* A partial tally means somebody has no mark for that day, so
                        it is called out rather than left to look like an absence. */}
                    {s.Marked < s.Total && (
                      <span className="ml-1.5 inline-flex items-center text-[11px] font-semibold text-amber-600">
                        <AlertTriangle className="mr-0.5 h-3 w-3" strokeWidth={2.2} />
                        incomplete
                      </span>
                    )}
                  </span>
                  <span className="flex justify-end">
                    <button onClick={() => onEdit(s.Id)} className={ghostBtn}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-400">
            {rows.length} session{rows.length === 1 ? "" : "s"} · newest first.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------ learners ------------------------------ */

/**
 * A Student or Parent's own records.
 *
 * A parent may have several children, so they pick which one to view. Each id is
 * sent to an endpoint that re-checks the link server-side, so switching the
 * selector cannot reach an unlinked student.
 */
function MyAttendance({ role }: { role: string }) {
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

  // The child in view: the one picked, else the first linked. Derived so a
  // parent lands on a list instead of an empty screen without an effect, and so
  // a child who unlinks cannot stay selected.
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
          if (childId == null) return Promise.resolve([]);
          return fetchStudentAttendance(childId, signal);
        }
        return fetchMyAttendance(signal);
      },
      [isParent, childId],
    ),
  );

  const rows = useMemo(() => mine.data ?? [], [mine.data]);

  const summary = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    for (const r of rows) {
      if (r.Status in counts) counts[r.Status as keyof typeof counts] += 1;
    }
    // Present and Late both count as attending, which is how the dashboard
    // percentage is computed too.
    const counted = counts.Present + counts.Absent + counts.Late;
    const pct = counted ? Math.round(((counts.Present + counts.Late) / counted) * 100) : null;
    return { counts, pct, counted };
  }, [rows]);

  if (children.error) {
    return (
      <>
        <PageHeader title="Attendance" subtitle="Your attendance record." />
        <ErrorState message={children.error.message} status={children.status} onRetry={children.refetch} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle={isParent ? "Your child's attendance record." : "Your attendance record."}
      />

      {isParent && (
        <div className={`${card} mb-5 p-5`}>
          <label className={label} htmlFor="att-child">Child</label>
          <select
            id="att-child"
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

      {summary.counted > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-5">
          <div className={`${card} p-4`}>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">Attended</p>
            <p className="mt-1 text-[22px] font-bold text-ink-900">
              {summary.pct === null ? "—" : `${summary.pct}%`}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              {summary.counted} day{summary.counted === 1 ? "" : "s"} marked
            </p>
          </div>
          {(["Present", "Late", "Absent", "Excused"] as const).map((s) => (
            <div key={s} className={`${card} p-4`}>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">{s}</p>
              <p className="mt-1 text-[22px] font-bold text-ink-900">{summary.counts[s]}</p>
            </div>
          ))}
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
            <ClipboardCheck className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
            <p className="text-[13px] text-ink-500">
              {isParent && childRows.length === 0
                ? "No children are linked to this account yet."
                : "No attendance has been marked yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[130px_1fr_130px_1fr] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                <span>Date</span>
                <span>Class</span>
                <span>Status</span>
                <span>Remarks</span>
              </div>
              <ul className="divide-y divide-line">
                {rows.map((r) => (
                  <li
                    key={r.Id}
                    className="grid grid-cols-[130px_1fr_130px_1fr] items-center gap-4 px-5 py-3 text-[13px] text-ink-700"
                  >
                    <span className="text-ink-500">{r.Date?.slice(0, 10)}</span>
                    <span className="truncate">
                      <span className="font-medium text-ink-900">{r.ClassName}</span>
                      {r.SectionName && <span className="ml-1.5 text-[11.5px] text-ink-400">{r.SectionName}</span>}
                    </span>
                    <span><StatusPill status={r.Status} /></span>
                    <span className="truncate text-ink-500">{r.Remarks || "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-400">
              {rows.length} day{rows.length === 1 ? "" : "s"} · newest first. Late and excused days
              still count as marked.
            </p>
          </>
        )}
      </div>
    </>
  );
}

