"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { useFinance } from "@/lib/finance/store";
import { useCrm } from "@/lib/crm/store";
import {
  effectiveExpenseStatus,
  effectiveInvoiceStatus,
  expensesPaidInRange,
  monthRange,
  openExpenses,
  openInvoices,
  revenueInRange,
  totalPayable,
  totalReceivable,
} from "@/lib/finance/reporting";
import { formatCurrency } from "@/lib/utils";

function pctChange(current: number, prev: number): number | undefined {
  if (prev === 0) return undefined;
  return ((current - prev) / prev) * 100;
}

export default function FinanceOverviewPage() {
  const { ready, invoices, revenue, expenses } = useFinance();
  const { getClient } = useCrm();
  const router = useRouter();

  const thisMonth = monthRange();
  const now = new Date();
  const lastMonth = monthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const revThis = revenueInRange(revenue, thisMonth.from, thisMonth.to);
  const revLast = revenueInRange(revenue, lastMonth.from, lastMonth.to);
  const expThis = expensesPaidInRange(expenses, thisMonth.from, thisMonth.to);
  const expLast = expensesPaidInRange(expenses, lastMonth.from, lastMonth.to);
  const netThis = revThis - expThis;
  const netLast = revLast - expLast;

  const ar = totalReceivable(invoices);
  const ap = totalPayable(expenses);

  const topInvoices = [...openInvoices(invoices)]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);
  const topExpenses = [...openExpenses(expenses)]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const clientName = (id: string) => getClient(id)?.family_name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Money in, money out, and what's outstanding — this month."
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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue (this month)"
              value={formatCurrency(revThis)}
              icon={TrendingUp}
              delta={pctChange(revThis, revLast)}
            />
            <KpiCard
              label="Expenses (this month)"
              value={formatCurrency(expThis)}
              icon={Receipt}
              delta={pctChange(expThis, expLast)}
              invertTrend
            />
            <KpiCard
              label="Net (this month)"
              value={formatCurrency(netThis)}
              icon={Wallet}
              delta={pctChange(netThis, netLast)}
            />
            <KpiCard
              label="Outstanding (AR / AP)"
              value={`${formatCurrency(ar)} / ${formatCurrency(ap)}`}
              icon={Wallet}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Open invoices</CardTitle>
                  <CardDescription>Awaiting payment</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/finance/receivables">
                    Receivables <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {topInvoices.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nothing outstanding.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {topInvoices.map((i) => (
                      <li
                        key={i.id}
                        onClick={() => router.push(`/finance/invoices/${i.id}`)}
                        className="flex cursor-pointer items-center justify-between gap-3 py-2.5 hover:opacity-80"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {clientName(i.client_id)}
                          </p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {i.invoice_number}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={effectiveInvoiceStatus(i)} />
                          <span className="text-sm font-medium tabular-nums">
                            {formatCurrency(i.balance)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Unpaid bills</CardTitle>
                  <CardDescription>Expenses still owed</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/finance/payables">
                    Payables <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {topExpenses.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Everything&apos;s paid.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {topExpenses.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{e.payee}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.due_date ? `Due ${e.due_date}` : "No due date"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={effectiveExpenseStatus(e)} />
                          <span className="text-sm font-medium tabular-nums">
                            {formatCurrency(e.amount)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
