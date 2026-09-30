import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Banner marking a screen as running on local sample data rather than the real
 * database. The figures are computed live, but from sample data held in the
 * browser; it goes away once the domain data is served from Supabase.
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
        <span className="font-semibold">Sample data.</span>{" "}
        <span className="text-muted-foreground">
          You&apos;re signed in, but these figures are computed from local
          sample data until the database is connected.
        </span>
      </p>
    </div>
  );
}
