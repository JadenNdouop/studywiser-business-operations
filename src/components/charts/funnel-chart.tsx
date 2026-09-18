"use client";

import {
  Funnel,
  FunnelChart as ReFunnelChart,
  LabelList,
  Tooltip,
  Cell,
} from "recharts";

import { CHART_COLORS, ChartTooltip } from "./chart-primitives";
import { ResponsiveChart } from "./responsive-chart";

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
    <ResponsiveChart height={height}>
      {({ width, height: h }) => (
        <ReFunnelChart width={width} height={h}>
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          <Funnel dataKey="value" data={data} isAnimationActive>
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
      )}
    </ResponsiveChart>
  );
}
