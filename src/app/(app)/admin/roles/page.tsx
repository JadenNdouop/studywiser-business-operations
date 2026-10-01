"use client";

import * as React from "react";
import { ShieldCheck, Users as UsersIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { LoadingState } from "@/components/states/loading-state";
import { listUsers } from "@/lib/admin/users-api";
import { ROLES, type AdminUser, type RoleName } from "@/lib/admin/types";

export default function RolesPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listUsers();
        if (active) setUsers(data);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load roles.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const membersByRole = React.useMemo(() => {
    const map = new Map<RoleName, string[]>();
    for (const u of users) {
      for (const r of u.roles) {
        const list = map.get(r) ?? [];
        list.push(u.full_name);
        map.set(r, list);
      }
    }
    return map;
  }, [users]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="The fixed set of roles that govern access across StudyWiser."
      />

      <div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          Roles are a fixed set defined in the database.{" "}
          <span className="font-medium text-foreground">Owner</span> and{" "}
          <span className="font-medium text-foreground">Admin</span> have full
          control, including users, roles, and settings. Every other role has
          staff access to business data; finer per-role permissions are reserved
          for later. Assign roles to people on the{" "}
          <span className="font-medium text-foreground">Users</span> screen.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-foreground">Couldn&apos;t load roles</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => {
            const members = membersByRole.get(role.name) ?? [];
            return (
              <Card key={role.name}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={role.variant}>{role.label}</Badge>
                    <Badge
                      variant={role.access === "admin" ? "info" : "muted"}
                      className="text-[10px] uppercase tracking-wide"
                    >
                      {role.access === "admin" ? "Admin access" : "Staff access"}
                    </Badge>
                  </div>
                  <CardDescription className="pt-1">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>
                      {members.length}{" "}
                      {members.length === 1 ? "person" : "people"}
                    </span>
                  </div>
                  {members.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {members.slice(0, 4).join(", ")}
                      {members.length > 4 && ` +${members.length - 4} more`}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
