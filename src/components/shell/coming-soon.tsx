import { Construction } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * Placeholder shown for routes whose feature lands in a later phase, so the
 * navigation is complete and nothing is a broken link during Phase 1.
 */
export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase?: number;
  description?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Construction className="h-7 w-7" />
      </span>
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {phase != null && <Badge variant="info">Phase {phase}</Badge>}
        </div>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {description ??
            "This section is coming in a later phase. The foundation, security, and navigation are already in place — the screens for this area will be built as their phase lands."}
        </p>
      </div>
    </div>
  );
}
