import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Search, ShieldAlert, UserRound, X } from "lucide-react";
import {
  assignTeacherSubjects,
  createTeacher,
  deactivateTeacher,
  fetchTeachers,
  updateTeacher,
  type Teacher,
} from "../api/teachers";
import { fetchDepartments, fetchSubjects, type Department, type Subject } from "../api/academic";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../context/AuthContext";
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

export function TeachersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [editing, setEditing] = useState<Teacher | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  // Guarded so a non-admin never issues a request that would 403.
  const loadTeachers = useCallback(
    (signal: AbortSignal) => (isAdmin ? fetchTeachers(signal) : Promise.resolve([])),
    [isAdmin],
  );
  const teachers = useAsync(loadTeachers);

  // Both lookups back the modal dropdowns; they are admin-only endpoints too.
  const loadDepartments = useCallback(
    (signal: AbortSignal) => (isAdmin ? fetchDepartments(signal) : Promise.resolve([])),
    [isAdmin],
  );
  const departments = useAsync(loadDepartments);

  const loadSubjects = useCallback(
    (signal: AbortSignal) => (isAdmin ? fetchSubjects(signal) : Promise.resolve([])),
    [isAdmin],
  );
  const subjects = useAsync(loadSubjects);

  const rows = useMemo(() => teachers.data ?? [], [teachers.data]);
  const departmentOptions = useMemo(() => departments.data ?? [], [departments.data]);
  const subjectOptions = useMemo(() => subjects.data ?? [], [subjects.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((t) => {
      if (status === "active" && !t.IsActive) return false;
      if (status === "inactive" && t.IsActive) return false;
      if (!q) return true;
      return [t.Username, t.Email, t.EmployeeCode, t.DepartmentName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, status]);

  const activeCount = rows.filter((t) => t.IsActive).length;

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setNotice(null);
    try {
      setNotice({ tone: "ok", text: await action() });
      teachers.refetch();
      departments.refetch();
      subjects.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setNotice({ tone: "err", text: message });
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader title="Teachers" subtitle="Staff directory and subject allocation." />
        <div className="grid place-items-center rounded-2xl border border-line bg-white px-6 py-20 text-center">
          <ShieldAlert className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13.5px] text-ink-500">
            Teacher management is restricted to administrators.
          </p>
        </div>
      </>
    );
  }

  if (teachers.error) {
    return (
      <>
        <PageHeader title="Teachers" subtitle="Staff directory and subject allocation." />
        <ErrorState
          message={teachers.error.message}
          status={teachers.status}
          onRetry={teachers.refetch}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle={`${rows.length} teacher${rows.length === 1 ? "" : "s"} · ${activeCount} active`}
        action={
          <button onClick={() => setCreating(true)} className={primaryBtn}>
            <Plus className="h-4 w-4" />
            Add Teacher
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

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            strokeWidth={1.9}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, employee code, or department..."
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
          />
        </div>

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
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[120px_1fr_1fr_160px_120px_100px_150px] gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
            <span>Emp. Code</span>
            <span>Name</span>
            <span>Email</span>
            <span>Department</span>
            <span>Hired</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {teachers.loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <UserRound className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
              <p className="text-[13px] text-ink-500">No teachers match your filters.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((t) => (
                <li
                  key={t.Id}
                  className="grid grid-cols-[120px_1fr_1fr_160px_120px_100px_150px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700 hover:bg-line-soft/40"
                >
                  <span className="font-mono text-[12.5px] text-ink-500">{t.EmployeeCode}</span>
                  <span className="truncate font-medium text-ink-900">{t.Username}</span>
                  <span className="truncate text-ink-500">{t.Email}</span>
                  <span className="truncate">{t.DepartmentName ?? "—"}</span>
                  <span className="text-ink-500">{formatDate(t.HireDate)}</span>
                  <span>
                    <span className={statusPill(t.IsActive)}>{t.IsActive ? "Active" : "Inactive"}</span>
                  </span>
                  <span className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditing(t)}
                      title="Edit teacher"
                      className="rounded-lg border border-line p-1.5 text-ink-500 transition-colors hover:bg-line-soft hover:text-ink-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          t.IsActive &&
                          !window.confirm(
                            `Deactivate ${t.Username}? They will be unable to sign in.`,
                          )
                        ) {
                          return;
                        }
                        if (!t.IsActive) return;
                        void run(async () => {
                          await deactivateTeacher(t.Id);
                          return `${t.Username} deactivated.`;
                        });
                      }}
                      title={t.IsActive ? "Deactivate account" : "Already inactive"}
                      disabled={busy || !t.IsActive}
                      className={
                        "rounded-lg border px-2 py-1.5 text-[11.5px] font-semibold transition-colors " +
                        (t.IsActive
                          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                          : "cursor-not-allowed border-line text-ink-400")
                      }
                    >
                      {t.IsActive ? "Deactivate" : "Inactive"}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <EditTeacherModal
          teacher={editing}
          departments={departmentOptions}
          subjects={subjectOptions}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={(payload) =>
            run(async () => {
              await updateTeacher(editing.Id, payload);
              setEditing(null);
              return `${payload.EmployeeCode} updated.`;
            })
          }
          onSaveSubjects={(subjectIds) =>
            run(async () => {
              await assignTeacherSubjects(editing.Id, subjectIds);
              return `Subjects updated for ${editing.Username}.`;
            })
          }
        />
      )}

      {creating && (
        <CreateTeacherModal
          departments={departmentOptions}
          busy={busy}
          onClose={() => setCreating(false)}
          onSave={(payload) =>
            run(async () => {
              await createTeacher(payload);
              setCreating(false);
              return `${payload.Username} added to the staff directory.`;
            })
          }
        />
      )}
    </>
  );
}

