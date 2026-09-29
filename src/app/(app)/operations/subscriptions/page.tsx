"use client";

import * as React from "react";
import { CalendarClock, MoreHorizontal, Plus, Repeat, Wallet } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
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
import { SubscriptionFormDialog } from "@/components/operations/subscription-form-dialog";
import { useOperations } from "@/lib/operations/store";
import { renewalInfo } from "@/lib/operations/renewals";
import type { Subscription } from "@/lib/operations/types";
import { cn, formatCurrency } from "@/lib/utils";

/** A subscription's cost expressed as a monthly figure. */
function monthlyEquivalent(s: Subscription): number {
  if (s.monthly_cost != null) return s.monthly_cost;
  if (s.annual_cost != null) return s.annual_cost / 12;
  return 0;
}

export default function SubscriptionsPage() {
  const { ready, subscriptions, vendors, deleteSubscription } = useOperations();
  const [status, setStatus] = React.useState("active");
  const [editing, setEditing] = React.useState<Subscription | null>(null);
  const [deleting, setDeleting] = React.useState<Subscription | null>(null);

  const vendorName = React.useCallback(
    (id?: string) =>
      id ? (vendors.find((v) => v.id === id)?.name ?? null) : null,
    [vendors],
  );

  const rows = React.useMemo(
    () =>
      status === "all"
        ? subscriptions
        : subscriptions.filter((s) => s.status === status),
    [subscriptions, status],
  );

  const monthlyTotal = React.useMemo(
    () =>
      subscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + monthlyEquivalent(s), 0),
    [subscriptions],
  );
  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  const columns: DataTableColumn<Subscription>[] = [
    {
      id: "service",
      header: "Service",
      accessor: (s) => s.service_name,
      sortable: true,
      cell: (s) => (
        <div>
          <div className="font-medium">{s.service_name}</div>
          {vendorName(s.vendor_id) && (
            <div className="text-xs text-muted-foreground">
              {vendorName(s.vendor_id)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessor: (s) => s.category ?? "",
      cell: (s) =>
        s.category ? <Badge variant="secondary">{s.category}</Badge> : "—",
    },
    {
      id: "cost",
      header: "Cost",
      align: "right",
      accessor: (s) => monthlyEquivalent(s),
      sortable: true,
      cell: (s) =>
        s.billing_frequency === "annual" ? (
          <span className="tabular-nums">
            {formatCurrency(s.annual_cost ?? 0)}{" "}
            <span className="text-xs text-muted-foreground">/ yr</span>
          </span>
        ) : (
          <span className="tabular-nums">
            {formatCurrency(s.monthly_cost ?? 0)}{" "}
            <span className="text-xs text-muted-foreground">/ mo</span>
          </span>
        ),
    },
    {
      id: "renewal",
      header: "Renewal",
      accessor: (s) => s.renewal_date ?? "",
      sortable: true,
      cell: (s) => {
        const info = renewalInfo(s.renewal_date);
        if (!s.renewal_date) return "—";
        return (
          <div className="flex flex-col">
            <span className="text-sm tabular-nums">{s.renewal_date}</span>
            {info && s.status === "active" && (
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
      accessor: (s) => s.status,
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: (s) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Subscription actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(s)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(s)}
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
        title="Subscriptions"
        description="Recurring software and services, and what they add up to."
        actions={
          <SubscriptionFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New subscription
              </Button>
            }
          />
        }
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Active subscriptions"
              value={String(activeCount)}
              icon={Repeat}
            />
            <KpiCard
              label="Monthly spend"
              value={formatCurrency(monthlyTotal)}
              icon={Wallet}
            />
            <KpiCard
              label="Annualized spend"
              value={formatCurrency(monthlyTotal * 12)}
              icon={CalendarClock}
            />
          </div>

          <DataTable
            columns={columns}
            data={rows}
            rowKey={(s) => s.id}
            onRowClick={(s) => setEditing(s)}
            searchPlaceholder="Search subscriptions…"
            searchAccessor={(s) => `${s.service_name} ${s.category ?? ""}`}
            emptyTitle="No subscriptions here"
            emptyDescription="Add a recurring software or service cost."
            toolbar={
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </>
      )}

      {editing && (
        <SubscriptionFormDialog
          subscription={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this subscription?"
        description={
          deleting ? `"${deleting.service_name}" will be removed.` : undefined
        }
        confirmLabel="Delete subscription"
        onConfirm={() => {
          if (deleting) deleteSubscription(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
