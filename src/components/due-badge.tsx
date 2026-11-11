import { CircleCheck, Clock, TriangleAlert } from "lucide-react";
import type { DueStatus } from "@/lib/obligations";
import { cn } from "@/lib/utils";

const STYLE: Record<DueStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  lunas: { label: "Lunas", cls: "bg-income-soft text-income-strong", Icon: CircleCheck },
  terlambat: { label: "Terlambat", cls: "bg-expense-soft text-expense-strong", Icon: TriangleAlert },
  segera: { label: "Segera", cls: "bg-accent-soft text-accent-strong", Icon: Clock },
  belum: { label: "Belum dibayar", cls: "bg-primary-soft text-ink-soft", Icon: Clock },
};

export function DueBadge({ status, daysLeft, className }: { status: DueStatus; daysLeft?: number; className?: string }) {
  const s = STYLE[status];
  let label = s.label;
  if (status === "segera" && daysLeft !== undefined) label = daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`;
  if (status === "terlambat" && daysLeft !== undefined) label = `Telat ${-daysLeft} hari`;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap", s.cls, className)}>
      <s.Icon className="size-3.5" /> {label}
    </span>
  );
}
