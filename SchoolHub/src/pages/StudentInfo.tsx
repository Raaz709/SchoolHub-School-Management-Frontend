import { useCallback, useMemo, useState, type ReactNode } from "react";
import { GraduationCap, Pencil, Plus, Search, ShieldAlert, UserRound, X } from "lucide-react";
import {
  assignStudentClass,
  createStudent,
  deactivateStudent,
  fetchStudents,
  reactivateStudent,
  searchStudents,
  updateStudent,
  type Student,
} from "../api/students";
import { fetchClasses, fetchSections, type ClassItem, type SectionItem } from "../api/academic";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../context/useAuth";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";

type StatusFilter = "all" | "active" | "inactive";

const statusPill = (active: boolean) =>
  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold " +
  (active ? "bg-mint-50 text-mint-600" : "bg-rose-50 text-rose-600");

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-ink-400 transition-colors hover:bg-line-soft hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const field =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100";
const label = "mb-1.5 block text-[12px] font-semibold text-ink-700";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-mint-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-mint-500 disabled:opacity-60";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-line-soft disabled:opacity-60";

/** Sections belonging to a class, matched on the id the API now returns. */
function useSectionsForClass(
  sections: SectionItem[],
  classId: number | null,
): SectionItem[] {
  return useMemo(() => {
    if (!classId) return [];
    return sections.filter((s) => s.ClassId === classId);
  }, [sections, classId]);
}

