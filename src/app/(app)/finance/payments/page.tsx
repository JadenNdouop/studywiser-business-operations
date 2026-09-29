"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { LoadingState } from "@/components/states/loading-state";
import { useFinance } from "@/lib/finance/store";
import { useCrm } from "@/lib/crm/store";
import type { Payment } from "@/lib/finance/types";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

export default function PaymentsPage() {
  const { ready, payments, getInvoice } = useFinance();
  const { getClient } = useCrm();
  const router = useRouter();

  const invNumber = (id: string) => getInvoice(id)?.invoice_number ?? "—";
  const clientName = (id: string) => getClient(id)?.family_name ?? "—";

  const columns: DataTableColumn<Payment>[] = [
    { id: "date", header: "Date", accessor: (p) => p.payment_date, sortable: true },
    {
      id: "invoice",
      header: "Invoice",
      accessor: (p) => invNumber(p.invoice_id),
      sortable: true,
      cell: (p) => (
        <span className="font-medium tabular-nums">{invNumber(p.invoice_id)}</span>
      ),
    },
    {
      id: "client",
      header: "Client",
      accessor: (p) => clientName(p.client_id),
    },
    {
      id: "method",
      header: "Method",
      accessor: (p) => (p.payment_method ? humanizeStatus(p.payment_method) : ""),
      cell: (p) => (p.payment_method ? humanizeStatus(p.payment_method) : "—"),
    },
    {
      id: "reference",
      header: "Reference",
      accessor: (p) => p.reference_number ?? "",
      cell: (p) => p.reference_number ?? "—",
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      accessor: (p) => p.amount,
      sortable: true,
      cell: (p) => formatCurrency(p.amount),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every payment received against an invoice."
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={payments}
          rowKey={(p) => p.id}
          onRowClick={(p) => router.push(`/finance/invoices/${p.invoice_id}`)}
          searchPlaceholder="Search payments…"
          searchAccessor={(p) =>
            `${invNumber(p.invoice_id)} ${clientName(p.client_id)} ${p.reference_number ?? ""}`
          }
          emptyTitle="No payments yet"
          emptyDescription="Record a payment from an invoice to see it here."
        />
      )}
    </div>
  );
}
