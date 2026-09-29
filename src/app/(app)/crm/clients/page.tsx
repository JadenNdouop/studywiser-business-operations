"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ClientFormDialog } from "@/components/crm/client-form-dialog";
import { useCrm } from "@/lib/crm/store";
import type { Client } from "@/lib/crm/types";

export default function ClientsPage() {
  const { ready, clients, deleteClient } = useCrm();
  const router = useRouter();
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [deleting, setDeleting] = React.useState<Client | null>(null);

  const columns: DataTableColumn<Client>[] = [
    {
      id: "family",
      header: "Family",
      accessor: (c) => c.family_name,
      sortable: true,
      cell: (c) => (
        <div>
          <div className="font-medium">{c.family_name}</div>
          {c.primary_contact_name && (
            <div className="text-xs text-muted-foreground">
              {c.primary_contact_name}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      accessor: (c) => c.email ?? "",
      cell: (c) => c.email ?? "—",
    },
    {
      id: "phone",
      header: "Phone",
      accessor: (c) => c.phone ?? "",
      cell: (c) => c.phone ?? "—",
    },
    {
      id: "status",
      header: "Status",
      accessor: (c) => c.status,
      sortable: true,
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      id: "since",
      header: "Customer since",
      accessor: (c) => c.customer_since ?? "",
      sortable: true,
      cell: (c) => c.customer_since ?? "—",
    },
    {
      id: "actions",
      header: "",
      cell: (c) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Client actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/crm/clients/${c.id}`)}
              >
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditing(c)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(c)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Active and past customer relationships."
        actions={
          <ClientFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New client
              </Button>
            }
          />
        }
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          rowKey={(c) => c.id}
          onRowClick={(c) => router.push(`/crm/clients/${c.id}`)}
          searchPlaceholder="Search clients…"
          searchAccessor={(c) =>
            [c.family_name, c.primary_contact_name, c.email, c.phone]
              .filter(Boolean)
              .join(" ")
          }
          emptyTitle="No clients yet"
          emptyDescription="Convert a lead, or add a client directly."
        />
      )}

      {editing && (
        <ClientFormDialog
          client={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this client?"
        description={
          deleting
            ? `"${deleting.family_name}" will be removed. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete client"
        onConfirm={() => {
          if (deleting) deleteClient(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
