import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/demo-mode";

/**
 * Banner marking a screen as running on local sample data rather than the real
 * database. It only shows in demo mode; once the app runs against Supabase
 * (DEMO_MODE=false) the data is real and the banner hides itself.
 */
export function DemoBanner({ className }: { className?: string }) {
  if (!DEMO_MODE) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm",
        className,
      )}
    >
      <FlaskConical className="h-4 w-4 shrink-0 text-warning" />
      <p className="text-foreground">
        <span className="font-semibold">Sample data.</span>{" "}
        <span className="text-muted-foreground">
          You&apos;re signed in, but these figures are computed from local
          sample data until the database is connected.
        </span>
      </p>
    </div>
  );
}
