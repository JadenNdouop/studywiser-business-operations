"use client";

import * as React from "react";

/** Theme-driven categorical palette (resolves via CSS vars in light + dark). */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export type ChartSeries = {
  key: string;
  label: string;
  color?: string;
};

export type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

/** Shared tooltip card used by every chart wrapper for a consistent look. */
export function ChartTooltip({
  active,
  label,
  payload,
  valueFormatter = (v) => String(v),
  labelFormatter,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  valueFormatter?: (value: number | string) => string;
  labelFormatter?: (label: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && (
        <p className="mb-1 font-medium text-popover-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-popover-foreground">
              {entry.value !== undefined
                ? valueFormatter(entry.value)
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Common Recharts styling tokens for axes/grid so every chart matches. */
export const AXIS_PROPS = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
} as const;

export const GRID_STROKE = "var(--border)";
