"use client";

import * as React from "react";
import { formatDigitsGrouped } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Rupiah input: shows "1.500.000" while typing; value is the grouped string. */
export function AmountInput({
  id,
  value,
  onChange,
  invalid,
  allowNegative = false,
  className,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  allowNegative?: boolean;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-14 items-center rounded-2xl border-2 border-line bg-white px-4 transition-colors focus-within:border-primary-strong hover:border-primary/70",
        invalid && "border-expense-strong",
        className,
      )}
    >
      <span className="mr-2 text-lg font-black text-ink-faint">Rp</span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="0"
        aria-invalid={invalid || undefined}
        className="tabular w-full bg-transparent text-2xl font-black text-ink outline-none placeholder:text-ink-faint/60"
        value={value}
        onChange={(e) => {
          const raw = e.target.value.trim();
          const negative = allowNegative && raw.startsWith("-");
          const grouped = formatDigitsGrouped(raw);
          onChange(negative ? `-${grouped}` : grouped);
        }}
      />
    </div>
  );
}
