"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Mail, Phone, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { WorkerFormDialog } from "@/components/workforce/worker-form-dialog";
import { CompensationFormDialog } from "@/components/workforce/compensation-form-dialog";
import { PayWorkerDialog } from "@/components/workforce/pay-worker-dialog";
import { useWorkforce } from "@/lib/workforce/store";
import {
  isRecordPaid,
  outstandingForWorker,
  totalEarned,
  totalPaid,
} from "@/lib/workforce/reporting";
import type { CompensationRecord } from "@/lib/workforce/types";
import { humanizeStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

const RATE_SUFFIX: Record<string, string> = {
  hourly: "/ hr",
  per_session: "/ session",
  salary: "/ period",
  flat_rate: "flat",
};

export default function WorkerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    ready,
    getWorker,
    records,
    items,
    recordsForWorker,
    paymentsForWorker,
    itemsForPayment,
    deleteWorker,
    deleteCompensation,
    deletePayment,
  } = useWorkforce();

  const [editing, setEditing] = React.useState(false);
  const [deletingWorker, setDeletingWorker] = React.useState(false);
  const [deletingRecord, setDeletingRecord] =
    React.useState<CompensationRecord | null>(null);
  const [deletingPayment, setDeletingPayment] = React.useState<string | null>(
    null,
  );

  if (!ready) return <LoadingState />;

  const worker = getWorker(params.id);
  if (!worker) {
    return (
      <EmptyState
        title="Worker not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/workforce">Back to workforce</Link>
          </Button>
        }
      />
    );
  }

  const workerRecords = recordsForWorker(worker.id);
  const payments = paymentsForWorker(worker.id);
  const earned = totalEarned(worker.id, records);
  const paid = totalPaid(worker.id, records, items);
  const outstanding = outstandingForWorker(worker.id, records, items);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/workforce">
            <ArrowLeft className="h-4 w-4" /> Workforce
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {worker.first_name} {worker.last_name}
              </h1>
              <Badge variant="secondary">
                {humanizeStatus(worker.worker_type)}
              </Badge>
              <StatusBadge status={worker.status} />
            </div>
            {worker.role_title && (
              <p className="mt-1 text-sm text-muted-foreground">
                {worker.role_title}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {outstanding > 0 && (
              <PayWorkerDialog
                worker={worker}
                trigger={
                  <Button>
                    <Banknote className="h-4 w-4" /> Pay {worker.first_name}
                  </Button>
                }
              />
            )}
            <WorkerFormDialog
              worker={worker}
              open={editing}
              onOpenChange={setEditing}
            />
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeletingWorker(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Money summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total earned" value={formatCurrency(earned)} />
        <SummaryCard label="Total paid" value={formatCurrency(paid)} />
        <SummaryCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          highlight={outstanding > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Compensation records</CardTitle>
              <CompensationFormDialog
                worker={worker}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" /> Log compensation
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              {workerRecords.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No compensation logged yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workerRecords.map((r) => {
                      const rPaid = isRecordPaid(r.id, items);
                      return (
                        <TableRow key={r.id} className="hover:bg-transparent">
                          <TableCell>
                            <span className="text-sm">
                              {r.period_start} → {r.period_end}
                            </span>
                            {r.notes && (
                              <p className="text-xs text-muted-foreground">
                                {r.notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.units ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(r.rate)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(r.amount_earned)}
                          </TableCell>
                          <TableCell>
                            {rPaid ? (
                              <Badge variant="secondary">Paid</Badge>
                            ) : (
                              <Badge className="bg-warning/15 text-warning hover:bg-warning/15">
                                Unpaid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!rPaid && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete record"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeletingRecord(r)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment history</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {payments.map((p) => {
                    const count = itemsForPayment(p.id).length;
                    return (
                      <li
                        key={p.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium tabular-nums">
                            {formatCurrency(p.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.payment_date}
                            {p.payment_method
                              ? ` · ${humanizeStatus(p.payment_method)}`
                              : ""}
                            {p.reference_number
                              ? ` · ${p.reference_number}`
                              : ""}
                            {` · ${count} period${count === 1 ? "" : "s"}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete payment"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingPayment(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-4">
              <Detail icon={Mail} label="Email" value={worker.email} />
              <Detail icon={Phone} label="Phone" value={worker.phone} />
              <Detail label="Start date" value={worker.start_date} />
              <Detail
                label="Compensation"
                value={
                  worker.compensation_rate != null
                    ? `${formatCurrency(worker.compensation_rate)} ${
                        worker.compensation_type
                          ? RATE_SUFFIX[worker.compensation_type]
                          : ""
                      }`
                    : undefined
                }
              />
              {worker.contractor_status && (
                <Detail
                  label="Contractor status"
                  value={worker.contractor_status}
                />
              )}
              {worker.documentation_status && (
                <Detail
                  label="Documentation"
                  value={worker.documentation_status}
                />
              )}
              {worker.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm">{worker.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deletingWorker}
        onOpenChange={setDeletingWorker}
        title="Delete this worker?"
        description={`${worker.first_name} ${worker.last_name}, along with their compensation and payment history, will be removed. This can't be undone.`}
        confirmLabel="Delete worker"
        onConfirm={() => {
          deleteWorker(worker.id);
          router.push("/workforce");
        }}
      />

      <ConfirmDialog
        open={!!deletingRecord}
        onOpenChange={(o) => !o && setDeletingRecord(null)}
        title="Delete this compensation record?"
        description={
          deletingRecord
            ? `The ${deletingRecord.period_start} → ${deletingRecord.period_end} record (${formatCurrency(
                deletingRecord.amount_earned,
              )}) will be removed.`
            : undefined
        }
        confirmLabel="Delete record"
        onConfirm={() => {
          if (deletingRecord) deleteCompensation(deletingRecord.id);
          setDeletingRecord(null);
        }}
      />

      <ConfirmDialog
        open={!!deletingPayment}
        onOpenChange={(o) => !o && setDeletingPayment(null)}
        title="Delete this payment?"
        description="The payment will be removed and the periods it settled will become outstanding again."
        confirmLabel="Delete payment"
        onConfirm={() => {
          if (deletingPayment) deletePayment(deletingPayment);
          setDeletingPayment(null);
        }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            highlight && "text-warning",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm">
        {Icon && value && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value ?? "—"}
      </p>
    </div>
  );
}
