import { cn } from "@/lib/utils";
import type { BudgetStatus } from "@/lib/finance";

export const statusStyles: Record<BudgetStatus, { bar: string; text: string; soft: string; label: string }> = {
  normal: { bar: "bg-income", text: "text-income-strong", soft: "bg-income-soft", label: "Aman" },
  warning: { bar: "bg-accent", text: "text-accent-strong", soft: "bg-accent-soft", label: "Mendekati batas" },
  danger: { bar: "bg-[#f7b27a]", text: "text-[#b8621c]", soft: "bg-[#fdeedd]", label: "Hampir habis" },
  exceeded: { bar: "bg-expense", text: "text-expense-strong", soft: "bg-expense-soft", label: "Melebihi anggaran" },
};

export function ProgressBar({ value, status, className, label }: { value: number; status: BudgetStatus; className?: string; label?: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-cream ring-1 ring-line", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", statusStyles[status].bar)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