export function StudentInfo() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<Student | null>(null);
  const [busy, setBusy] = useState(false);

  // Teachers may read the roster but not write it. The class and section
  // lookups back the filter dropdowns as well as the admin-only modals, and
  // both roles are allowed to read them, so fetch them for both. Gating on
  // isAdmin left the teacher filters permanently empty.
  const canReadAcademic = isAdmin || user?.role === "Teacher";
  const loadClasses = useCallback(
    (signal: AbortSignal) => (canReadAcademic ? fetchClasses(signal) : Promise.resolve([])),
    [canReadAcademic],
  );
  const classes = useAsync(loadClasses);

  const loadSections = useCallback(
    (signal: AbortSignal) => (canReadAcademic ? fetchSections(signal) : Promise.resolve([])),
    [canReadAcademic],
  );
  const sections = useAsync(loadSections);

  // The server already filters by query/class/section; status is applied
  // client-side because /api/students has no status filter.
  const runSearch = useCallback(
    (signal: AbortSignal) => {
      if (!query && !classId && !sectionId) return fetchStudents(signal);
      return searchStudents({ query, classId, sectionId }, signal);
    },
    [query, classId, sectionId],
  );
  const students = useAsync(runSearch);

  const rows = useMemo(() => students.data ?? [], [students.data]);
  const classOptions = useMemo(() => classes.data ?? [], [classes.data]);
  const sectionOptions = useMemo(() => sections.data ?? [], [sections.data]);
  const sectionsForFilter = useSectionsForClass(sectionOptions, classId);

  const filtered = useMemo(
    () =>
      rows.filter((s) => {
        if (status === "active" && !s.IsActive) return false;
        if (status === "inactive" && s.IsActive) return false;
        return true;
      }),
    [rows, status],
  );

  const activeCount = rows.filter((s) => s.IsActive).length;

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setNotice(null);
    try {
      setNotice({ tone: "ok", text: await action() });
      students.refetch();
      classes.refetch();
      sections.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setNotice({ tone: "err", text: message });
    } finally {
      setBusy(false);
    }
  }

  if (students.error) {
    return (
      <>
        <PageHeader title="Students" subtitle="Enrolment, class assignment and account status." />
        <ErrorState
          message={students.error.message}
          status={students.status}
          onRetry={students.refetch}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${rows.length} student${rows.length === 1 ? "" : "s"} · ${activeCount} active`}
        action={
          isAdmin ? (
            <button onClick={() => setCreating(true)} className={primaryBtn}>
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          ) : undefined
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

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_160px]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            strokeWidth={1.9}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or roll number..."
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
          />
        </div>

        <select
          value={classId ?? ""}
          onChange={(e) => {
            setClassId(e.target.value ? Number(e.target.value) : null);
            // A section from the previous class is meaningless once the class
            // changes, and the request would return nothing useful.
            setSectionId(null);
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        >
          <option value="">All classes</option>
          {classOptions.map((c) => (
            <option key={c.Id} value={c.Id}>{c.Name}</option>
          ))}
        </select>

        <select
          value={sectionId ?? ""}
          onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : null)}
          disabled={!classId}
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 disabled:opacity-50 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        >
          <option value="">All sections</option>
          {sectionsForFilter.map((s) => (
            <option key={s.Id} value={s.Id}>{s.Name}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[110px_1fr_1fr_150px_130px_120px_100px_170px] gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
            <span>Roll No</span>
            <span>Name</span>
            <span>Email</span>
            <span>Class</span>
            <span>Section</span>
            <span>Admitted</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {students.loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <UserRound className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
              <p className="text-[13px] text-ink-500">No students match your filters.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((s) => (
                <li
                  key={s.Id}
                  className="grid grid-cols-[110px_1fr_1fr_150px_130px_120px_100px_170px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700 hover:bg-line-soft/40"
                >
                  <span className="font-mono text-[12.5px] text-ink-500">{s.RollNumber}</span>
                  <span className="truncate font-medium text-ink-900">{s.Username}</span>
                  <span className="truncate text-ink-500">{s.Email}</span>
                  <span className="truncate">{s.ClassName ?? "—"}</span>
                  <span className="truncate">{s.SectionName ?? "—"}</span>
                  <span className="text-ink-500">{formatDate(s.AdmissionDate)}</span>
                  <span>
                    <span className={statusPill(s.IsActive)}>{s.IsActive ? "Active" : "Inactive"}</span>
                  </span>

                  {isAdmin ? (
                    <span className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(s)}
                        title="Edit roll number"
                        className="rounded-lg border border-line p-1.5 text-ink-500 transition-colors hover:bg-line-soft hover:text-ink-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setAssigning(s)}
                        title="Assign class and section"
                        className="rounded-lg border border-line p-1.5 text-ink-500 transition-colors hover:bg-line-soft hover:text-ink-900"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                      </button>
                      {s.IsActive ? (
                        <button
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Deactivate ${s.Username}? They will be unable to sign in.`,
                              )
                            ) {
                              return;
                            }
                            void run(async () => {
                              await deactivateStudent(s.Id);
                              return `${s.Username} deactivated.`;
                            });
                          }}
                          title="Deactivate account"
                          disabled={busy}
                          className="rounded-lg border border-rose-200 px-2 py-1.5 text-[11.5px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            void run(async () => {
                              await reactivateStudent(s.Id);
                              return `${s.Username} reactivated.`;
                            })
                          }
                          title="Restore sign-in access"
                          disabled={busy}
                          className="rounded-lg border border-mint-200 px-2 py-1.5 text-[11.5px] font-semibold text-mint-600 transition-colors hover:bg-mint-50 disabled:opacity-60"
                        >
                          Reactivate
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center justify-end">
                      <span
                        title="Only administrators can change student records"
                        className="rounded-lg border border-line p-1.5 text-ink-400"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <EditStudentModal
          student={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={(roll) =>
            run(async () => {
              await updateStudent(editing.Id, { RollNumber: roll });
              setEditing(null);
              return `Roll number updated to ${roll}.`;
            })
          }
        />
      )}

      {assigning && (
        <AssignClassModal
          student={assigning}
          classes={classOptions}
          sections={sectionOptions}
          busy={busy}
          onClose={() => setAssigning(null)}
          onSave={(classIdValue, sectionIdValue) =>
            run(async () => {
              await assignStudentClass(assigning.Id, {
                ClassId: classIdValue,
                SectionId: sectionIdValue,
              });
              setAssigning(null);
              return `Class assignment saved for ${assigning.Username}.`;
            })
          }
        />
      )}

      {creating && (
        <CreateStudentModal
          classes={classOptions}
          sections={sectionOptions}
          busy={busy}
          onClose={() => setCreating(false)}
          onSave={(payload) =>
            run(async () => {
              await createStudent(payload);
              setCreating(false);
              return `${payload.Username} added to the roster.`;
            })
          }
        />
      )}
    </>
  );
}

/* ----------------------------- modals ----------------------------- */

