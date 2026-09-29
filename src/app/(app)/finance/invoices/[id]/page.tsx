"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";
import { useFinance } from "@/lib/finance/store";
import { effectiveInvoiceStatus } from "@/lib/finance/reporting";
import { useCrm } from "@/lib/crm/store";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, getInvoice, paymentsForInvoice, sendInvoice, cancelInvoice, deleteInvoice } =
    useFinance();
  const { getClient } = useCrm();
  const [deleting, setDeleting] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  if (!ready) return <LoadingState />;

  const inv = getInvoice(params.id);
  if (!inv) {
    return (
      <EmptyState
        title="Invoice not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/finance/invoices">Back to invoices</Link>
          </Button>
        }
      />
    );
  }

  const client = getClient(inv.client_id);
  const payments = paymentsForInvoice(inv.id);
  const status = effectiveInvoiceStatus(inv);
  const canPay =
    inv.balance > 0 && inv.status !== "draft" && inv.status !== "cancelled";

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/finance/invoices">
            <ArrowLeft className="h-4 w-4" /> Invoices
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tabular-nums tracking-tight">
                {inv.invoice_number}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {client ? (
                <Link
                  href={`/crm/clients/${client.id}`}
                  className="hover:underline"
                >
                  {client.family_name}
                </Link>
              ) : (
                "Unknown client"
              )}
              {" · issued "}
              {inv.issue_date}
              {inv.due_date ? ` · due ${inv.due_date}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {inv.status === "draft" && (
              <Button variant="outline" onClick={() => sendInvoice(inv.id)}>
                <Send className="h-4 w-4" /> Mark as sent
              </Button>
            )}
            {canPay && (
              <RecordPaymentDialog
                invoice={inv}
                trigger={
                  <Button>
                    <CreditCard className="h-4 w-4" /> Record payment
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inv.items.map((it) => (
                    <TableRow key={it.id} className="hover:bg-transparent">
                      <TableCell>{it.description}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(it.rate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(it.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 space-y-2 border-t pt-4">
                <Row label="Subtotal" value={formatCurrency(inv.subtotal)} />
                {inv.adjustments !== 0 && (
                  <Row label="Adjustments" value={formatCurrency(inv.adjustments)} />
                )}
                <Row label="Total" value={formatCurrency(inv.total)} strong />
                <Row label="Paid" value={`− ${formatCurrency(inv.amount_paid)}`} />
                <Separator />
                <Row label="Balance due" value={formatCurrency(inv.balance)} strong />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.payment_date}
                          {p.payment_method
                            ? ` · ${humanizeStatus(p.payment_method)}`
                            : ""}
                          {p.reference_number ? ` · ${p.reference_number}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Status" value={<StatusBadge status={status} />} />
              <Row label="Total" value={formatCurrency(inv.total)} />
              <Row label="Paid" value={formatCurrency(inv.amount_paid)} />
              <Row label="Balance" value={formatCurrency(inv.balance)} strong />
            </CardContent>
          </Card>

          {inv.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{inv.notes}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            {inv.status !== "cancelled" && inv.status !== "paid" && (
              <Button
                variant="outline"
                onClick={() => setCancelling(true)}
                className="w-full"
              >
                Cancel invoice
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setDeleting(true)}
            >
              Delete invoice
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        variant="default"
        title="Cancel this invoice?"
        description="It will be marked cancelled and excluded from receivables. Recorded payments stay in your history."
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        onConfirm={() => {
          cancelInvoice(inv.id);
          setCancelling(false);
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this invoice?"
        description={`${inv.invoice_number} and its payments will be removed. This can't be undone.`}
        confirmLabel="Delete invoice"
        onConfirm={() => {
          deleteInvoice(inv.id);
          router.push("/finance/invoices");
        }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          strong ? "text-sm font-semibold tabular-nums" : "text-sm tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}
