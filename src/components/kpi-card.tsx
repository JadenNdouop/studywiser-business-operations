import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPercent } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Period-over-period change as a percentage (e.g. 12.4 = +12.4%). */
  delta?: number;
  /** e.g. "vs. last month". */
  deltaLabel?: string;
  /**
   * When true, a rising value is bad (used for expenses/overdue), so the trend
   * arrow colors invert: up = red, down = green.
   */
  invertTrend?: boolean;
  className?: string;
}

/**
 * A single dashboard metric: a big number, a label, and an optional
 * period-over-period trend with a colored arrow.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel = "vs. last month",
  invertTrend = false,
  className,
}: KpiCardProps) {
  const hasDelta = typeof delta === "number";
  const direction = !hasDelta || delta === 0 ? "neutral" : delta > 0 ? "up" : "down";
  const isGood =
    direction === "neutral"
      ? null
      : invertTrend
        ? direction === "down"
        : direction === "up";

  const TrendIcon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span className="text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hasDelta && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                isGood === null && "text-muted-foreground",
                isGood === true && "text-success",
                isGood === false && "text-destructive",
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {formatPercent(Math.abs(delta as number))}
            </span>
            <span className="text-muted-foreground">{deltaLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
