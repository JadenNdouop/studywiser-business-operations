"use client";

import {
  Funnel,
  FunnelChart as ReFunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

import { CHART_COLORS, ChartTooltip } from "./chart-primitives";

interface FunnelDatum {
  name: string;
  value: number;
}

interface FunnelChartProps {
  data: FunnelDatum[];
  height?: number;
  colors?: string[];
  valueFormatter?: (value: number | string) => string;
}

/** Sales-pipeline funnel: stages narrowing from lead to conversion. */
export function FunnelChart({
  data,
  height = 280,
  colors = CHART_COLORS,
  valueFormatter,
}: FunnelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReFunnelChart>
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        <Funnel dataKey="value" data={data} isAnimationActive lastShapeType="rectangle">
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
          <LabelList
            position="right"
            dataKey="name"
            fill="var(--foreground)"
            stroke="none"
            fontSize={12}
          />
          <LabelList
            position="left"
            dataKey="value"
            fill="var(--muted-foreground)"
            stroke="none"
            fontSize={12}
          />
        </Funnel>
      </ReFunnelChart>
    </ResponsiveContainer>
  );
}
