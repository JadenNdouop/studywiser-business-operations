"use client";

import * as React from "react";
import Link from "next/link";
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
import { useFinance } from "@/lib/finance/store";
import { effectiveInvoiceStatus } from "@/lib/finance/reporting";
import { useCrm } from "@/lib/crm/store";
import type { Invoice } from "@/lib/finance/types";
import { formatCurrency } from "@/lib/utils";

export default function InvoicesPage() {
  const { ready, invoices, deleteInvoice } = useFinance();
  const { getClient } = useCrm();
  const router = useRouter();
  const [deleting, setDeleting] = React.useState<Invoice | null>(null);

  const clientName = (id: string) => getClient(id)?.family_name ?? "—";

  const columns: DataTableColumn<Invoice>[] = [
    {
      id: "number",
      header: "Invoice",
      accessor: (i) => i.invoice_number,
      sortable: true,
      cell: (i) => <span className="font-medium tabular-nums">{i.invoice_number}</span>,
    },
    {
      id: "client",
      header: "Client",
      accessor: (i) => clientName(i.client_id),
      sortable: true,
    },
    {
      id: "issued",
      header: "Issued",
      accessor: (i) => i.issue_date,
      sortable: true,
    },
    {
      id: "due",
      header: "Due",
      accessor: (i) => i.due_date ?? "",
      cell: (i) => i.due_date ?? "—",
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      accessor: (i) => i.total,
      sortable: true,
      cell: (i) => formatCurrency(i.total),
    },
    {
      id: "balance",
      header: "Balance",
      align: "right",
      accessor: (i) => i.balance,
      sortable: true,
      cell: (i) => formatCurrency(i.balance),
    },
    {
      id: "status",
      header: "Status",
      accessor: (i) => effectiveInvoiceStatus(i),
      sortable: true,
      cell: (i) => <StatusBadge status={effectiveInvoiceStatus(i)} />,
    },
    {
      id: "actions",
      header: "",
      cell: (i) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Invoice actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/finance/invoices/${i.id}`)}
              >
                Open
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(i)}
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
        title="Invoices"
        description="Bills to clients and what they've paid."
        actions={
          <Button asChild>
            <Link href="/finance/invoices/new">
              <Plus className="h-4 w-4" /> New invoice
            </Link>
          </Button>
        }
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          rowKey={(i) => i.id}
          onRowClick={(i) => router.push(`/finance/invoices/${i.id}`)}
          searchPlaceholder="Search invoices…"
          searchAccessor={(i) => `${i.invoice_number} ${clientName(i.client_id)}`}
          emptyTitle="No invoices yet"
          emptyDescription="Create your first invoice for a client."
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this invoice?"
        description={
          deleting
            ? `${deleting.invoice_number} and its payments will be removed. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete invoice"
        onConfirm={() => {
          if (deleting) deleteInvoice(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
