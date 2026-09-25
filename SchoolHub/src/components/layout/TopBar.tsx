import { Bell, ChevronDown, Search } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-6 lg:px-8">
      <div className="relative w-full max-w-[420px]">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          strokeWidth={1.9}
        />
        <input
          type="text"
          placeholder="Search students, staff, classes..."
          className="w-full rounded-xl border border-line bg-line-soft/60 py-2.5 pl-10 pr-4 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint-100"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink-500 transition hover:bg-line-soft hover:text-ink-700"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-mint-500" />
        </button>
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-mint-100 text-[11px] font-bold text-mint-600">
            AD
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[12.5px] font-semibold text-ink-900">Admin</span>
            <span className="text-[11px] text-ink-500">Administrator</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-400" strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}