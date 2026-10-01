"use client";

import * as React from "react";
import { Settings2, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManageRolesDialog } from "@/components/admin/manage-roles-dialog";
import { listUsers, setUserRoles } from "@/lib/admin/users-api";
import { ROLE_META, type AdminUser, type RoleName } from "@/lib/admin/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [managing, setManaging] = React.useState<AdminUser | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Initial data load on mount; reload() manages its own loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  async function handleSaveRoles(userId: string, roles: RoleName[]) {
    await setUserRoles(userId, roles);
    await reload();
  }

  const columns: DataTableColumn<AdminUser>[] = [
    {
      id: "name",
      header: "Name",
      accessor: (u) => u.full_name,
      sortable: true,
      cell: (u) => (
        <div>
          <div className="font-medium">
            {u.full_name}
            {u.isCurrentUser && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (You)
              </span>
            )}
          </div>
          {u.email && (
            <div className="text-xs text-muted-foreground">{u.email}</div>
          )}
        </div>
      ),
    },
    {
      id: "roles",
      header: "Roles",
      accessor: (u) => u.roles.map((r) => ROLE_META[r]?.label ?? r).join(", "),
      cell: (u) =>
        u.roles.length ? (
          <div className="flex flex-wrap gap-1.5">
            {u.roles.map((r) => (
              <Badge key={r} variant={ROLE_META[r]?.variant ?? "muted"}>
                {ROLE_META[r]?.label ?? r}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No roles</span>
        ),
    },
    {
      id: "created",
      header: "Member since",
      accessor: (u) => u.created_at,
      sortable: true,
      cell: (u) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(u.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (u) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setManaging(u)}
          className="gap-1.5"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Manage roles
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Staff accounts and the roles that control what they can access."
        actions={
          <Button className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-foreground">Couldn&apos;t load users</p>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          rowKey={(u) => u.id}
          isLoading={loading}
          searchable
          searchPlaceholder="Search users…"
          emptyTitle="No users yet"
          emptyDescription="Staff accounts will appear here once they're invited."
        />
      )}

      <ManageRolesDialog
        user={managing}
        open={!!managing}
        onOpenChange={(o) => !o && setManaging(null)}
        onSave={handleSaveRoles}
      />

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>
              How to add a new staff member to StudyWiser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              New sign-ins are created through Supabase Auth. In your Supabase
              project, go to{" "}
              <span className="font-medium text-foreground">
                Authentication → Users → Add user
              </span>{" "}
              (or send an invite), using the person&apos;s email.
            </p>
            <p>
              Once they&apos;ve been added, they&apos;ll show up here — then use{" "}
              <span className="font-medium text-foreground">Manage roles</span>{" "}
              to grant their access.
            </p>
            <p className="text-xs">
              Want one-click invites from this screen instead? That needs a
              secure server action with the service-role key — I can wire that
              up next.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setInviteOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
