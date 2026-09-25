import type { LucideIcon } from "lucide-react";

type Tone = "amber" | "blue" | "violet" | "green" | "rose" | "sky";

const TONES: Record<Tone, { tile: string; icon: string }> = {
  amber:  { tile: "bg-amber-50",  icon: "text-amber-500" },
  blue:   { tile: "bg-blue-50",   icon: "text-blue-500" },
  violet: { tile: "bg-violet-50", icon: "text-violet-500" },
  green:  { tile: "bg-mint-50",   icon: "text-mint-600" },
  rose:   { tile: "bg-rose-50",   icon: "text-rose-500" },
  sky:    { tile: "bg-sky-50",    icon: "text-sky-500" },
};

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: Tone;
  hint?: string;
};

export function StatCard({ label, value, icon: Icon, tone, hint }: StatCardProps) {
  const t = TONES[tone];
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${t.tile}`}>
        <Icon className={`h-5 w-5 ${t.icon}`} strokeWidth={1.9} />
      </span>
      <p className="mt-3.5 text-[12.5px] font-medium text-ink-500">{label}</p>
      <p className="mt-0.5 text-[22px] font-bold tracking-tight text-ink-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-[11.5px] text-ink-400">{hint}</p>}
    </div>
  );
}