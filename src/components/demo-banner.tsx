import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Loud, unmistakable banner marking a screen as showing placeholder numbers.
 * Used on the Phase 1 dashboard so no one mistakes demo data for real figures.
 */
export function DemoBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm",
        className,
      )}
    >
      <FlaskConical className="h-4 w-4 shrink-0 text-warning" />
      <p className="text-foreground">
        <span className="font-semibold">Demo data.</span>{" "}
        <span className="text-muted-foreground">
          These figures are placeholders to show the layout — live numbers get
          wired in Phase 6 (Business Intelligence).
        </span>
      </p>
    </div>
  );
}
