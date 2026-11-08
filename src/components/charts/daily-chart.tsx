"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatIDRCompact } from "@/lib/format";
import { AXIS, CURSOR_FILL, GRID, MUTED_LINE, SERIES } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

export interface DailyPoint {
  day: number;
  date: string;
  expense: number;
}

/** Single-series daily spending (title names the series, so no legend). */
export function DailySpendingChart({ data, average, height = 220 }: { data: DailyPoint[]; average?: number; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="18%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 4" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" minTickGap={8} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} width={48} tickFormatter={(v) => formatIDRCompact(Number(v))} />
          <Tooltip
            cursor={{ fill: CURSOR_FILL, radius: 6 }}
            content={<ChartTooltip labelFormatter={(l) => `Tanggal ${l}`} />}
          />
          {average && average > 0 ? (
            <ReferenceLine
              y={average}
              stroke={MUTED_LINE}
              strokeDasharray="4 4"
              label={{ value: `rata-rata ${formatIDRCompact(average)}`, position: "insideTopRight", fill: MUTED_LINE, fontSize: 11, fontWeight: 800 }}
            />
          ) : null}
          <Bar animationDuration={600} dataKey="expense" name="Pengeluaran" fill={SERIES.expense} radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
