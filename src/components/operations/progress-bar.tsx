import { cn } from "@/lib/utils";

/** A small, self-contained progress bar with an inline percentage label. */
export function ProgressBar({
  value,
  className,
  showLabel = true,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 100 ? "bg-success" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
          {pct}%
        </span>
      )}
    </div>
  );
}
