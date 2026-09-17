import { Badge, type BadgeProps } from "@/components/ui/badge";
import { getStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status: string;
  /** Override the auto-derived label. */
  label?: string;
  /** Override the auto-derived color. */
  variant?: BadgeProps["variant"];
}

/**
 * A consistently-colored status pill. Pass any status token (e.g. "overdue",
 * "converted") and it resolves the right color + human label from the central
 * registry, so the same status looks the same everywhere in the app.
 */
export function StatusBadge({
  status,
  label,
  variant,
  className,
  ...props
}: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  return (
    <Badge
      variant={variant ?? meta.variant}
      className={cn("gap-1.5", className)}
      {...props}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
      />
      {label ?? meta.label}
    </Badge>
  );
}
