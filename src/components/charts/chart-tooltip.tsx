"use client";

import { formatIDR } from "@/lib/format";

interface Item {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({ active, payload, label, labelFormatter }: { active?: boolean; payload?: Item[]; label?: string | number; labelFormatter?: (l: string | number, p?: Item[]) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-2 text-xs font-bold shadow-pop">
      {label !== undefined ? <p className="mb-1 font-black text-ink">{labelFormatter ? labelFormatter(label, payload) : label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-ink-soft">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
            <span>{p.name}</span>
            <span className="tabular ml-auto pl-3 font-black text-ink">{formatIDR(Number(p.value ?? 0))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-ink-soft">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
