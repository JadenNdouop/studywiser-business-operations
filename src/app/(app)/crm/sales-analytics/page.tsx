"use client";

import * as React from "react";
import { Target, TrendingUp, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FunnelChart } from "@/components/charts/funnel-chart";
import {
  BreakdownLegend,
  BreakdownPieChart,
} from "@/components/charts/breakdown-pie-chart";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { useCrm } from "@/lib/crm/store";
import { PIPELINE_STAGES } from "@/lib/crm/types";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default function SalesAnalyticsPage() {
  const { ready, leads, clients } = useCrm();

  const stats = React.useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(
      (l) => l.pipeline_stage === "converted",
    ).length;
    const openLeads = leads.filter(
      (l) => l.pipeline_stage !== "converted" && l.pipeline_stage !== "lost",
    );
    const pipelineValue = openLeads.reduce(
      (sum, l) => sum + (l.estimated_value ?? 0),
      0,
    );
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    const funnel = PIPELINE_STAGES.map((s) => ({
      name: humanizeStatus(s),
      value: leads.filter((l) => l.pipeline_stage === s).length,
    })).filter((d) => d.value > 0);

    const sourceCounts = new Map<string, number>();
    for (const l of leads) {
      const key = l.lead_source ? humanizeStatus(l.lead_source) : "Unknown";
      sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
    }
    const bySource = Array.from(sourceCounts, ([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);

    return {
      total,
      converted,
      openCount: openLeads.length,
      pipelineValue,
      conversionRate,
      funnel,
      bySource,
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Analytics"
        description="Your pipeline at a glance — live from the leads and clients you've entered."
      />

      {!ready ? (
        <LoadingState />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No data yet"
          description="Add some leads to see your pipeline analytics."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total leads"
              value={formatNumber(stats.total)}
              icon={Target}
            />
            <KpiCard
              label="Open pipeline value"
              value={formatCurrency(stats.pipelineValue)}
              icon={Wallet}
            />
            <KpiCard
              label="Conversion rate"
              value={formatPercent(stats.conversionRate)}
              icon={TrendingUp}
            />
            <KpiCard
              label="Clients"
              value={formatNumber(clients.length)}
              icon={Users}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline funnel</CardTitle>
                <CardDescription>Leads by stage</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.funnel.length > 0 ? (
                  <FunnelChart data={stats.funnel} />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No active pipeline stages.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads by source</CardTitle>
                <CardDescription>Where your leads come from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BreakdownPieChart
                  data={stats.bySource}
                  height={200}
                  valueFormatter={(v) => formatNumber(Number(v))}
                />
                <BreakdownLegend
                  data={stats.bySource}
                  valueFormatter={(v) => formatNumber(v)}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
