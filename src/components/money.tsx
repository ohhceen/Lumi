import { formatIDR } from "@/lib/format";
import type { TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Amount with sign + colour by transaction type. */
export function Money({ amount, type, className, signed = true }: { amount: number; type?: TransactionType; className?: string; signed?: boolean }) {
  const prefix = signed && type ? (type === "income" ? "+" : "−") : "";
  return (
    <span
      className={cn(
        "tabular font-black whitespace-nowrap",
        type === "income" && "text-income-strong",
        type === "expense" && "text-expense-strong",
        className,
      )}
    >
      {prefix}
      {formatIDR(amount)}
    </span>
  );
}
