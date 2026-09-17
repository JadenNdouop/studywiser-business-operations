"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AXIS_PROPS,
  CHART_COLORS,
  ChartTooltip,
  GRID_STROKE,
  type ChartSeries,
} from "./chart-primitives";

interface TrendLineChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: ChartSeries[];
  height?: number;
  valueFormatter?: (value: number | string) => string;
}

/** Multi-series line chart for trends over time (e.g. revenue by month). */
export function TrendLineChart({
  data,
  xKey,
  series,
  height = 260,
  valueFormatter,
}: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} axisLine={false} dy={8} />
        <YAxis
          {...AXIS_PROPS}
          axisLine={false}
          width={48}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
