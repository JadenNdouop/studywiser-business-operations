"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  CHART_COLORS,
  ChartTooltip,
  type TooltipEntry,
} from "./chart-primitives";

interface BreakdownDatum {
  name: string;
  value: number;
}

interface BreakdownPieChartProps {
  data: BreakdownDatum[];
  height?: number;
  colors?: string[];
  valueFormatter?: (value: number | string) => string;
}

/** Donut chart for a part-to-whole breakdown (e.g. revenue by category). */
export function BreakdownPieChart({
  data,
  height = 260,
  colors = CHART_COLORS,
  valueFormatter,
}: BreakdownPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={(v) => {
                const num = Number(v);
                const pct = total > 0 ? Math.round((num / total) * 100) : 0;
                const formatted = valueFormatter ? valueFormatter(num) : String(num);
                return `${formatted} · ${pct}%`;
              }}
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="var(--background)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Simple legend list to pair with the donut (name + value + swatch). */
export function BreakdownLegend({
  data,
  colors = CHART_COLORS,
  valueFormatter = (v) => String(v),
}: {
  data: BreakdownDatum[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
}) {
  return (
    <ul className="space-y-2">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
          <span className="text-muted-foreground">{d.name}</span>
          <span className="ml-auto font-medium tabular-nums">
            {valueFormatter(d.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type { TooltipEntry };
