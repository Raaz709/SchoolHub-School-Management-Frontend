import { useCallback, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Pencil,
  Plus,
  Receipt,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  assignFee,
  createFeeStructure,
  deleteFeeStructure,
  fetchAssignments,
  fetchCollectionSummary,
  fetchFeeStructures,
  fetchPayments,
  recordPayment,
  removeAssignment,
  updateFeeStructure,
  PAYMENT_METHODS,
  type Assignment,
  type CollectionSummary,
  type FeeStatus,
  type FeeStructure,
  type Payment,
} from "../api/fees";
import { fetchClasses, type ClassItem } from "../api/academic";
import { fetchStudents, type Student } from "../api/students";
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

/** Only the day matters: a DATE column arrives with a midnight time part. */
function day(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "—";
}

const money = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number): string {
  return money.format(value);
}

/** Four states, one field: the server has already resolved their precedence. */
function statusTone(status: FeeStatus): string {
  switch (status) {
    case "Paid":
      return "bg-mint-50 text-mint-700 ring-mint-200";
    case "Partial":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Overdue":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-line-soft text-ink-600 ring-line";
  }
}

function StatusPill({ status }: { status: FeeStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 " +
        statusTone(status)
      }
    >
      {status}
    </span>
  );
}

export function FeesPage() {
  const { user } = useAuth();
  if ((user?.role ?? "") !== "Admin") {
    return (
      <>
        <PageHeader title="Fees Collection" subtitle="Fee collection is restricted to administrators." />
        <div className={`${card} p-8 text-center`}>
          <Wallet className="mx-auto mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">
            Only an administrator can manage fee structures, assignments and payments.
          </p>
        </div>
      </>
    );
  }
  return <ManageFees />;
}

function ManageFees() {
  const [notice, setNotice] = useState<Notice>(null);

  // Ledger filters live here because the ledger's request is created here, so a
  // write anywhere can refetch every panel that the write changes.
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const summary = useAsync(useCallback((signal: AbortSignal) => fetchCollectionSummary(signal), []));
  const structures = useAsync(useCallback((signal: AbortSignal) => fetchFeeStructures(signal), []));
  const classes = useAsync(useCallback((signal: AbortSignal) => fetchClasses(signal), []));
  const students = useAsync(useCallback((signal: AbortSignal) => fetchStudents(signal), []));
  const assignments = useAsync(
    useCallback(
      (signal: AbortSignal) =>
        fetchAssignments(
          {
            classId: classFilter ? Number(classFilter) : null,
            status: statusFilter || null,
            search: search.trim() || null,
          },
          signal,
        ),
      [classFilter, statusFilter, search],
    ),
  );
  const payments = useAsync(useCallback((signal: AbortSignal) => fetchPayments(null, signal), []));

  const { refetch: refetchSummary } = summary;
  const { refetch: refetchStructures } = structures;
  const { refetch: refetchAssignments } = assignments;
  const { refetch: refetchPayments } = payments;

  // A payment changes the summary, the ledger and the payment list at once, so
  // one write refreshes all of them rather than each panel guessing.
  const refresh = useCallback(() => {
    refetchSummary();
    refetchStructures();
    refetchAssignments();
    refetchPayments();
  }, [refetchSummary, refetchStructures, refetchAssignments, refetchPayments]);

  const structureRows = useMemo(() => structures.data ?? [], [structures.data]);
  const classRows = useMemo(() => classes.data ?? [], [classes.data]);
  const studentRows = useMemo(() => students.data ?? [], [students.data]);

  return (
    <>
      <PageHeader
        title="Fees Collection"
        subtitle="Define what is charged, assign it to students, then record what comes in."
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

      <SummaryCards summary={summary.data} loading={summary.loading} error={summary.error} onRetry={refetchSummary} />

      <AssignFeeForm
        structures={structureRows}
        classes={classRows}
        students={studentRows}
        loading={structures.loading}
        onDone={(text) => {
          setNotice({ tone: "ok", text });
          refresh();
        }}
        onFailed={(text) => setNotice({ tone: "err", text })}
      />

      <StructurePanel
        rows={structureRows}
        classes={classRows}
        loading={structures.loading}
        error={structures.error && { message: structures.error.message, status: structures.status }}
        onRetry={refetchStructures}
        onNotice={setNotice}
        onChanged={refresh}
      />

      <LedgerPanel
        rows={assignments.data ?? []}
        loading={assignments.loading}
        error={assignments.error && { message: assignments.error.message, status: assignments.status }}
        onRetry={refetchAssignments}
        classes={classRows}
        classFilter={classFilter}
        statusFilter={statusFilter}
        search={search}
        onClassFilter={setClassFilter}
        onStatusFilter={setStatusFilter}
        onSearch={setSearch}
        onNotice={setNotice}
        onChanged={refresh}
      />

      <PaymentHistory
        rows={payments.data ?? []}
        loading={payments.loading}
        error={payments.error && { message: payments.error.message, status: payments.status }}
        onRetry={refetchPayments}
      />
    </>
  );
}

