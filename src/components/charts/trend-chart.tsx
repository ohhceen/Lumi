"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatIDRCompact } from "@/lib/format";
import { AXIS, GRID, MUTED_LINE, SERIES, SURFACE } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

/** Monthly expense trend — single series line with crosshair tooltip. */
export function ExpenseTrendChart({ data, height = 240 }: { data: { label: string; expense: number }[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} width={48} tickFormatter={(v) => formatIDRCompact(Number(v))} />
          <Tooltip cursor={{ stroke: MUTED_LINE, strokeDasharray: "3 3" }} content={<ChartTooltip />} />
          <Line
            type="monotone"
            animationDuration={600}
            dataKey="expense"
            name="Pengeluaran"
            stroke={SERIES.expense}
            strokeWidth={2}
            dot={{ r: 4, fill: SERIES.expense, stroke: SURFACE, strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: SURFACE, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
