import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEMO_MODE, DEMO_USER } from "@/lib/demo-mode";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In demo mode there is no backend — use a fixed demo user, skip auth.
  const user = DEMO_MODE ? DEMO_USER : await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      user={{
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
      }}
    >
      {children}
    </AppShell>
  );
}
