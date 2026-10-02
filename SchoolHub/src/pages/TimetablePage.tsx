import { useCallback, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  DAYS,
  createEntry,
  createTimeSlot,
  deleteEntry,
  deleteTimeSlot,
  fetchMyTimetable,
  fetchStudentTimetable,
  fetchTimeSlots,
  fetchTimetable,
  hhmm,
  updateEntry,
  updateTimeSlot,
  type SaveEntryPayload,
  type TimeSlot,
  type TimetableEntry,
} from "../api/timetable";
import { fetchClasses, fetchClassSubjects, fetchSections } from "../api/academic";
import { fetchTeachers } from "../api/teachers";
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
  "inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60";

type Tone = "ok" | "err";

export function TimetablePage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  if (role === "Student" || role === "Teacher") return <PersonalTimetable role={role} />;
  if (role === "Parent") return <ParentTimetable />;
  return <ManageTimetable />;
}

/* ------------------------------ shared grid ------------------------------ */

/** What a cell shows as its second line, depending on who is reading. */
type GridVariant = "admin" | "student" | "teacher";

function WeekGrid({
  slots,
  entries,
  variant,
  onCell,
  activeId,
}: {
  slots: TimeSlot[];
  entries: TimetableEntry[];
  variant: GridVariant;
  onCell?: (slotId: number, day: number, entry: TimetableEntry | null) => void;
  activeId?: number | null;
}) {
  const byKey = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    for (const e of entries) map.set(`${e.TimeSlotId}|${e.DayOfWeek}`, e);
    return map;
  }, [entries]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className="border-b border-line bg-line-soft/40 px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              Period
            </th>
            {DAYS.map((d) => (
              <th
                key={d.value}
                className="border-b border-l border-line bg-line-soft/40 px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500"
              >
                {d.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.Id}>
              <th
                scope="row"
                className="border-b border-line px-3 py-2.5 text-left align-top font-medium text-ink-700"
              >
                <span className="block text-ink-900">{s.Label ?? "Period"}</span>
                <span className="block text-[11.5px] font-normal text-ink-400">
                  {hhmm(s.StartTime)}–{hhmm(s.EndTime)}
                </span>
              </th>
              {DAYS.map((d) => {
                const entry = byKey.get(`${s.Id}|${d.value}`) ?? null;
                const clickable = Boolean(onCell);
                return (
                  <td
                    key={d.value}
                    onClick={onCell ? () => onCell(s.Id, d.value, entry) : undefined}
                    className={
                      "border-b border-l border-line px-2 align-top " +
                      (clickable ? "cursor-pointer hover:bg-mint-50/50 " : "") +
                      (entry && entry.Id === activeId ? "bg-mint-50" : "")
                    }
                  >
                    {entry ? (
                      <div className="rounded-lg bg-mint-50 px-2 py-1.5 ring-1 ring-mint-100">
                        <p className="font-semibold text-mint-700">{entry.SubjectName}</p>
                        <p className="text-[11px] text-ink-500">
                          {variant === "teacher"
                            ? `${entry.ClassName} ${entry.SectionName}`
                            : entry.TeacherName ?? "Unassigned"}
                        </p>
                      </div>
                    ) : (
                      <span className="block px-2 py-1.5 text-ink-300">
                        {clickable ? "+" : "—"}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ admin ------------------------------ */

type Draft = SaveEntryPayload & { id: number | null };

function ManageTimetable() {
  const [classId, setClassId] = useState("");
  const [pickedSectionId, setPickedSectionId] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<{ tone: Tone; text: string } | null>(null);

  const classes = useAsync(useCallback((s: AbortSignal) => fetchClasses(s), []));
  const sections = useAsync(useCallback((s: AbortSignal) => fetchSections(s), []));
  const slots = useAsync(useCallback((s: AbortSignal) => fetchTimeSlots(s), []));
  const teachers = useAsync(useCallback((s: AbortSignal) => fetchTeachers(s), []));

  const classRows = useMemo(() => classes.data ?? [], [classes.data]);
  const sectionRows = useMemo(() => sections.data ?? [], [sections.data]);
  const slotRows = useMemo(() => slots.data ?? [], [slots.data]);
  const teacherRows = useMemo(() => teachers.data ?? [], [teachers.data]);

  const sectionsForClass = useMemo(
    () => sectionRows.filter((s) => String(s.ClassId) === classId),
    [sectionRows, classId],
  );
  // Derived so changing class drops a section that no longer belongs to it.
  const sectionId = sectionsForClass.some((s) => String(s.Id) === pickedSectionId)
    ? pickedSectionId
    : sectionsForClass.length
      ? String(sectionsForClass[0].Id)
      : "";

  const subjects = useAsync(
    useCallback(
      (signal: AbortSignal) =>
        classId ? fetchClassSubjects(Number(classId), signal) : Promise.resolve([]),
      [classId],
    ),
  );

  const entries = useAsync(
    useCallback(
      (signal: AbortSignal) =>
        classId && sectionId
          ? fetchTimetable(Number(classId), Number(sectionId), signal)
          : Promise.resolve([] as TimetableEntry[]),
      [classId, sectionId],
    ),
  );

  const subjectRows = useMemo(() => subjects.data ?? [], [subjects.data]);
  const entryRows = useMemo(() => entries.data ?? [], [entries.data]);

  function flash(tone: Tone, text: string) {
    setNotice({ tone, text });
  }

  function openCell(slotId: number, day: number, entry: TimetableEntry | null) {
    if (!subjectRows.length) {
      flash("err", "This class has no subjects yet. Assign subjects to it under Academics first.");
      return;
    }
    setDraft({
      id: entry?.Id ?? null,
      ClassId: Number(classId),
      SectionId: Number(sectionId),
      SubjectId: entry?.SubjectId ?? subjectRows[0].Id,
      TeacherId: entry?.TeacherId ?? 0,
      TimeSlotId: slotId,
      DayOfWeek: day,
    });
  }

  async function saveDraft() {
    if (!draft) return;
    const payload: SaveEntryPayload = {
      ClassId: draft.ClassId,
      SectionId: draft.SectionId,
      SubjectId: draft.SubjectId,
      TeacherId: draft.TeacherId,
      TimeSlotId: draft.TimeSlotId,
      DayOfWeek: draft.DayOfWeek,
    };
    try {
      if (draft.id != null) await updateEntry(draft.id, payload);
      else await createEntry(payload);
      flash("ok", draft.id != null ? "Lesson updated." : "Lesson added.");
      setDraft(null);
      entries.refetch();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : String(err));
    }
  }

  async function removeDraft() {
    if (draft?.id == null) return;
    try {
      await deleteEntry(draft.id);
      flash("ok", "Lesson removed.");
      setDraft(null);
      entries.refetch();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : String(err));
    }
  }

  const ready = classId && sectionId && !slots.loading;

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle="Build each section's week from the bell schedule, one period at a time."
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

      <div className={`${card} mb-5 p-5`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="tt-class">Class</label>
            <select
              id="tt-class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setDraft(null);
              }}
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
            <label className={label} htmlFor="tt-section">Section</label>
            <select
              id="tt-section"
              value={sectionId}
              onChange={(e) => {
                setPickedSectionId(e.target.value);
                setDraft(null);
              }}
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
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div>
          <div className={`${card} overflow-hidden`}>
            {entries.error ? (
              <div className="p-5">
                <ErrorState message={entries.error.message} status={entries.status} onRetry={entries.refetch} />
              </div>
            ) : !ready || entries.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : slotRows.length === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <Clock className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
                <p className="text-[13px] text-ink-500">
                  No periods are defined yet. Add one on the right to start building the week.
                </p>
              </div>
            ) : (
              <WeekGrid
                slots={slotRows}
                entries={entryRows}
                variant="admin"
                onCell={openCell}
                activeId={draft?.id ?? null}
              />
            )}
          </div>
          <p className="mt-2 px-1 text-[11.5px] text-ink-400">
            Click a cell to add a lesson or open the one already there. A section or teacher booked in
            the same period twice is refused.
          </p>
        </div>

        <div className="space-y-5">
          {draft && (
            <EntryEditor
              draft={draft}
              slots={slotRows}
              subjects={subjectRows.map((s) => ({ Id: s.Id, Name: s.Name }))}
              teachers={teacherRows.map((t) => ({ Id: t.Id, Name: t.Username }))}
              onChange={setDraft}
              onSave={saveDraft}
              onDelete={draft.id != null ? removeDraft : undefined}
              onCancel={() => setDraft(null)}
            />
          )}

          <PeriodPanel
            slots={slotRows}
            loading={slots.loading}
            onError={(text) => flash("err", text)}
            onChanged={(text) => {
              flash("ok", text);
              slots.refetch();
              entries.refetch();
            }}
          />
        </div>
      </div>
    </>
  );
}

function EntryEditor({
  draft,
  slots,
  subjects,
  teachers,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  draft: Draft;
  slots: TimeSlot[];
  subjects: { Id: number; Name: string }[];
  teachers: { Id: number; Name: string }[];
  onChange: (d: Draft) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  return (
    <div className={card}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          <Pencil className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
          {draft.id != null ? "Edit lesson" : "Add lesson"}
        </span>
        <button onClick={onCancel} className="rounded-lg p-1 text-ink-400 hover:bg-line-soft" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <label className={label}>Subject</label>
          <select
            value={draft.SubjectId}
            onChange={(e) => set({ SubjectId: Number(e.target.value) })}
            className={field}
          >
            {subjects.map((s) => (
              <option key={s.Id} value={s.Id}>{s.Name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Teacher</label>
          <select
            value={draft.TeacherId}
            onChange={(e) => set({ TeacherId: Number(e.target.value) })}
            className={field}
          >
            <option value={0}>Unassigned</option>
            {teachers.map((t) => (
              <option key={t.Id} value={t.Id}>{t.Name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Period</label>
            <select
              value={draft.TimeSlotId}
              onChange={(e) => set({ TimeSlotId: Number(e.target.value) })}
              className={field}
            >
              {slots.map((s) => (
                <option key={s.Id} value={s.Id}>
                  {s.Label ?? "Period"} · {hhmm(s.StartTime)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Day</label>
            <select
              value={draft.DayOfWeek}
              onChange={(e) => set({ DayOfWeek: Number(e.target.value) })}
              className={field}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 border-t border-line px-5 py-3.5">
        {onDelete && (
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await onDelete();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className={`${dangerBtn} mr-auto`}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        )}
        <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
        <button
          onClick={async () => {
            setBusy(true);
            try {
              await onSave();
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          className={primaryBtn}
        >
          <Save className="h-4 w-4" />
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function PeriodPanel({
  slots,
  loading,
  onError,
  onChanged,
}: {
  slots: TimeSlot[];
  loading: boolean;
  onError: (text: string) => void;
  onChanged: (text: string) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [slotLabel, setSlotLabel] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditingId(null);
    setStart("");
    setEnd("");
    setSlotLabel("");
  }

  function beginEdit(s: TimeSlot) {
    setEditingId(s.Id);
    setStart(hhmm(s.StartTime));
    setEnd(hhmm(s.EndTime));
    setSlotLabel(s.Label ?? "");
  }

  async function save() {
    setBusy(true);
    try {
      const payload = { StartTime: start, EndTime: end, Label: slotLabel.trim() || null };
      if (editingId != null) {
        await updateTimeSlot(editingId, payload);
        onChanged("Period updated.");
      } else {
        await createTimeSlot(payload);
        onChanged("Period added.");
      }
      reset();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    try {
      await deleteTimeSlot(id);
      onChanged("Period deleted.");
      if (editingId === id) reset();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
        <Clock className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
        Bell schedule
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <p className="px-5 py-6 text-center text-[12.5px] text-ink-400">No periods yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {slots.map((s) => (
            <li key={s.Id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-[12.5px]">
              <span className="text-ink-700">
                <span className="font-medium text-ink-900">{s.Label ?? "Period"}</span>
                <span className="ml-1.5 text-ink-400">
                  {hhmm(s.StartTime)}–{hhmm(s.EndTime)}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <button
                  onClick={() => beginEdit(s)}
                  className="rounded-lg p-1.5 text-ink-500 hover:bg-line-soft"
                  aria-label="Edit period"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void remove(s.Id)}
                  disabled={busy}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                  aria-label="Delete period"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-line p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Start</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>End</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>Label</label>
          <input
            type="text"
            value={slotLabel}
            onChange={(e) => setSlotLabel(e.target.value)}
            placeholder="Period 5"
            className={field}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {editingId != null && (
            <button onClick={reset} className={ghostBtn} disabled={busy}>Cancel</button>
          )}
          <button
            onClick={() => void save()}
            disabled={busy || !start || !end}
            className={`${primaryBtn} ml-auto`}
          >
            {editingId != null ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId != null ? "Save period" : "Add period"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ learners ------------------------------ */

function PersonalTimetable({ role }: { role: string }) {
  const isTeacher = role === "Teacher";
  const slots = useAsync(useCallback((s: AbortSignal) => fetchTimeSlots(s), []));
  const mine = useAsync(useCallback((s: AbortSignal) => fetchMyTimetable(s), []));

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={isTeacher ? "The lessons you are scheduled to teach." : "Your weekly schedule."}
      />
      <TimetableBody
        slots={slots.data ?? []}
        entries={mine.data ?? []}
        variant={isTeacher ? "teacher" : "student"}
        loading={slots.loading || mine.loading}
        error={mine.error ?? slots.error}
        status={mine.status ?? slots.status}
        onRetry={() => {
          slots.refetch();
          mine.refetch();
        }}
        emptyText={isTeacher ? "You have no lessons scheduled yet." : "Your class has no timetable yet."}
      />
    </>
  );
}

function ParentTimetable() {
  const [pickedChildId, setPickedChildId] = useState<number | null>(null);
  const children = useAsync(useCallback((s: AbortSignal) => fetchParentChildren(s), []));
  const childRows = useMemo(() => children.data ?? [], [children.data]);

  const childId =
    pickedChildId != null && childRows.some((c) => c.StudentId === pickedChildId)
      ? pickedChildId
      : childRows.length
        ? childRows[0].StudentId
        : null;

  const slots = useAsync(useCallback((s: AbortSignal) => fetchTimeSlots(s), []));
  const mine = useAsync(
    useCallback(
      (signal: AbortSignal) =>
        childId == null
          ? Promise.resolve([] as TimetableEntry[])
          : fetchStudentTimetable(childId, signal),
      [childId],
    ),
  );

  return (
    <>
      <PageHeader title="Timetable" subtitle="Your child's weekly schedule." />

      {children.error ? (
        <ErrorState message={children.error.message} status={children.status} onRetry={children.refetch} />
      ) : (
        <>
          <div className={`${card} mb-5 p-5`}>
            <label className={label} htmlFor="tt-child">Child</label>
            <select
              id="tt-child"
              value={childId ?? ""}
              onChange={(e) => setPickedChildId(Number(e.target.value))}
              className={`${field} max-w-sm`}
              disabled={children.loading || childRows.length === 0}
            >
              {children.loading && <option value="">Loading children...</option>}
              {!children.loading && childRows.length === 0 && (
                <option value="">No children linked to this account</option>
              )}
              {(childRows as Child[]).map((c) => (
                <option key={c.StudentId} value={c.StudentId}>
                  {c.StudentName}
                  {c.ClassName ? ` · ${c.ClassName}${c.SectionName ? ` ${c.SectionName}` : ""}` : ""}
                </option>
              ))}
            </select>
          </div>

          <TimetableBody
            slots={slots.data ?? []}
            entries={mine.data ?? []}
            variant="student"
            loading={slots.loading || mine.loading}
            error={mine.error ?? slots.error}
            status={mine.status ?? slots.status}
            onRetry={() => {
              slots.refetch();
              mine.refetch();
            }}
            emptyText={
              childRows.length === 0
                ? "No children are linked to this account yet."
                : "Your child's class has no timetable yet."
            }
          />
        </>
      )}
    </>
  );
}

function TimetableBody({
  slots,
  entries,
  variant,
  loading,
  error,
  status,
  onRetry,
  emptyText,
}: {
  slots: TimeSlot[];
  entries: TimetableEntry[];
  variant: GridVariant;
  loading: boolean;
  error: Error | null;
  status: number | null;
  onRetry: () => void;
  emptyText: string;
}) {
  return (
    <div className={`${card} overflow-hidden`}>
      {error ? (
        <div className="p-5">
          <ErrorState message={error.message} status={status} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : slots.length === 0 || entries.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <CalendarDays className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">{emptyText}</p>
        </div>
      ) : (
        <WeekGrid slots={slots} entries={entries} variant={variant} />
      )}
    </div>
  );
}
