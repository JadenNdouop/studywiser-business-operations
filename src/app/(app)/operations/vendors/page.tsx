"use client";

import * as React from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { VendorFormDialog } from "@/components/operations/vendor-form-dialog";
import { useOperations } from "@/lib/operations/store";
import { renewalInfo } from "@/lib/operations/renewals";
import type { Vendor } from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

export default function VendorsPage() {
  const { ready, vendors, deleteVendor } = useOperations();
  const [status, setStatus] = React.useState("all");
  const [editing, setEditing] = React.useState<Vendor | null>(null);
  const [deleting, setDeleting] = React.useState<Vendor | null>(null);

  const rows = React.useMemo(
    () =>
      status === "all"
        ? vendors
        : vendors.filter((v) => v.status === status),
    [vendors, status],
  );

  const columns: DataTableColumn<Vendor>[] = [
    {
      id: "name",
      header: "Vendor",
      accessor: (v) => v.name,
      sortable: true,
      cell: (v) => (
        <div>
          <div className="font-medium">{v.name}</div>
          {v.service_provided && (
            <div className="text-xs text-muted-foreground">
              {v.service_provided}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessor: (v) => v.category ?? "",
      cell: (v) =>
        v.category ? <Badge variant="secondary">{v.category}</Badge> : "—",
    },
    {
      id: "cost",
      header: "Cost",
      align: "right",
      accessor: (v) => v.cost ?? 0,
      sortable: true,
      cell: (v) =>
        v.cost != null ? (
          <span className="tabular-nums">
            {formatCurrency(v.cost)}{" "}
            <span className="text-xs text-muted-foreground">
              {v.billing_frequency
                ? `/ ${humanizeStatus(v.billing_frequency).toLowerCase()}`
                : ""}
            </span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "renewal",
      header: "Renewal",
      accessor: (v) => v.renewal_date ?? "",
      sortable: true,
      cell: (v) => {
        const info = renewalInfo(v.renewal_date);
        if (!v.renewal_date) return "—";
        return (
          <div className="flex flex-col">
            <span className="text-sm tabular-nums">{v.renewal_date}</span>
            {info && v.status === "active" && (
              <span
                className={cn(
                  "text-xs",
                  info.tone === "overdue" && "font-medium text-destructive",
                  info.tone === "soon" && "font-medium text-warning",
                  info.tone === "normal" && "text-muted-foreground",
                )}
              >
                {info.label}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessor: (v) => v.status,
      cell: (v) => <StatusBadge status={v.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: (v) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Vendor actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(v)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(v)}
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
        title="Vendors"
        description="Suppliers and service providers — and when each one renews."
        actions={
          <VendorFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New vendor
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
          data={rows}
          rowKey={(v) => v.id}
          onRowClick={(v) => setEditing(v)}
          searchPlaceholder="Search vendors…"
          searchAccessor={(v) =>
            `${v.name} ${v.category ?? ""} ${v.service_provided ?? ""}`
          }
          emptyTitle="No vendors yet"
          emptyDescription="Add your first supplier or service provider."
          toolbar={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      {editing && (
        <VendorFormDialog
          vendor={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this vendor?"
        description={
          deleting
            ? `"${deleting.name}" will be removed. Linked subscriptions stay, but detach from the vendor.`
            : undefined
        }
        confirmLabel="Delete vendor"
        onConfirm={() => {
          if (deleting) deleteVendor(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
