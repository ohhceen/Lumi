"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatIDRCompact } from "@/lib/format";
import { AXIS, GRID, SERIES } from "./chart-theme";
import { ChartTooltip, Legend } from "./chart-tooltip";

export interface IncomeExpensePoint {
  label: string;
  income: number;
  expense: number;
}

/** Grouped bars: income vs expense per period. */
export function IncomeExpenseChart({ data, height = 260 }: { data: IncomeExpensePoint[]; height?: number }) {
  return (
    <div>
      <Legend items={[{ label: "Pemasukan", color: SERIES.income }, { label: "Pengeluaran", color: SERIES.expense }]} />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tick={AXIS} width={48} tickFormatter={(v) => formatIDRCompact(Number(v))} />
            <Tooltip cursor={{ fill: "rgb(142 197 247 / 0.15)", radius: 8 }} content={<ChartTooltip />} />
            <Bar animationDuration={600} dataKey="income" name="Pemasukan" fill={SERIES.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar animationDuration={600} dataKey="expense" name="Pengeluaran" fill={SERIES.expense} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
