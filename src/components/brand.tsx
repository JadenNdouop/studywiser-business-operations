import Image from "next/image";

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
      {/* Light mode: white background (blue "S"). Dark mode: blue background (white "S"). */}
      <Image
        src="/studywiser-badge-light.png"
        alt="StudyWiser"
        width={32}
        height={32}
        priority
        className="h-8 w-8 shrink-0 rounded-lg dark:hidden"
      />
      <Image
        src="/studywiser-badge.png"
        alt="StudyWiser"
        width={32}
        height={32}
        priority
        className="hidden h-8 w-8 shrink-0 rounded-lg dark:block"
      />
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
