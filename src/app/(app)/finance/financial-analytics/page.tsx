"use client";

import * as React from "react";
import { DollarSign, Percent, Receipt, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { ComparisonBarChart } from "@/components/charts/comparison-bar-chart";
import {
  BreakdownLegend,
  BreakdownPieChart,
} from "@/components/charts/breakdown-pie-chart";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { useFinance } from "@/lib/finance/store";
import { revenueExpenseTrend } from "@/lib/reporting/dashboard";
import {
  arAging,
  expenseBreakdownThisMonth,
  financeSummary,
  netTrend,
  revenueBreakdownThisMonth,
} from "@/lib/reporting/analytics";
import { formatCurrency, formatPercent } from "@/lib/utils";

const compactCurrency = (v: number | string) =>
  formatCurrency(Number(v), { notation: "compact" });

export default function FinancialAnalyticsPage() {
  const { ready, revenue, expenses, invoices } = useFinance();

  const summary = React.useMemo(
    () => financeSummary(revenue, expenses),
    [revenue, expenses],
  );
  const trend = React.useMemo(
    () => revenueExpenseTrend(revenue, expenses),
    [revenue, expenses],
  );
  const net = React.useMemo(
    () => netTrend(revenue, expenses),
    [revenue, expenses],
  );
  const revByCat = React.useMemo(
    () => revenueBreakdownThisMonth(revenue, expenses),
    [revenue, expenses],
  );
  const expByCat = React.useMemo(
    () => expenseBreakdownThisMonth(revenue, expenses),
    [revenue, expenses],
  );
  const aging = React.useMemo(() => arAging(invoices), [invoices]);
  const agingTotal = aging.reduce((s, r) => s + r.amount, 0);

  const hasData = revenue.length > 0 || expenses.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Analytics"
        description="Revenue, spend, and margins over time — live from your finance data (cash basis)."
      />

      {!ready ? (
        <LoadingState />
      ) : !hasData ? (
        <EmptyState
          title="No financial data yet"
          description="Record some revenue or expenses to see analytics here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue (This Month)"
              value={formatCurrency(summary.revenueThisMonth)}
              icon={TrendingUp}
            />
            <KpiCard
              label="Expenses (This Month)"
              value={formatCurrency(summary.expensesThisMonth)}
              icon={Receipt}
              invertTrend
            />
            <KpiCard
              label="Net Profit (This Month)"
              value={formatCurrency(summary.netThisMonth)}
              icon={DollarSign}
            />
            <KpiCard
              label="Net Margin"
              value={formatPercent(summary.marginPct)}
              icon={Percent}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue &amp; Expenses</CardTitle>
                <CardDescription>Last 6 months (cash basis)</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={trend}
                  xKey="month"
                  series={[
                    { key: "revenue", label: "Revenue" },
                    { key: "expenses", label: "Expenses", color: "var(--chart-3)" },
                  ]}
                  valueFormatter={compactCurrency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Net Profit</CardTitle>
                <CardDescription>Per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonBarChart
                  data={net}
                  xKey="month"
                  series={[{ key: "net", label: "Net" }]}
                  valueFormatter={compactCurrency}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revByCat.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No revenue this month yet.
                  </p>
                ) : (
                  <>
                    <BreakdownPieChart
                      data={revByCat}
                      height={200}
                      valueFormatter={compactCurrency}
                    />
                    <BreakdownLegend
                      data={revByCat}
                      valueFormatter={(v) => formatCurrency(v)}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expByCat.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No expenses paid this month yet.
                  </p>
                ) : (
                  <>
                    <BreakdownPieChart
                      data={expByCat}
                      height={200}
                      valueFormatter={compactCurrency}
                    />
                    <BreakdownLegend
                      data={expByCat}
                      valueFormatter={(v) => formatCurrency(v)}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receivables Aging</CardTitle>
              <CardDescription>
                {agingTotal > 0
                  ? `${formatCurrency(agingTotal)} outstanding across open invoices`
                  : "Nothing outstanding — every invoice is settled"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agingTotal > 0 ? (
                <ComparisonBarChart
                  data={aging}
                  xKey="bucket"
                  series={[{ key: "amount", label: "Outstanding" }]}
                  valueFormatter={compactCurrency}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No open receivables.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
