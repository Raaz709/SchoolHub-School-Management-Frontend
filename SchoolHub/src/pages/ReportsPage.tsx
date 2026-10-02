import { useCallback, useMemo } from "react";
import { BarChart3, Library, RefreshCw, TrendingDown, Users, Wallet } from "lucide-react";
import {
  fetchFeeCollection,
  fetchStudentsByClass,
  type FeeCollectionRow,
  type ReportFeeStatus,
  type StudentsByClassRow,
} from "../api/reports";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyPanel } from "../components/common/EmptyPanel";
import { Skeleton } from "../components/common/Skeleton";
import { StatCard } from "../components/dashboard/StatCard";

/* ------------------------------ styling ------------------------------ */

const card = "rounded-2xl border border-line bg-white";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-line-soft disabled:opacity-60";
const th =
  "border-b border-line bg-line-soft/40 px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500";
const td = "border-b border-line px-3 py-2.5 text-ink-700";

const money = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number): string {
  return money.format(value);
}

/**
 * Four states, one field: the API has already resolved their precedence the
 * same way the fee ledger does, so the page only colours what it is given.
 */
function statusTone(status: ReportFeeStatus): string {
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

type MoneyTotals = {
  count: number;
  billed: number;
  collected: number;
  outstanding: number;
};

/**
 * Admin reporting: enrolment headcount per class and section, and fee
 * collection grouped by the status the server derives. Both are read-only and
 * Admin-only server-side, so nothing here filters by role.
 */
export function ReportsPage() {
  const byClass = useAsync(useCallback((signal: AbortSignal) => fetchStudentsByClass(signal), []));
  const collection = useAsync(
    useCallback((signal: AbortSignal) => fetchFeeCollection(signal), []),
  );

  const enrolmentRows = useMemo(() => byClass.data ?? [], [byClass.data]);
  const collectionRows = useMemo(() => collection.data ?? [], [collection.data]);

  const enrolment = useMemo(() => {
    const students = enrolmentRows.reduce((sum, row) => sum + row.StudentCount, 0);
    const classes = new Set(enrolmentRows.map((row) => row.ClassName)).size;
    return { students, classes };
  }, [enrolmentRows]);

  const fees = useMemo<MoneyTotals>(() => {
    const sum = (pick: (row: FeeCollectionRow) => number) =>
      collectionRows.reduce((total, row) => total + pick(row), 0);
    return {
      count: sum((row) => row.FeeCount),
      billed: sum((row) => row.TotalAmount),
      collected: sum((row) => row.TotalPaid),
      outstanding: sum((row) => row.TotalOutstanding),
    };
  }, [collectionRows]);

  // One banner for the pair: a single retry reloads whichever report failed.
  const error = byClass.error ?? collection.error;
  const status = byClass.status ?? collection.status;
  const loading = byClass.loading || collection.loading;

  function refresh() {
    byClass.refetch();
    collection.refetch();
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Enrolment and fee collection across the school."
        action={
          <button onClick={refresh} className={ghostBtn} disabled={loading}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.9} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students reported"
          value={enrolment.students}
          icon={Users}
          tone="sky"
          hint="Sum of the class and section rows below"
        />
        <StatCard
          label="Classes"
          value={enrolment.classes}
          icon={Library}
          tone="blue"
          hint="Classes appearing in the enrolment report"
        />
        <StatCard
          label="Collected"
          value={formatMoney(fees.collected)}
          icon={Wallet}
          tone="green"
          hint={`of ${formatMoney(fees.billed)} billed`}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(fees.outstanding)}
          icon={TrendingDown}
          tone="amber"
          hint={`across ${fees.count} fee${fees.count === 1 ? "" : "s"}`}
        />
      </div>

      {error ? (
        <ErrorState message={error.message} status={status} onRetry={refresh} />
      ) : loading ? (
        <div className="space-y-5">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <EnrolmentReport rows={enrolmentRows} />
          <CollectionReport rows={collectionRows} totals={fees} />
        </div>
      )}
    </>
  );
}

/* ------------------------------ reports ------------------------------ */

function EnrolmentReport({ rows }: { rows: StudentsByClassRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.StudentCount, 0);

  return (
    <section className={`${card} overflow-hidden`}>
      <header className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
        <Users className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
        Students by class
        <span className="text-[12px] font-normal text-ink-500">
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </span>
      </header>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyPanel message="No classes have enrolled students yet." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={th}>Class</th>
                <th className={th}>Section</th>
                <th className={`${th} text-right`}>Students</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.ClassName}::${row.SectionName ?? ""}`}>
                  <th scope="row" className={`${td} text-left font-medium text-ink-900`}>
                    {row.ClassName}
                  </th>
                  <td className={td}>{row.SectionName ?? "All sections"}</td>
                  <td className={`${td} text-right font-semibold text-ink-900`}>
                    {row.StudentCount}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} className={`${td} text-left font-semibold text-ink-900`}>
                  Total
                </th>
                <td className={`${td} text-right font-bold text-ink-900`}>{total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

function CollectionReport({ rows, totals }: { rows: FeeCollectionRow[]; totals: MoneyTotals }) {
  return (
    <section className={`${card} overflow-hidden`}>
      <header className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
        <BarChart3 className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
        Fee collection
        <span className="text-[12px] font-normal text-ink-500">Grouped by derived status</span>
      </header>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyPanel message="No fees have been assigned to students yet." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Fees</th>
                <th className={`${th} text-right`}>Billed</th>
                <th className={`${th} text-right`}>Collected</th>
                <th className={`${th} text-right`}>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.Status}>
                  <th scope="row" className={`${td} text-left`}>
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 " +
                        statusTone(row.Status)
                      }
                    >
                      {row.Status}
                    </span>
                  </th>
                  <td className={`${td} text-right`}>{row.FeeCount}</td>
                  <td className={`${td} text-right`}>{formatMoney(row.TotalAmount)}</td>
                  <td className={`${td} text-right text-mint-700`}>{formatMoney(row.TotalPaid)}</td>
                  <td className={`${td} text-right font-semibold text-ink-900`}>
                    {formatMoney(row.TotalOutstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className={`${td} text-left font-semibold text-ink-900`}>
                  Total
                </th>
                <td className={`${td} text-right font-semibold text-ink-900`}>{totals.count}</td>
                <td className={`${td} text-right font-semibold text-ink-900`}>
                  {formatMoney(totals.billed)}
                </td>
                <td className={`${td} text-right font-semibold text-mint-700`}>
                  {formatMoney(totals.collected)}
                </td>
                <td className={`${td} text-right font-bold text-ink-900`}>
                  {formatMoney(totals.outstanding)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