function EditStudentModal({
  student,
  busy,
  onClose,
  onSave,
}: {
  student: Student;
  busy: boolean;
  onClose: () => void;
  onSave: (rollNumber: string) => void;
}) {
  const [roll, setRoll] = useState(student.RollNumber);

  return (
    <Modal title="Edit student" subtitle={student.Username} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(roll.trim());
        }}
        className="space-y-4 px-6 py-5"
      >
        <div>
          <label className={label} htmlFor="s-roll">Roll number</label>
          <input
            id="s-roll"
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            required
            className={field}
          />
        </div>

        <p className="rounded-xl bg-line-soft/50 px-3 py-2.5 text-[11.5px] text-ink-500">
          Name, email and password are managed from the profile page. Class and
          section have their own action.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={busy || !roll.trim()} className={primaryBtn}>
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignClassModal({
  student,
  classes,
  sections,
  busy,
  onClose,
  onSave,
}: {
  student: Student;
  classes: ClassItem[];
  sections: SectionItem[];
  busy: boolean;
  onClose: () => void;
  onSave: (classId: number, sectionId: number) => void;
}) {
  // Preselect by id, not name. Class names repeat in this database
  // ("Grade 10" exists as both id 1 and id 4), so matching on the name picked
  // whichever row came first and could silently save the wrong class.
  const [classId, setClassId] = useState<string>(
    student.ClassId != null ? String(student.ClassId) : "",
  );
  const [sectionId, setSectionId] = useState<string>(
    student.SectionId != null ? String(student.SectionId) : "",
  );

  const sectionsForChosen = useSectionsForClass(sections, classId ? Number(classId) : null);

  return (
    <Modal
      title="Assign class"
      subtitle={`${student.Username} · currently ${student.ClassName ?? "unassigned"} ${student.SectionName ?? ""}`.trim()}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(Number(classId), Number(sectionId));
        }}
        className="space-y-4 px-6 py-5"
      >
        <div>
          <label className={label} htmlFor="a-class">Class</label>
          <select
            id="a-class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
            required
            className={field}
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.Id} value={c.Id}>{c.Name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="a-section">Section</label>
          <select
            id="a-section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            required
            disabled={!classId}
            className={field}
          >
            <option value="">
              {classId ? "Select a section" : "Choose a class first"}
            </option>
            {sectionsForChosen.map((s) => (
              <option key={s.Id} value={s.Id}>{s.Name}</option>
            ))}
          </select>
          {classId && sectionsForChosen.length === 0 && (
            <p className="mt-1.5 text-[11.5px] text-ink-400">
              This class has no sections yet. Add one under Classes &amp; Curriculum.
            </p>
          )}
        </div>

        <p className="rounded-xl bg-line-soft/50 px-3 py-2.5 text-[11.5px] text-ink-500">
          Saving replaces the student&apos;s current enrolment. A class needs a
          section, so both are required.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={busy || !classId || !sectionId} className={primaryBtn}>
            Save assignment
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateStudentModal({
  classes,
  sections,
  busy,
  onClose,
  onSave,
}: {
  classes: ClassItem[];
  sections: SectionItem[];
  busy: boolean;
  onClose: () => void;
  onSave: (payload: {
    Username: string;
    Email: string;
    Password: string;
    RollNumber: string;
    AdmissionDate: string | null;
    ClassId: number | null;
    SectionId: number | null;
  }) => void;
}) {
  const [form, setForm] = useState({
    Username: "",
    Email: "",
    Password: "",
    RollNumber: "",
    AdmissionDate: "",
    ClassId: "",
    SectionId: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const sectionsForChosen = useSectionsForClass(sections, form.ClassId ? Number(form.ClassId) : null);

  return (
    <Modal title="Add student" subtitle="Creates the login and student record together" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // The API only enrols when both ids are present, so sending half a
          // pair would silently create an unassigned student.
          onSave({
            Username: form.Username.trim(),
            Email: form.Email.trim(),
            Password: form.Password,
            RollNumber: form.RollNumber.trim(),
            AdmissionDate: form.AdmissionDate || null,
            ClassId: form.ClassId ? Number(form.ClassId) : null,
            SectionId: form.SectionId ? Number(form.SectionId) : null,
          });
        }}
        className="space-y-4 px-6 py-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="n-user">Full name</label>
            <input id="n-user" value={form.Username} onChange={set("Username")} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="n-roll">Roll number</label>
            <input id="n-roll" value={form.RollNumber} onChange={set("RollNumber")} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="n-email">Email</label>
            <input id="n-email" type="email" value={form.Email} onChange={set("Email")} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="n-pass">Temporary password</label>
            <input id="n-pass" type="text" value={form.Password} onChange={set("Password")} required minLength={8} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="n-class">Class</label>
            <select
              id="n-class"
              value={form.ClassId}
              onChange={(e) => {
                setForm((f) => ({ ...f, ClassId: e.target.value, SectionId: "" }));
              }}
              className={field}
            >
              <option value="">No class yet</option>
              {classes.map((c) => (
                <option key={c.Id} value={c.Id}>{c.Name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="n-section">Section</label>
            <select
              id="n-section"
              value={form.SectionId}
              onChange={set("SectionId")}
              disabled={!form.ClassId}
              className={field}
            >
              <option value="">{form.ClassId ? "No section yet" : "Choose a class first"}</option>
              {sectionsForChosen.map((s) => (
                <option key={s.Id} value={s.Id}>{s.Name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="n-admit">Admission date</label>
            <input id="n-admit" type="date" value={form.AdmissionDate} onChange={set("AdmissionDate")} className={field} />
            <p className="mt-1.5 text-[11.5px] text-ink-400">
              Leave blank to use today&apos;s date.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={busy} className={primaryBtn}>Create student</button>
        </div>
      </form>
    </Modal>
  );
}
