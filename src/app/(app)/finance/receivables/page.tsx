"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { useFinance } from "@/lib/finance/store";
import { useCrm } from "@/lib/crm/store";
import {
  AGING_BUCKETS,
  agingSummary,
  daysPastDue,
  effectiveInvoiceStatus,
  openInvoices,
  totalReceivable,
} from "@/lib/finance/reporting";
import type { Invoice } from "@/lib/finance/types";
import { cn, formatCurrency } from "@/lib/utils";

const BUCKET_LABEL: Record<string, string> = {
  current: "Current",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
};

export default function ReceivablesPage() {
  const { ready, invoices } = useFinance();
  const { getClient } = useCrm();
  const router = useRouter();

  const open = openInvoices(invoices);
  const total = totalReceivable(invoices);
  const summary = agingSummary(
    open.map((i) => ({ due_date: i.due_date, amount: i.balance })),
  );

  const clientName = (id: string) => getClient(id)?.family_name ?? "—";

  const columns: DataTableColumn<Invoice>[] = [
    {
      id: "number",
      header: "Invoice",
      accessor: (i) => i.invoice_number,
      sortable: true,
      cell: (i) => <span className="font-medium tabular-nums">{i.invoice_number}</span>,
    },
    { id: "client", header: "Client", accessor: (i) => clientName(i.client_id) },
    { id: "due", header: "Due", accessor: (i) => i.due_date ?? "", cell: (i) => i.due_date ?? "—" },
    {
      id: "age",
      header: "Age",
      accessor: (i) => daysPastDue(i.due_date),
      sortable: true,
      cell: (i) => {
        const d = daysPastDue(i.due_date);
        return d > 0 ? (
          <span className="text-destructive">{d}d overdue</span>
        ) : (
          <span className="text-muted-foreground">Current</span>
        );
      },
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
      cell: (i) => <StatusBadge status={effectiveInvoiceStatus(i)} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receivables"
        description="What clients still owe you, and how overdue it is."
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Total outstanding
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {formatCurrency(total)}
                </p>
              </CardContent>
            </Card>
            {AGING_BUCKETS.map((b) => (
              <Card key={b}>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {BUCKET_LABEL[b]}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-semibold tabular-nums",
                      b !== "current" && summary[b] > 0 && "text-destructive",
                    )}
                  >
                    {formatCurrency(summary[b])}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={open}
            rowKey={(i) => i.id}
            onRowClick={(i) => router.push(`/finance/invoices/${i.id}`)}
            searchPlaceholder="Search receivables…"
            searchAccessor={(i) => `${i.invoice_number} ${clientName(i.client_id)}`}
            emptyTitle="Nothing outstanding"
            emptyDescription="Every sent invoice is paid up. Nice."
          />
        </>
      )}
    </div>
  );
}
