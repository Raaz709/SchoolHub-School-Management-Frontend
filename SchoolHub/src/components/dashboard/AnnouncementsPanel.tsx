import type { Announcement } from "../../api/announcements";
import { Skeleton } from "../common/Skeleton";

export function AnnouncementsPanel({
  items,
  loading,
}: {
  items: Announcement[];
  loading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-[14px] font-semibold text-ink-900">Announcements</h2>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-[12.5px] text-ink-500">No announcements yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.slice(0, 4).map((a) => (
            <li key={a.Id} className="rounded-xl border border-line bg-line-soft/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-ink-900">{a.Title}</p>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-medium text-ink-500">
                  {a.TargetRole}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[12px] text-ink-500">{a.Content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}