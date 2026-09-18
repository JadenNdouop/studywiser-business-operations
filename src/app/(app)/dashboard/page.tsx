import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold tracking-tight">
        Executive Command Center
      </h1>
      <p className="text-sm text-muted-foreground">
        Dashboard content is coming up next.
      </p>
    </div>
  );
}
