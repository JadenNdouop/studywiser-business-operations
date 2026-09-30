"use client";

import * as React from "react";
import {
  Briefcase,
  DollarSign,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/demo-banner";
import { KpiCard } from "@/components/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { FunnelChart } from "@/components/charts/funnel-chart";
import {
  BreakdownLegend,
  BreakdownPieChart,
} from "@/components/charts/breakdown-pie-chart";
import { LoadingState } from "@/components/states/loading-state";
import { useCrm } from "@/lib/crm/store";
import { useFinance } from "@/lib/finance/store";
import { useWorkforce } from "@/lib/workforce/store";
import { useOperations } from "@/lib/operations/store";
import { totalPayable } from "@/lib/finance/reporting";
import {
  dashboardKpis,
  pipelineFunnel,
  revenueExpenseTrend,
} from "@/lib/reporting/dashboard";
import {
  expenseBreakdownThisMonth,
  headcountByType,
  workforceSummary,
} from "@/lib/reporting/analytics";
import { formatCurrency, formatNumber } from "@/lib/utils";

const compactCurrency = (v: number | string) =>
  formatCurrency(Number(v), { notation: "compact" });

/**
 * Cross-domain executive analytics: one screen that pulls finance, sales,
 * workforce, and operations together. Every figure is live.
 */
export default function AnalyticsPage() {
  const crm = useCrm();
  const finance = useFinance();
  const workforce = useWorkforce();
  const ops = useOperations();

  const ready =
    crm.ready && finance.ready && workforce.ready && ops.ready;

  const kpis = React.useMemo(
    () =>
      dashboardKpis(
        finance.revenue,
        finance.expenses,
        finance.invoices,
        crm.clients,
      ),
    [finance.revenue, finance.expenses, finance.invoices, crm.clients],
  );

  const wf = React.useMemo(
    () => workforceSummary(workforce.workers, workforce.records, workforce.items),
    [workforce.workers, workforce.records, workforce.items],
  );

  // Obligations span two domains: unpaid bills (AP) + compensation owed.
  const obligations = React.useMemo(
    () => totalPayable(finance.expenses) + wf.totalOutstanding,
    [finance.expenses, wf.totalOutstanding],
  );

  const trend = React.useMemo(
    () => revenueExpenseTrend(finance.revenue, finance.expenses),
    [finance.revenue, finance.expenses],
  );
  const spend = React.useMemo(
    () => expenseBreakdownThisMonth(finance.revenue, finance.expenses),
    [finance.revenue, finance.expenses],
  );
  const funnel = React.useMemo(() => pipelineFunnel(crm.leads), [crm.leads]);
  const headcount = React.useMemo(
    () => headcountByType(workforce.workers),
    [workforce.workers],
  );

  const openProjects = ops.projects.filter(
    (p) => p.status !== "completed" && p.status !== "cancelled",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Analytics"
        description="Finance, sales, workforce, and operations — the whole business on one screen."
      />

      <DemoBanner />

      {!ready ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue (This Month)"
              value={formatCurrency(kpis.revenueThisMonth)}
              icon={TrendingUp}
              delta={kpis.revenueDelta}
            />
            <KpiCard
              label="Net Profit (This Month)"
              value={formatCurrency(kpis.netThisMonth)}
              icon={DollarSign}
              delta={kpis.netDelta}
            />
            <KpiCard
              label="Total Obligations"
              value={formatCurrency(obligations)}
              icon={Scale}
              invertTrend
            />
            <KpiCard
              label="Active Clients"
              value={formatNumber(kpis.activeClients)}
              icon={Users}
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
                <CardTitle>Spend by Category</CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {spend.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No expenses paid this month yet.
                  </p>
                ) : (
                  <>
                    <BreakdownPieChart
                      data={spend}
                      height={200}
                      valueFormatter={compactCurrency}
                    />
                    <BreakdownLegend
                      data={spend}
                      valueFormatter={(v) => formatCurrency(v)}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Leads by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart data={funnel} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workforce</CardTitle>
                <CardDescription>Active headcount by type</CardDescription>
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
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MiniStat
              icon={Users}
              label="Active workers"
              value={formatNumber(wf.activeWorkers)}
            />
            <MiniStat
              icon={Briefcase}
              label="Open projects"
              value={formatNumber(openProjects)}
            />
            <MiniStat
              icon={Scale}
              label="Comp outstanding"
              value={formatCurrency(wf.totalOutstanding)}
            />
            <MiniStat
              icon={DollarSign}
              label="Unpaid bills"
              value={formatCurrency(totalPayable(finance.expenses))}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
