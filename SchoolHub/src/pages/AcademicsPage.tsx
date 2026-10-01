import { useCallback, useMemo, useState, type ReactNode } from "react";
import { BookOpen, GraduationCap, Layers, Pencil, Plus, Search, X } from "lucide-react";
import {
  createClass,
  createSection,
  createSubject,
  deleteClass,
  deleteSection,
  deleteSubject,
  fetchClassSubjects,
  fetchClasses,
  fetchSections,
  fetchSubjects,
  setClassSubjects,
  updateClass,
  updateSection,
  updateSubject,
  type ClassItem,
  type SectionItem,
  type Subject,
} from "../api/academic";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../context/useAuth";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";

type Tab = "classes" | "sections" | "subjects";

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "classes", label: "Classes", icon: GraduationCap },
  { id: "sections", label: "Sections", icon: Layers },
  { id: "subjects", label: "Subjects", icon: BookOpen },
];

const field =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100";
const label = "mb-1.5 block text-[12px] font-semibold text-ink-700";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-mint-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-mint-500 disabled:opacity-60";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-line-soft disabled:opacity-60";
const iconBtn =
  "rounded-lg border border-line p-1.5 text-ink-500 transition-colors hover:bg-line-soft hover:text-ink-900 disabled:opacity-50";
const dangerBtn =
  "rounded-lg border border-rose-200 px-2 py-1.5 text-[11.5px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60";