/* ------------------------------ summary ------------------------------ */

function SummaryCards({
  summary,
  loading,
  error,
  onRetry,
}: {
  summary: CollectionSummary | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <div className={`${card} mb-5 p-5`}>
        <ErrorState message={error.message} status={null} onRetry={onRetry} />
      </div>
    );
  }
  if (loading || !summary) {
    return (
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const tiles: { label: string; value: number; tone: string; note: string }[] = [
    { label: "Billed", value: summary.TotalBilled, tone: "text-ink-900", note: "assigned fees" },
    { label: "Collected", value: summary.TotalCollected, tone: "text-mint-600", note: "payments received" },
    { label: "Outstanding", value: summary.TotalOutstanding, tone: "text-amber-600", note: "still owed" },
    { label: "Overdue", value: summary.TotalOverdue, tone: "text-rose-600", note: "past due date" },
  ];

  return (
    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className={`${card} p-5`}>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">{t.label}</p>
          <p className={`mt-1.5 text-[22px] font-semibold ${t.tone}`}>{formatMoney(t.value)}</p>
          <p className="mt-0.5 text-[11.5px] text-ink-400">{t.note}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ assign a fee ------------------------------ */

function AssignFeeForm({
  structures,
  classes,
  students,
  loading,
  onDone,
  onFailed,
}: {
  structures: FeeStructure[];
  classes: ClassItem[];
  students: Student[];
  loading: boolean;
  onDone: (text: string) => void;
  onFailed: (text: string) => void;
}) {
  const [structureId, setStructureId] = useState("");
  const [scope, setScope] = useState<"class" | "student">("class");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const ready =
    structureId !== "" &&
    (scope === "class" ? classId !== "" : studentId !== "") &&
    dueDate !== "" &&
    !busy;

  async function submit() {
    setBusy(true);
    try {
      const result = await assignFee({
        FeeStructureId: Number(structureId),
        StudentId: scope === "student" ? Number(studentId) : null,
        ClassId: scope === "class" ? Number(classId) : null,
        DueDate: dueDate,
      });
      onDone(result.Message);
      setStructureId("");
      setClassId("");
      setStudentId("");
    } catch (err) {
      onFailed(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${card} mb-5 p-5`}>
      <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-ink-900">
        <Banknote className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
        Assign a fee
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_120px_1fr_160px_auto] lg:items-end">
        <div>
          <label className={label} htmlFor="fee-structure">Fee</label>
          <select
            id="fee-structure"
            value={structureId}
            onChange={(e) => setStructureId(e.target.value)}
            className={field}
            disabled={loading || structures.length === 0}
          >
            <option value="">{loading ? "Loading fees..." : "Select a fee"}</option>
            {structures.map((s) => (
              <option key={s.Id} value={s.Id}>
                {s.Name} · {formatMoney(s.Amount)}
                {s.ClassId ? ` · ${s.ClassName ?? "class"}` : " · school-wide"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="fee-scope">Assign to</label>
          <select
            id="fee-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as "class" | "student")}
            className={field}
          >
            <option value="class">Whole class</option>
            <option value="student">One student</option>
          </select>
        </div>
        <div>
          {scope === "class" ? (
            <>
              <label className={label} htmlFor="fee-class">Class</label>
              <select
                id="fee-class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className={field}
                disabled={classes.length === 0}
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.Id} value={c.Id}>{c.Name}</option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className={label} htmlFor="fee-student">Student</label>
              <select
                id="fee-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={field}
                disabled={students.length === 0}
              >
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.Id} value={s.Id}>
                    {s.Username} · {s.RollNumber}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div>
          <label className={label} htmlFor="fee-due">Due date</label>
          <input
            id="fee-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={field}
          />
        </div>
        <button onClick={() => void submit()} className={primaryBtn} disabled={!ready}>
          <Plus className="h-4 w-4" />
          {busy ? "Assigning..." : "Assign"}
        </button>
      </div>
      <p className="mt-2.5 text-[11.5px] text-ink-400">
        Assigning a fee a student already owes is skipped, not charged twice. A class-scoped fee can
        only go to its own class.
      </p>
    </div>
  );
}

/* ------------------------------ structures ------------------------------ */

function StructurePanel({
  rows,
  classes,
  loading,
  error,
  onRetry,
  onNotice,
  onChanged,
}: {
  rows: FeeStructure[];
  classes: ClassItem[];
  loading: boolean;
  error: { message: string; status: number | null } | null;
  onRetry: () => void;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<FeeStructure | "new" | null>(null);

  async function remove(row: FeeStructure) {
    try {
      const result = await deleteFeeStructure(row.Id);
      onNotice({ tone: "ok", text: result.Message });
      if (editing !== "new" && editing?.Id === row.Id) setEditing(null);
      onChanged();
    } catch (err) {
      // A refused delete is expected here: the message names the assignments.
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className={`${card} mb-5 overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          <Wallet className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
          Fee structures
          <span className="text-[12px] font-normal text-ink-500">{rows.length} total</span>
        </div>
        <button onClick={() => setEditing("new")} className={ghostBtn}>
          <Plus className="h-4 w-4" />
          New fee
        </button>
      </div>

      {editing !== null && (
        <StructureForm
          row={editing === "new" ? null : editing}
          classes={classes}
          onDone={(text) => {
            onNotice({ tone: "ok", text });
            setEditing(null);
            onChanged();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

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
        <div className="grid place-items-center py-14 text-center">
          <Wallet className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">No fee structures yet. Add one to start charging.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li
              key={row.Id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px]"
            >
              <span className="min-w-0">
                <span className="font-semibold text-ink-900">{row.Name}</span>
                <span className="ml-2 text-[11.5px] text-ink-400">
                  {row.ClassName ?? "School-wide"}
                </span>
                <span className="ml-3 text-[12px] text-ink-500">{formatMoney(row.Amount)}</span>
                <span className="ml-3 text-[12px] text-ink-500">
                  {row.AssignedCount} assigned
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <button onClick={() => setEditing(row)} className={ghostBtn}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button onClick={() => void remove(row)} className={dangerBtn}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StructureForm({
  row,
  classes,
  onDone,
  onCancel,
}: {
  row: FeeStructure | null;
  classes: ClassItem[];
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const isEdit = row != null;
  const [name, setName] = useState(row?.Name ?? "");
  const [amount, setAmount] = useState(row == null ? "" : String(row.Amount));
  const [classId, setClassId] = useState(row?.ClassId == null ? "" : String(row.ClassId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim().length > 0 && Number(amount) > 0 && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    const payload = {
      Name: name.trim(),
      Amount: Number(amount),
      ClassId: classId === "" ? null : Number(classId),
    };
    try {
      const result =
        row == null ? await createFeeStructure(payload) : await updateFeeStructure(row.Id, payload);
      onDone(result.Message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-line bg-line-soft/30 px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-[1.5fr_140px_1fr_auto] sm:items-end">
        <div>
          <label className={label} htmlFor="fs-name">Name</label>
          <input
            id="fs-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Term 1 Tuition"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="fs-amount">Amount</label>
          <input
            id="fs-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="fs-class">Applies to</label>
          <select
            id="fs-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={field}
          >
            <option value="">School-wide</option>
            {classes.map((c) => (
              <option key={c.Id} value={c.Id}>{c.Name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
          <button onClick={() => void submit()} className={primaryBtn} disabled={!ready}>
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : isEdit ? "Save" : "Add fee"}
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] font-medium text-rose-600">
          {error}
        </div>
      )}
      {isEdit && row != null && row.AssignedCount > 0 && (
        <p className="mt-2.5 text-[11.5px] text-amber-600">
          {row.AssignedCount} student(s) already have this fee, so its amount cannot be changed until
          those assignments are removed.
        </p>
      )}
    </div>
  );
}

/* ------------------------------ ledger ------------------------------ */

function LedgerPanel({
  rows,
  loading,
  error,
  onRetry,
  classes,
  classFilter,
  statusFilter,
  search,
  onClassFilter,
  onStatusFilter,
  onSearch,
  onNotice,
  onChanged,
}: {
  rows: Assignment[];
  loading: boolean;
  error: { message: string; status: number | null } | null;
  onRetry: () => void;
  classes: ClassItem[];
  classFilter: string;
  statusFilter: string;
  search: string;
  onClassFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onSearch: (value: string) => void;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
}) {
  const [searchInput, setSearchInput] = useState(search);
  const [payingId, setPayingId] = useState<number | null>(null);

  async function remove(row: Assignment) {
    try {
      const result = await removeAssignment(row.Id);
      onNotice({ tone: "ok", text: result.Message });
      if (payingId === row.Id) setPayingId(null);
      onChanged();
    } catch (err) {
      // Refused once money exists: the message names how much.
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className={`${card} mb-5 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          <Receipt className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
          Student ledger
          <span className="text-[12px] font-normal text-ink-500">{rows.length} rows</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => onClassFilter(e.target.value)}
            className={`${field} w-40`}
            aria-label="Filter by class"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.Id} value={c.Id}>{c.Name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
            className={`${field} w-36`}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Overdue">Overdue</option>
            <option value="Paid">Paid</option>
          </select>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch(searchInput);
            }}
            onBlur={() => onSearch(searchInput)}
            placeholder="Name or roll no"
            className={`${field} w-44`}
            aria-label="Search students"
          />
        </div>
      </div>

      {error ? (
        <div className="p-5">
          <ErrorState message={error.message} status={error.status} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center py-14 text-center">
          <Receipt className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">No fee assignments match these filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.4fr_1fr_100px_100px_110px_120px_150px] items-center gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <span>Student</span>
              <span>Fee</span>
              <span>Amount</span>
              <span>Paid</span>
              <span>Outstanding</span>
              <span>Status</span>
              <span className="text-right">Due</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((row) => (
                <li key={row.Id}>
                  <div className="grid grid-cols-[1.4fr_1fr_100px_100px_110px_120px_150px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700">
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-ink-900">{row.StudentName}</span>
                      <span className="ml-1.5 text-[11.5px] text-ink-400">
                        {row.AdmissionNumber ?? ""}
                        {row.ClassName ? ` · ${row.ClassName}` : ""}
                      </span>
                    </span>
                    <span className="truncate text-ink-600">{row.FeeName}</span>
                    <span>{formatMoney(row.Amount)}</span>
                    <span>{formatMoney(row.Paid)}</span>
                    <span className="font-semibold text-ink-900">{formatMoney(row.Outstanding)}</span>
                    <span><StatusPill status={row.Status} /></span>
                    <span className="flex items-center justify-end gap-1.5">
                      <span className="text-[12px] text-ink-500">{day(row.DueDate)}</span>
                      {row.Outstanding > 0 ? (
                        <button
                          onClick={() => setPayingId(payingId === row.Id ? null : row.Id)}
                          className={ghostBtn}
                        >
                          {payingId === row.Id ? <X className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                          Pay
                        </button>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-mint-500" strokeWidth={2} />
                      )}
                      <button onClick={() => void remove(row)} className={dangerBtn} aria-label="Remove assignment">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                  {payingId === row.Id && (
                    <RecordPaymentForm
                      row={row}
                      onDone={(text) => {
                        onNotice({ tone: "ok", text });
                        setPayingId(null);
                        onChanged();
                      }}
                      onCancel={() => setPayingId(null)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordPaymentForm({
  row,
  onDone,
  onCancel,
}: {
  row: Assignment;
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(String(row.Outstanding));
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entered = Number(amount);
  const ready = entered > 0 && entered <= row.Outstanding && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await recordPayment({
        StudentFeeId: row.Id,
        AmountPaid: entered,
        PaymentMethod: method,
        TransactionReference: reference.trim(),
      });
      onDone(result.Message);
    } catch (err) {
      // Overpayment is refused with the balance named, so this is the expected path.
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-line bg-mint-50/30 px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-[150px_170px_1fr_auto] sm:items-end">
        <div>
          <label className={label} htmlFor={`pay-amount-${row.Id}`}>Amount</label>
          <input
            id={`pay-amount-${row.Id}`}
            type="number"
            min={0}
            max={row.Outstanding}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`pay-method-${row.Id}`}>Method</label>
          <select
            id={`pay-method-${row.Id}`}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={field}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor={`pay-ref-${row.Id}`}>Reference (optional)</label>
          <input
            id={`pay-ref-${row.Id}`}
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Receipt or transaction id"
            className={field}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
          <button onClick={() => void submit()} className={primaryBtn} disabled={!ready}>
            <Save className="h-4 w-4" />
            {busy ? "Recording..." : "Record payment"}
          </button>
        </div>
      </div>
      <p className="mt-2.5 text-[11.5px] text-ink-400">
        {formatMoney(row.Outstanding)} outstanding on {row.FeeName}. Overpayment is refused rather
        than carried as credit.
      </p>
      {error && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] font-medium text-rose-600">
          {error}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ payments ------------------------------ */

function PaymentHistory({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: Payment[];
  loading: boolean;
  error: { message: string; status: number | null } | null;
  onRetry: () => void;
}) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
        <Banknote className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
        Recent payments
        <span className="text-[12px] font-normal text-ink-500">{rows.length} total</span>
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
        <div className="grid place-items-center py-14 text-center">
          <Banknote className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">No payments recorded yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((p: Payment) => (
            <li
              key={p.Id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px] text-ink-700"
            >
              <span className="min-w-0">
                <span className="font-medium text-ink-900">{p.StudentName}</span>
                <span className="ml-1.5 text-[11.5px] text-ink-400">{p.AdmissionNumber ?? ""}</span>
                <span className="ml-3 text-[12px] text-ink-500">{p.FeeName}</span>
                {p.TransactionReference && (
                  <span className="ml-3 text-[11.5px] text-ink-400">{p.TransactionReference}</span>
                )}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-[12px] text-ink-500">{p.PaymentMethod ?? "—"}</span>
                <span className="text-[12px] text-ink-500">{day(p.PaymentDate)}</span>
                <span className="font-semibold text-mint-600">{formatMoney(p.AmountPaid)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
