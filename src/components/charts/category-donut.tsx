"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatIDR, formatPercent } from "@/lib/format";
import { CATEGORICAL, OTHER_COLOR, SURFACE } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

export interface Slice {
  name: string;
  amount: number;
  percentage: number;
}

/** Top 6 categories + "Lainnya", fixed colour order, with a full legend list beside it. */
export function CategoryDonut({ slices, total }: { slices: Slice[]; total: number }) {
  const top = slices.slice(0, CATEGORICAL.length);
  const rest = slices.slice(CATEGORICAL.length);
  const data = [
    ...top.map((s, i) => ({ ...s, color: CATEGORICAL[i] })),
    ...(rest.length
      ? [{
          name: `Lainnya (${rest.length})`,
          amount: rest.reduce((a, s) => a + s.amount, 0),
          percentage: rest.reduce((a, s) => a + s.percentage, 0),
          color: OTHER_COLOR,
        }]
      : []),
  ];

  return (
    <div className="@container"><div className="flex flex-col items-center gap-5 @lg:flex-row">
      <div className="relative size-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie animationDuration={600} data={data} dataKey="amount" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={data.length > 1 ? 2 : 0} stroke={SURFACE} strokeWidth={2} cornerRadius={4}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-bold text-ink-faint">Total</span>
          <span className="tabular text-sm font-black text-ink">{formatIDR(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate font-bold text-ink">{d.name}</span>
            <span className="tabular text-xs font-extrabold text-ink-faint">{formatPercent(d.percentage)}</span>
            <span className="tabular shrink-0 text-right font-black text-ink">{formatIDR(d.amount)}</span>
          </li>
        ))}
      </ul>
    </div></div>
  );
}
