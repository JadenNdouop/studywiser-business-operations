"use client";

import {
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/demo-banner";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
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
import {
  attentionItems,
  dashboardKpis,
  pipelineFunnel,
  revenueByCategory,
  revenueTrend,
} from "@/lib/demo-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

const KPI_ICONS = {
  revenue: TrendingUp,
  "net-profit": DollarSign,
  "outstanding-ar": Wallet,
  "active-clients": Users,
} as const;

const compactCurrency = (v: number | string) =>
  formatCurrency(Number(v), { notation: "compact" });

/**
 * The dashboard body. Client component so the chart formatter functions stay on
 * the client side of the RSC boundary. Renders entirely from demo data.
 */
export function DashboardView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Command Center"
        description="A live view of the business — finance, sales, and operations at a glance."
      />

      <DemoBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardKpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            label={kpi.label}
            value={
              kpi.format === "currency"
                ? formatCurrency(kpi.value)
                : formatNumber(kpi.value)
            }
            icon={KPI_ICONS[kpi.id as keyof typeof KPI_ICONS]}
            delta={kpi.delta}
            invertTrend={kpi.invertTrend ?? false}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue &amp; Expenses</CardTitle>
            <CardDescription>Last 6 months (cash basis)</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={revenueTrend}
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
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BreakdownPieChart
              data={revenueByCategory}
              height={200}
              valueFormatter={compactCurrency}
            />
            <BreakdownLegend
              data={revenueByCategory}
              valueFormatter={(v) => formatCurrency(v)}
            />
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
              data={revenueTrend}
              xKey="month"
              series={[
                { key: "revenue", label: "Income" },
                { key: "expenses", label: "Expenses", color: "var(--chart-3)" },
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
            <FunnelChart data={pipelineFunnel} />
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
          <ul className="divide-y">
            {attentionItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.meta}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
