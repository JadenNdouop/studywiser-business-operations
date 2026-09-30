"use client";

import * as React from "react";
import { Banknote, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComparisonBarChart } from "@/components/charts/comparison-bar-chart";
import {
  BreakdownLegend,
  BreakdownPieChart,
} from "@/components/charts/breakdown-pie-chart";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { useWorkforce } from "@/lib/workforce/store";
import {
  headcountByType,
  workerMoney,
  workerPaymentsByMonth,
  workforceSummary,
} from "@/lib/reporting/analytics";
import { formatCurrency, formatNumber } from "@/lib/utils";

const compactCurrency = (v: number | string) =>
  formatCurrency(Number(v), { notation: "compact" });

export default function WorkforceAnalyticsPage() {
  const { ready, workers, records, items, payments } = useWorkforce();

  const summary = React.useMemo(
    () => workforceSummary(workers, records, items),
    [workers, records, items],
  );
  const headcount = React.useMemo(
    () => headcountByType(workers),
    [workers],
  );
  const perWorker = React.useMemo(
    () => workerMoney(workers, records, items),
    [workers, records, items],
  );
  const paymentsTrend = React.useMemo(
    () => workerPaymentsByMonth(payments),
    [payments],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workforce Analytics"
        description="Headcount and what you're paying out — live from your workers and payments."
      />

      {!ready ? (
        <LoadingState />
      ) : workers.length === 0 ? (
        <EmptyState
          title="No workers yet"
          description="Add tutors, contractors, or staff to see workforce analytics."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Active workers"
              value={formatNumber(summary.activeWorkers)}
              icon={Users}
            />
            <KpiCard
              label="Total paid (all time)"
              value={formatCurrency(summary.totalPaid)}
              icon={Banknote}
            />
            <KpiCard
              label="Outstanding compensation"
              value={formatCurrency(summary.totalOutstanding)}
              icon={Wallet}
              invertTrend
            />
            <KpiCard
              label="Total workers"
              value={formatNumber(summary.totalWorkers)}
              icon={Users}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Headcount by Type</CardTitle>
                <CardDescription>Active workers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {headcount.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No active workers.
                  </p>
                ) : (
                  <>
                    <BreakdownPieChart
                      data={headcount}
                      height={200}
                      valueFormatter={(v) => formatNumber(Number(v))}
                    />
                    <BreakdownLegend
                      data={headcount}
                      valueFormatter={(v) => formatNumber(v)}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Paid vs. Outstanding by Worker</CardTitle>
                <CardDescription>All-time compensation</CardDescription>
              </CardHeader>
              <CardContent>
                {perWorker.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No compensation logged yet.
                  </p>
                ) : (
                  <ComparisonBarChart
                    data={perWorker}
                    xKey="name"
                    series={[
                      { key: "paid", label: "Paid" },
                      {
                        key: "outstanding",
                        label: "Outstanding",
                        color: "var(--chart-3)",
                      },
                    ]}
                    valueFormatter={compactCurrency}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payments Over Time</CardTitle>
              <CardDescription>
                Worker payments by month (last 6 months)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonBarChart
                data={paymentsTrend}
                xKey="month"
                series={[{ key: "paid", label: "Paid out" }]}
                valueFormatter={compactCurrency}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
