import { GraduationCap, PanelLeft } from "lucide-react";
import { NAV_ITEMS } from "../../data/navigation";
import { useNavigation } from "../../context/NavigationContext";
import { cn } from "../../lib/cn";

export function Sidebar() {
  const { activeId, setActiveId, collapsed, toggleCollapsed } = useNavigation();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-line bg-white",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[76px]" : "w-[264px]",
      )}
    >
      {/* Brand row */}
      <div
        className={cn(
          "flex items-center pb-4 pt-5",
          collapsed ? "justify-center px-3" : "justify-between px-5",
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-mint-100">
            <GraduationCap
              className="h-4 w-4 text-mint-600"
              strokeWidth={2.2}
            />
          </span>
          {!collapsed && (
            <span className="text-[19px] font-bold tracking-tight text-ink-900">
              SchoolHub
            </span>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-line-soft hover:text-ink-700"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.9} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="mx-auto mb-3 grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-line-soft hover:text-ink-700"
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.9} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition",
                collapsed && "justify-center px-0",
                active
                  ? "text-ink-900 shadow-[0_6px_16px_-10px_rgba(86,180,70,0.9)]"
                  : "text-ink-700 hover:bg-line-soft",
              )}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(90deg, #dcf6cd 0%, #b7eaa5 100%)",
                    }
                  : undefined
              }
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active
                    ? "text-ink-900"
                    : "text-ink-500 group-hover:text-ink-700",
                )}
                strokeWidth={1.9}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}