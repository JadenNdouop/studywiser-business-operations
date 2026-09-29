"use client";

import * as React from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/demo-banner";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
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
  BreakdownPieChart,
  BreakdownLegend,
} from "@/components/charts/breakdown-pie-chart";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { useCrm } from "@/lib/crm/store";
import { useFinance } from "@/lib/finance/store";
import { useOperations } from "@/lib/operations/store";
import {
  attentionItems,
  dashboardKpis,
  pipelineFunnel,
  revenueByCategoryThisMonth,
  revenueExpenseTrend,
} from "@/lib/reporting/dashboard";
import { formatCurrency, formatNumber } from "@/lib/utils";

const compactCurrency = (v: number | string) =>
  formatCurrency(Number(v), { notation: "compact" });

/**
 * The executive dashboard. Every number here is computed live from the domain
 * stores via /lib/reporting — nothing is hardcoded.
 */
export function DashboardView() {
  const crm = useCrm();
  const finance = useFinance();
  const ops = useOperations();

  const ready = crm.ready && finance.ready && ops.ready;

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

  const trend = React.useMemo(
    () => revenueExpenseTrend(finance.revenue, finance.expenses),
    [finance.revenue, finance.expenses],
  );

  const byCategory = React.useMemo(
    () => revenueByCategoryThisMonth(finance.revenue, finance.expenses),
    [finance.revenue, finance.expenses],
  );

  const funnel = React.useMemo(
    () => pipelineFunnel(crm.leads),
    [crm.leads],
  );

  const attention = React.useMemo(
    () =>
      attentionItems(
        finance.invoices,
        crm.leads,
        ops.tasks,
        ops.vendors,
        ops.subscriptions,
        ops.events,
      ),
    [
      finance.invoices,
      crm.leads,
      ops.tasks,
      ops.vendors,
      ops.subscriptions,
      ops.events,
    ],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Command Center"
        description="A live view of the business — finance, sales, and operations at a glance."
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
              label="Outstanding Receivables"
              value={formatCurrency(kpis.outstandingReceivable)}
              icon={Wallet}
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
                    {
                      key: "expenses",
                      label: "Expenses",
                      color: "var(--chart-3)",
                    },
                  ]}
                  valueFormatter={compactCurrency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {byCategory.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No revenue recorded this month yet.
                  </p>
                ) : (
                  <>
                    <BreakdownPieChart
                      data={byCategory}
                      height={200}
                      valueFormatter={compactCurrency}
                    />
                    <BreakdownLegend
                      data={byCategory}
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
                <CardTitle>Income vs. Expenses</CardTitle>
                <CardDescription>Monthly comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonBarChart
                  data={trend}
                  xKey="month"
                  series={[
                    { key: "revenue", label: "Income" },
                    {
                      key: "expenses",
                      label: "Expenses",
                      color: "var(--chart-3)",
                    },
                  ]}
                  valueFormatter={compactCurrency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Leads by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart data={funnel} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                Attention Center
              </CardTitle>
              <CardDescription>What needs action right now</CardDescription>
            </CardHeader>
            <CardContent>
              {attention.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  All clear — nothing needs attention right now.
                </div>
              ) : (
                <ul className="divide-y">
                  {attention.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.meta}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
