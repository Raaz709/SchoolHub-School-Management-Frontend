import type { ActivityItem } from "../../api/dashboard";
import { Skeleton } from "../common/Skeleton";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityPanel({
  items,
  loading,
}: {
  items: ActivityItem[];
  loading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-[14px] font-semibold text-ink-900">Recent Activity</h2>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-[12.5px] text-ink-500">No activity recorded yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {items.map((it, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-ink-900">{it.Action}</p>
                <p className="truncate text-[12px] text-ink-500">{it.Details ?? "-"}</p>
              </div>
              <span className="shrink-0 text-[11px] text-ink-400">
                {timeAgo(it.CreatedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}