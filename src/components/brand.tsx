import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

/** StudyWiser Ops wordmark. `iconOnly` renders just the badge (for a collapsed sidebar). */
export function Brand({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!iconOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">
            StudyWiser
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Operations
          </span>
        </span>
      )}
    </div>
  );
}