/* ----------------------------- modals ----------------------------- */

function EditTeacherModal({
  teacher,
  departments,
  subjects,
  busy,
  onClose,
  onSave,
  onSaveSubjects,
}: {
  teacher: Teacher;
  departments: Department[];
  subjects: Subject[];
  busy: boolean;
  onClose: () => void;
  onSave: (payload: { DepartmentId: number; EmployeeCode: string }) => void;
  onSaveSubjects: (subjectIds: number[]) => void;
}) {
  const [code, setCode] = useState(teacher.EmployeeCode);
  const [dept, setDept] = useState(teacher.DepartmentId ? String(teacher.DepartmentId) : "");
  // Current allocation comes from the subject list: a subject belongs to the
  // teacher whose id matches its TeacherId.
  const [picked, setPicked] = useState<number[]>(
    subjects.filter((s) => s.TeacherId === teacher.Id).map((s) => s.Id),
  );

  function toggle(id: number) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Modal title="Edit teacher" subtitle={teacher.Username} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ DepartmentId: Number(dept) || 0, EmployeeCode: code });
        }}
        className="space-y-4 px-6 py-5"
      >
        <div>
          <label className={label} htmlFor="emp-code">Employee code</label>
          <input id="emp-code" value={code} onChange={(e) => setCode(e.target.value)} required className={field} />
        </div>

        <div>
          <label className={label} htmlFor="dept-id">Department</label>
          <select
            id="dept-id"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className={field}
          >
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d.Id} value={d.Id}>{d.Name}</option>
            ))}
          </select>
          {departments.length === 0 && (
            <p className="mt-1.5 text-[11.5px] text-ink-400">
              No departments are set up yet.
            </p>
          )}
        </div>

        <div>
          <label className={label} htmlFor="subjects">Subjects</label>
          {subjects.length === 0 ? (
            <p className="text-[11.5px] text-ink-400">No subjects have been created yet.</p>
          ) : (
            <div
              id="subjects"
              className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-line bg-white p-2"
            >
              {subjects.map((s) => (
                <label
                  key={s.Id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-ink-700 transition-colors hover:bg-line-soft"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-mint-600"
                    checked={picked.includes(s.Id)}
                    onChange={() => toggle(s.Id)}
                  />
                  <span className="font-medium">{s.Name}</span>
                  <span className="text-[11px] text-ink-400">{s.Code}</span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-1.5 text-[11.5px] text-ink-400">
            Saving a subject allocation replaces the teacher&apos;s current subjects.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={busy} className={primaryBtn}>Save changes</button>
        </div>
      </form>

      {subjects.length > 0 && (
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => onSaveSubjects(picked)}
            className={ghostBtn}
          >
            Save subjects only
          </button>
        </div>
      )}
    </Modal>
  );
}

function CreateTeacherModal({
  departments,
  busy,
  onClose,
  onSave,
}: {
  departments: Department[];
  busy: boolean;
  onClose: () => void;
  onSave: (payload: {
    Username: string;
    Email: string;
    Password: string;
    EmployeeCode: string;
    DepartmentId: number | null;
    HireDate: string | null;
  }) => void;
}) {
  const [form, setForm] = useState({
    Username: "",
    Email: "",
    Password: "",
    EmployeeCode: "",
    DepartmentId: "",
    HireDate: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title="Add teacher" subtitle="Creates the login and staff record together" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            Username: form.Username,
            Email: form.Email,
            Password: form.Password,
            EmployeeCode: form.EmployeeCode,
            DepartmentId: form.DepartmentId ? Number(form.DepartmentId) : null,
            HireDate: form.HireDate || null,
          });
        }}
        className="space-y-4 px-6 py-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="c-user">Full name</label>
            <input id="c-user" value={form.Username} onChange={set("Username")} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="c-code">Employee code</label>
            <input id="c-code" value={form.EmployeeCode} onChange={set("EmployeeCode")} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="c-email">Email</label>
            <input id="c-email" type="email" value={form.Email} onChange={set("Email")} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="c-pass">Temporary password</label>
            <input id="c-pass" type="text" value={form.Password} onChange={set("Password")} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="c-dept">Department</label>
            <select id="c-dept" value={form.DepartmentId} onChange={set("DepartmentId")} className={field}>
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d.Id} value={d.Id}>{d.Name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="c-hire">Hire date</label>
            <input id="c-hire" type="date" value={form.HireDate} onChange={set("HireDate")} className={field} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={busy} className={primaryBtn}>Create teacher</button>
        </div>
      </form>
    </Modal>
  );
}
