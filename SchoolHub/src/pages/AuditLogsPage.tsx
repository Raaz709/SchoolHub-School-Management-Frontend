import { useCallback, useMemo, useState } from "react";
import { History, RefreshCw, Search } from "lucide-react";
import {
  auditActionLabel,
  auditActionTone,
  fetchAuditLogs,
  formatAuditTimestamp,
  type AuditLog,
} from "../api/auditLogs";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyPanel } from "../components/common/EmptyPanel";
import { Skeleton } from "../components/common/Skeleton";

/* ------------------------------ styling ------------------------------ */

const card = "rounded-2xl border border-line bg-white";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-line-soft disabled:opacity-60";
const field =
  "rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100";
const th =
  "border-b border-line bg-line-soft/40 px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500";
const td = "border-b border-line px-3 py-2.5 text-ink-700";

/**
 * The admin audit trail. `GET /api/auditlogs` takes no parameters and returns
 * the whole history newest-first, so the filtering here is client-side and the
 * counts shown are always the counts actually on screen.
 */
export function AuditLogsPage() {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const logs = useAsync(useCallback((signal: AbortSignal) => fetchAuditLogs(signal), []));
  const rows = useMemo(() => logs.data ?? [], [logs.data]);

  /** Filter options come from the data, so a new action needs no code change. */
  const actions = useMemo(
    () => Array.from(new Set(rows.map((log) => log.Action))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((log) => {
      if (action !== "all" && log.Action !== action) return false;
      if (!needle) return true;
      return (
        log.Action.toLowerCase().includes(needle) ||
        auditActionLabel(log.Action).toLowerCase().includes(needle) ||
        (log.Username ?? "").toLowerCase().includes(needle) ||
        (log.Details ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, query, action]);

  const filtering = query.trim() !== "" || action !== "all";

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="Recorded staff activity, newest first."
        action={
          <button onClick={logs.refetch} className={ghostBtn} disabled={logs.loading}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.9} />
            {logs.loading ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className={`${card} mb-5 flex flex-wrap items-center gap-3 p-4`}>
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            strokeWidth={1.9}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action or details..."
            className={`${field} w-full pl-10`}
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          aria-label="Filter by action"
          className={field}
        >
          <option value="all">All actions</option>
          {actions.map((code) => (
            <option key={code} value={code}>
              {auditActionLabel(code)}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-ink-500">
          {filtering ? `${filtered.length} of ${rows.length}` : `${rows.length} entries`}
        </span>
      </div>

      {logs.error ? (
        <ErrorState
          message={logs.error.message}
          status={logs.status}
          onRetry={logs.refetch}
        />
      ) : logs.loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyPanel message="No activity has been recorded yet." />
      ) : filtered.length === 0 ? (
        <EmptyPanel message="No entries match this search." />
      ) : (
        <div className={`${card} overflow-hidden`}>
          <header className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
            <History className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
            Activity
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Actor</th>
                  <th className={th}>Action</th>
                  <th className={th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <AuditRow key={log.Id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function AuditRow({ log }: { log: AuditLog }) {
  return (
    <tr>
      <td className={`${td} whitespace-nowrap align-top`}>
        <span className="block text-ink-900">{formatAuditTimestamp(log.CreatedAt)}</span>
        {log.IpAddress && (
          <span className="block text-[11px] text-ink-400">{log.IpAddress}</span>
        )}
      </td>
      <td className={`${td} whitespace-nowrap align-top`}>
        {log.Username ?? (
          // The account behind the entry was deleted; the row outlives it.
          <span className="text-ink-400 italic">deleted user</span>
        )}
      </td>
      <td className={`${td} align-top`}>
        <span
          className={
            "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 " +
            auditActionTone(log.Action)
          }
        >
          {auditActionLabel(log.Action)}
        </span>
      </td>
      <td className={`${td} align-top text-ink-600`}>{log.Details ?? "—"}</td>
    </tr>
  );
}