function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className={iconBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function AcademicsPage() {
  const { user } = useAuth();
  // Writes are Admin-only; Teacher may read all three lists.
  const isAdmin = user?.role === "Admin";

  const [tab, setTab] = useState<Tab>("classes");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [creatingClass, setCreatingClass] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [creatingSection, setCreatingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [mappingClass, setMappingClass] = useState<ClassItem | null>(null);

  const classes = useAsync(useCallback((signal: AbortSignal) => fetchClasses(signal), []));
  const sections = useAsync(useCallback((signal: AbortSignal) => fetchSections(signal), []));
  const subjects = useAsync(useCallback((signal: AbortSignal) => fetchSubjects(signal), []));

  const classRows = useMemo(() => classes.data ?? [], [classes.data]);
  const sectionRows = useMemo(() => sections.data ?? [], [sections.data]);
  const subjectRows = useMemo(() => subjects.data ?? [], [subjects.data]);

  const q = query.trim().toLowerCase();
  const filteredClasses = useMemo(
    () => classRows.filter((c) => !q || c.Name.toLowerCase().includes(q)),
    [classRows, q],
  );
  const filteredSections = useMemo(
    () => sectionRows.filter((s) => !q || `${s.Name} ${s.ClassName}`.toLowerCase().includes(q)),
    [sectionRows, q],
  );
  const filteredSubjects = useMemo(
    () => subjectRows.filter((s) => !q || `${s.Name} ${s.Code} ${s.TeacherName ?? ""}`.toLowerCase().includes(q)),
    [subjectRows, q],
  );

  /**
   * Runs a write, then refreshes every list. Refetching all three rather than
   * just the affected one keeps counts (e.g. SectionCount on a class) honest.
   */
  async function run(action: () => Promise<string>) {
    setBusy(true);
    setNotice(null);
    try {
      setNotice({ tone: "ok", text: await action() });
      classes.refetch();
      sections.refetch();
      subjects.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setNotice({ tone: "err", text: message });
      throw err;
    } finally {
      setBusy(false);
    }
  }

  // Teacher sees the same three read-only lists; only the row actions and the
  // add button are hidden, matching the API's Admin-only write rules.
  const error = classes.error ?? sections.error ?? subjects.error;
  if (error) {
    return (
      <>
        <PageHeader title="Academics" subtitle="Classes, sections, and subjects." />
        <ErrorState
          message={error.message}
          status={classes.status ?? sections.status ?? subjects.status}
          onRetry={() => {
            classes.refetch();
            sections.refetch();
            subjects.refetch();
          }}
        />
      </>
    );
  }

  const loading = classes.loading || sections.loading || subjects.loading;
  const currentCount =
    tab === "classes"
      ? classRows.length
      : tab === "sections"
        ? sectionRows.length
        : subjectRows.length;

  function addAction() {
    if (!isAdmin) return null;
    if (tab === "classes") return <button onClick={() => setCreatingClass(true)} className={primaryBtn}><Plus className="h-4 w-4" />Add Class</button>;
    if (tab === "sections") return <button onClick={() => setCreatingSection(true)} className={primaryBtn} disabled={classRows.length === 0}><Plus className="h-4 w-4" />Add Section</button>;
    return <button onClick={() => setCreatingSubject(true)} className={primaryBtn}><Plus className="h-4 w-4" />Add Subject</button>;
  }

  const rowCount =
    tab === "classes" ? filteredClasses.length : tab === "sections" ? filteredSections.length : filteredSubjects.length;

  return (
    <>
      <PageHeader
        title="Academics"
        subtitle={`${classRows.length} classes · ${sectionRows.length} sections · ${subjectRows.length} subjects`}
        action={addAction()}
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

      <div className="mb-4 flex gap-1.5">
        {TABS.map(({ id, label: text, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors " +
              (tab === id
                ? "bg-mint-600 text-white"
                : "border border-line bg-white text-ink-600 hover:bg-line-soft")
            }
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
            {text}
          </button>
        ))}
      </div>

      <div className="mb-5 relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          strokeWidth={1.9}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "classes"
              ? "Search classes..."
              : tab === "sections"
                ? "Search sections or classes..."
                : "Search subjects, codes, or teachers..."
          }
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="min-w-[720px]">
          {tab === "classes" && (
            <div className="grid grid-cols-[1fr_140px_180px] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Class</span>
              <span>Sections</span>
              <span className="text-right">Actions</span>
            </div>
          )}
          {tab === "sections" && (
            <div className="grid grid-cols-[1fr_1fr_180px] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Section</span>
              <span>Class</span>
              <span className="text-right">Actions</span>
            </div>
          )}
          {tab === "subjects" && (
            <div className="grid grid-cols-[1fr_140px_1fr_180px] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Subject</span>
              <span>Code</span>
              <span>Teacher</span>
              <span className="text-right">Actions</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rowCount === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <BookOpen className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
              <p className="text-[13px] text-ink-500">
                {query ? `Nothing matches "${query}".` : `No ${tab} yet.`}
              </p>
            </div>
          ) : tab === "classes" ? (
            <ul className="divide-y divide-line">
              {filteredClasses.map((c) => (
                <li key={c.Id} className="grid grid-cols-[1fr_140px_180px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700 hover:bg-line-soft/40">
                  <span className="font-medium text-ink-900">{c.Name}</span>
                  <span className="text-ink-500">{c.SectionCount}</span>
                  <span className="flex items-center justify-end gap-1.5">
                    {isAdmin && (
                      <>
                        <button onClick={() => setMappingClass(c)} title="Assign subjects" className={iconBtn}>
                          <BookOpen className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingClass(c)} title="Rename class" className={iconBtn}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm(`Delete "${c.Name}"? Sections in it are deleted too.`)) return;
                            void run(async () => {
                              const r = await deleteClass(c.Id);
                              return r.Message;
                            }).catch(() => undefined);
                          }}
                          disabled={busy}
                          className={dangerBtn}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : tab === "sections" ? (
            <ul className="divide-y divide-line">
              {filteredSections.map((s) => (
                <li key={s.Id} className="grid grid-cols-[1fr_1fr_180px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700 hover:bg-line-soft/40">
                  <span className="font-medium text-ink-900">{s.Name}</span>
                  <span className="truncate text-ink-500">{s.ClassName}</span>
                  <span className="flex items-center justify-end gap-1.5">
                    {isAdmin && (
                      <>
                        <button onClick={() => setEditingSection(s)} title="Edit section" className={iconBtn}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm(`Delete section "${s.Name}" from ${s.ClassName}?`)) return;
                            void run(async () => {
                              const r = await deleteSection(s.Id);
                              return r.Message;
                            }).catch(() => undefined);
                          }}
                          disabled={busy}
                          className={dangerBtn}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-line">
              {filteredSubjects.map((s) => (
                <li key={s.Id} className="grid grid-cols-[1fr_140px_1fr_180px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700 hover:bg-line-soft/40">
                  <span className="font-medium text-ink-900">{s.Name}</span>
                  <span className="font-mono text-[12.5px] text-ink-500">{s.Code}</span>
                  <span className="truncate text-ink-500">{s.TeacherName ?? "—"}</span>
                  <span className="flex items-center justify-end gap-1.5">
                    {isAdmin && (
                      <>
                        <button onClick={() => setEditingSubject(s)} title="Edit subject" className={iconBtn}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm(`Delete subject "${s.Name}"?`)) return;
                            void run(async () => {
                              const r = await deleteSubject(s.Id);
                              return r.Message;
                            }).catch(() => undefined);
                          }}
                          disabled={busy}
                          className={dangerBtn}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-3 text-[12px] text-ink-400">
        {currentCount} {tab} total{rowCount !== currentCount ? ` · ${rowCount} shown` : ""}.{" "}
        {isAdmin
          ? "Deleting an item that still has students assigned is refused, so nothing is orphaned."
          : "Read-only view."}
      </p>

      {creatingClass && (
        <NameModal
          title="Add class"
          subtitle="For example: Grade 11"
          cta="Create class"
          fieldLabel="Class name"
          placeholder="Grade 11"
          busy={busy}
          onClose={() => setCreatingClass(false)}
          onSubmit={(name) =>
            run(async () => {
              const r = await createClass(name);
              setCreatingClass(false);
              return r.Message;
            })
          }
        />
      )}

      {editingClass && (
        <NameModal
          title="Rename class"
          subtitle={editingClass.Name}
          cta="Save changes"
          fieldLabel="Class name"
          placeholder="Grade 11"
          initial={editingClass.Name}
          busy={busy}
          onClose={() => setEditingClass(null)}
          onSubmit={(name) =>
            run(async () => {
              const r = await updateClass(editingClass.Id, name);
              setEditingClass(null);
              return r.Message;
            })
          }
        />
      )}

      {creatingSection && (
        <SectionModal
          title="Add section"
          subtitle="Sections belong to one class"
          cta="Create section"
          classes={classRows}
          busy={busy}
          onClose={() => setCreatingSection(false)}
          onSubmit={(name, classId) =>
            run(async () => {
              const r = await createSection(name, classId);
              setCreatingSection(false);
              return r.Message;
            })
          }
        />
      )}

      {editingSection && (
        <SectionModal
          title="Edit section"
          subtitle={`${editingSection.Name} · ${editingSection.ClassName}`}
          cta="Save changes"
          classes={classRows}
          initialName={editingSection.Name}
          initialClassId={editingSection.ClassId}
          busy={busy}
          onClose={() => setEditingSection(null)}
          onSubmit={(name, classId) =>
            run(async () => {
              const r = await updateSection(editingSection.Id, name, classId);
              setEditingSection(null);
              return r.Message;
            })
          }
        />
      )}

      {creatingSubject && (
        <SubjectModal
          title="Add subject"
          subtitle="The code must be unique"
          cta="Create subject"
          busy={busy}
          onClose={() => setCreatingSubject(false)}
          onSubmit={(name, code) =>
            run(async () => {
              const r = await createSubject(name, code);
              setCreatingSubject(false);
              return r.Message;
            })
          }
        />
      )}

      {editingSubject && (
        <SubjectModal
          title="Edit subject"
          subtitle={`${editingSubject.Name} · ${editingSubject.Code}`}
          cta="Save changes"
          initialName={editingSubject.Name}
          initialCode={editingSubject.Code}
          busy={busy}
          onClose={() => setEditingSubject(null)}
          onSubmit={(name, code) =>
            run(async () => {
              const r = await updateSubject(editingSubject.Id, name, code);
              setEditingSubject(null);
              return r.Message;
            })
          }
        />
      )}

      {mappingClass && (
        <ClassSubjectsModal
          classItem={mappingClass}
          allSubjects={subjectRows}
          busy={busy}
          onClose={() => setMappingClass(null)}
          onSave={(ids) =>
            run(async () => {
              const r = await setClassSubjects(mappingClass.Id, ids);
              setMappingClass(null);
              return r.Message;
            })
          }
        />
      )}
    </>
  );
}

/* ----------------------------- modals ----------------------------- */

/** Shared single-field form for class create/rename. */
function NameModal({
  title,
  subtitle,
  cta,
  fieldLabel,
  placeholder,
  initial = "",
  busy,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  cta: string;
  fieldLabel: string;
  placeholder: string;
  initial?: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial);
  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(name.trim());
        }}
        className="space-y-4 px-6 py-5"
      >
        <div>
          <label className={label} htmlFor="name-input">{fieldLabel}</label>
          <input
            id="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            required
            className={field}
          />
          <p className="mt-1.5 text-[11.5px] text-ink-400">Names must be unique.</p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={busy || !name.trim()} className={primaryBtn}>{cta}</button>
        </div>
      </form>
    </Modal>
  );
}

function SectionModal({
  title,
  subtitle,
  cta,
  classes,
  initialName = "",
  initialClassId,
  busy,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  cta: string;
  classes: ClassItem[];
  initialName?: string;
  initialClassId?: number | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (name: string, classId: number) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  // Default to the section's existing class; matching on name would be
  // ambiguous before the unique index, and is unnecessary now.
  const [classId, setClassId] = useState<string>(
    initialClassId != null ? String(initialClassId) : classes.length ? String(classes[0].Id) : "",
  );

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(name.trim(), Number(classId));
        }}
        className="space-y-4 px-6 py-5"
      >
        <div>
          <label className={label} htmlFor="sec-name">Section name</label>
          <input
            id="sec-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="A"
            required
            className={field}
          />
          <p className="mt-1.5 text-[11.5px] text-ink-400">Must be unique within the class.</p>
        </div>
        <div>
          <label className={label} htmlFor="sec-class">Class</label>
          <select
            id="sec-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={field}
            disabled={classes.length === 0}
          >
            {classes.length === 0 && <option value="">No classes yet</option>}
            {classes.map((c) => (
              <option key={c.Id} value={c.Id}>{c.Name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button
            type="submit"
            disabled={busy || !name.trim() || !classId}
            className={primaryBtn}
          >
            {cta}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SubjectModal({
  title,
  subtitle,
  cta,
  initialName = "",
  initialCode = "",
  busy,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  cta: string;
  initialName?: string;
  initialCode?: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (name: string, code: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState(initialCode);

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(name.trim(), code.trim());
        }}
        className="space-y-4 px-6 py-5"
      >
        <div>
          <label className={label} htmlFor="subj-name">Subject name</label>
          <input
            id="subj-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Biology"
            required
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="subj-code">Code</label>
          <input
            id="subj-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="BIO101"
            required
            className={field}
          />
          <p className="mt-1.5 text-[11.5px] text-ink-400">Stored uppercase and must be unique.</p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button
            type="submit"
            disabled={busy || !name.trim() || !code.trim()}
            className={primaryBtn}
          >
            {cta}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Picks which subjects a class offers. Loaded on open rather than with the rest
 * of the page, because it is only needed for one class at a time.
 */
function ClassSubjectsModal({
  classItem,
  allSubjects,
  busy,
  onClose,
  onSave,
}: {
  classItem: ClassItem;
  allSubjects: Subject[];
  busy: boolean;
  onClose: () => void;
  onSave: (ids: number[]) => Promise<void>;
}) {
  const assigned = useAsync(
    useCallback(
      (signal: AbortSignal) => fetchClassSubjects(classItem.Id, signal),
      [classItem.Id],
    ),
  );
  const [picked, setPicked] = useState<number[] | null>(null);

  // null means "not chosen yet": fall back to what the API says is assigned so
  // saving without touching anything is a no-op rather than a wipe.
  const current = picked ?? assigned.data?.map((s) => s.Id) ?? [];

  function toggle(id: number) {
    setPicked(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  return (
    <Modal
      title="Subjects for this class"
      subtitle={`${classItem.Name} · ${current.length} assigned`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button
            type="button"
            disabled={busy || assigned.loading}
            onClick={() => void onSave(current)}
            className={primaryBtn}
          >
            Save subjects
          </button>
        </div>
      }
    >
      <div className="px-6 py-5">
        {assigned.error ? (
          <ErrorState message={assigned.error.message} status={assigned.status} onRetry={assigned.refetch} />
        ) : assigned.loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : allSubjects.length === 0 ? (
          <p className="text-[12.5px] text-ink-400">No subjects have been created yet.</p>
        ) : (
          <>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-line bg-white p-2">
              {allSubjects.map((s) => (
                <label
                  key={s.Id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-ink-700 transition-colors hover:bg-line-soft"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-mint-600"
                    checked={current.includes(s.Id)}
                    onChange={() => toggle(s.Id)}
                  />
                  <span className="font-medium">{s.Name}</span>
                  <span className="text-[11px] text-ink-400">{s.Code}</span>
                  {s.TeacherName && (
                    <span className="ml-auto text-[11px] text-ink-400">{s.TeacherName}</span>
                  )}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-ink-400">
              Saving replaces this class&apos;s current subject list.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}