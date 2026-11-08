import { TriangleAlert } from "lucide-react";
import type { BudgetProgress } from "@/lib/finance";
import { formatIDR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Friendly notices for budgets that are approaching (>=70%) or over the limit. */
export function BudgetAlerts({ progress, className }: { progress: BudgetProgress[]; className?: string }) {
  const alerts = progress.filter((p) => p.status !== "normal");
  if (!alerts.length) return null;
  return (
    <div role="status" className={cn("space-y-2", className)}>
      {alerts.map((p) => {
        const over = p.status === "exceeded";
        const text = over
          ? `Anggaran ${p.categoryName} sudah terlewati ${formatIDR(-p.remaining)}. Yuk rem dulu belanjanya 🛑`
          : p.status === "danger"
            ? `Anggaran ${p.categoryName} hampir habis (${formatPercent(p.percentage)}). Sisa ${formatIDR(p.remaining)} lagi!`
            : `Anggaran ${p.categoryName} sudah terpakai ${formatPercent(p.percentage)}. Pelan-pelan ya 🐢`;
        return (
          <div
            key={p.budgetId}
            className={cn(
              "flex items-start gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold",
              over ? "bg-expense-soft text-expense-strong" : p.status === "danger" ? "bg-[#fdeedd] text-[#b8621c]" : "bg-accent-soft text-accent-strong",
            )}
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{text}</span>
          </div>
        );
      })}
    </div>
  );
}
