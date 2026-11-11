import type { BudgetProgress, BudgetStatus } from "@/lib/finance";
import { formatIDR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RING: Record<BudgetStatus, { color: string; text: string; label: string }> = {
  normal: { color: "#1f8a52", text: "text-ink-soft", label: "Aman" },
  warning: { color: "#e8a20c", text: "text-accent-strong", label: "Mendekati batas" },
  danger: { color: "#b8620f", text: "text-warn", label: "Hampir habis" },
  exceeded: { color: "#c2413a", text: "text-expense-strong", label: "Lewat batas" },
};

/** Compact ring per budget (top N), most used first. */
export function BudgetRings({ progress, limit = 4 }: { progress: BudgetProgress[]; limit?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
      {progress.slice(0, limit).map((p) => {
        const r = RING[p.status];
        const pct = Math.max(0, Math.min(100, p.percentage));
        return (
          <li key={p.budgetId} className="flex min-w-0 items-center gap-2.5">
            <span
              role="img"
              aria-label={`${p.categoryName} terpakai ${formatPercent(p.percentage)}, ${r.label.toLowerCase()}`}
              className="flex size-13 shrink-0 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${r.color} 0 ${pct}%, #ececef 0)` }}
            >
              <span className={cn("tabular flex size-10 items-center justify-center rounded-full bg-white text-[11px] font-black", p.status === "normal" ? "text-ink" : r.text)}>
                {formatPercent(p.percentage)}
              </span>
            </span>
            <span className="min-w-0 text-[13px] leading-tight">
              <span className="block truncate font-extrabold text-ink">{p.categoryName}</span>
              <span className={cn("block truncate font-bold", r.text)}>
                {p.remaining < 0 ? `Lewat ${formatIDR(-p.remaining)}` : r.label}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
