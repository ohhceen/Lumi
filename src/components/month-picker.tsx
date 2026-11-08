"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { formatMonthLabel, shiftMonth, yearMonthKey } from "@/lib/dates";
import type { YearMonth } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Month/year selector stored in the `?month=YYYY-MM` URL param. */
export function MonthPicker({ value, param = "month", className }: { value: YearMonth; param?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const go = (ym: YearMonth) => {
    const next = new URLSearchParams(params.toString());
    next.set(param, yearMonthKey(ym));
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-2xl border-2 border-line bg-card p-1 shadow-soft", pending && "opacity-70", className)}>
      <button type="button" aria-label="Bulan sebelumnya" onClick={() => go(shiftMonth(value, -1))} className="rounded-xl p-2 text-ink-soft hover:bg-primary-soft hover:text-ink">
        <ChevronLeft className="size-4" />
      </button>
      <label className="relative cursor-pointer px-2 text-sm font-black text-ink capitalize">
        {formatMonthLabel(value)}
        <input
          type="month"
          aria-label="Pilih bulan"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={yearMonthKey(value)}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-").map(Number);
            if (y && m) go({ year: y, month: m });
          }}
        />
      </label>
      <button type="button" aria-label="Bulan berikutnya" onClick={() => go(shiftMonth(value, 1))} className="rounded-xl p-2 text-ink-soft hover:bg-primary-soft hover:text-ink">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
