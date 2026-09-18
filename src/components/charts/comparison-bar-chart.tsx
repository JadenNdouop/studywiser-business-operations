"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import {
  AXIS_PROPS,
  CHART_COLORS,
  ChartTooltip,
  GRID_STROKE,
  type ChartSeries,
} from "./chart-primitives";
import { ResponsiveChart } from "./responsive-chart";

interface ComparisonBarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: ChartSeries[];
  height?: number;
  stacked?: boolean;
  valueFormatter?: (value: number | string) => string;
}

/** Grouped or stacked bar chart for comparing categories (e.g. income vs. expenses). */
export function ComparisonBarChart({
  data,
  xKey,
  series,
  height = 260,
  stacked = false,
  valueFormatter,
}: ComparisonBarChartProps) {
  return (
    <ResponsiveChart height={height}>
      {({ width, height: h }) => (
        <BarChart
          width={width}
          height={h}
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} axisLine={false} dy={8} />
          <YAxis
            {...AXIS_PROPS}
            axisLine={false}
            width={48}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={<ChartTooltip valueFormatter={valueFormatter} />}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId={stacked ? "stack" : undefined}
              fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              radius={stacked ? 0 : [4, 4, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveChart>
  );
}
