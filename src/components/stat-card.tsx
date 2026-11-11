import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-primary-soft text-primary-strong",
  income: "bg-income-soft text-income-strong",
  expense: "bg-expense-soft text-expense-strong",
  secondary: "bg-secondary-soft text-secondary-strong",
  accent: "bg-accent-soft text-accent-strong",
} as const;

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "primary",
  highlight = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-card p-5 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 animate-pop-in",
        highlight && "shadow-pop",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex size-9 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="size-[18px]" strokeWidth={2.5} />
        </span>
        <p className="text-sm font-extrabold text-ink-soft">{label}</p>
      </div>
      <p className={cn("tabular mt-3 font-black tracking-tight text-ink", highlight ? "text-[1.85rem] sm:text-[2rem]" : "text-2xl sm:text-[1.65rem]")}>{value}</p>
      {sub ? <div className="mt-1 text-xs font-bold text-ink-faint">{sub}</div> : null}
    </div>
  );
}
