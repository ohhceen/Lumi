import { CategoryIcon } from "./category-icon";
import { ProgressBar, statusStyles } from "./ui/progress";
import type { BudgetProgress } from "@/lib/finance";
import { formatIDR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BudgetRow({ p, compact = false, actions }: { p: BudgetProgress; compact?: boolean; actions?: React.ReactNode }) {
  const st = statusStyles[p.status];
  return (
    <div className={cn(!compact && "rounded-3xl border border-line/70 bg-card p-4 shadow-soft sm:p-5")}>
      <div className="flex items-center gap-3">
        <CategoryIcon icon={p.categoryIcon} type="expense" size={compact ? "sm" : "md"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">{p.categoryName}</p>
          <p className="tabular text-xs font-bold text-ink-faint">
            {formatIDR(p.spent)} dari {formatIDR(p.limit)}
          </p>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-black", st.soft, st.text)}>{formatPercent(p.percentage)}</span>
        {actions}
      </div>
      <ProgressBar value={p.percentage} status={p.status} className="mt-3" label={`Pemakaian anggaran ${p.categoryName}`} />
      <div className="mt-2 flex items-center justify-between text-xs font-bold">
        <span className={st.text}>{st.label}</span>
        <span className={cn("tabular", p.remaining < 0 ? "text-expense-strong" : "text-ink-soft")}>
          {p.remaining < 0 ? `Lewat ${formatIDR(-p.remaining)}` : `Sisa ${formatIDR(p.remaining)}`}
        </span>
      </div>
    </div>
  );
}
