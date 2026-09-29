"use client";

import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/states/loading-state";
import { useFinance } from "@/lib/finance/store";
import { profitAndLoss } from "@/lib/finance/reporting";
import { humanizeStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

type RangeKey = "this_month" | "last_month" | "last_3" | "this_year" | "all";

function computeRange(key: RangeKey): { from: string; to: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = (yy: number, mm: number, dd: number) =>
    new Date(yy, mm, dd).toISOString().slice(0, 10);
  switch (key) {
    case "this_month":
      return { from: d(y, m, 1), to: d(y, m + 1, 0), label: "This month" };
    case "last_month":
      return { from: d(y, m - 1, 1), to: d(y, m, 0), label: "Last month" };
    case "last_3":
      return { from: d(y, m - 2, 1), to: d(y, m + 1, 0), label: "Last 3 months" };
    case "this_year":
      return { from: d(y, 0, 1), to: d(y, 11, 31), label: "This year" };
    case "all":
      return { from: "0000-01-01", to: "9999-12-31", label: "All time" };
  }
}

export default function ProfitLossPage() {
  const { ready, revenue, expenses } = useFinance();
  const [rangeKey, setRangeKey] = React.useState<RangeKey>("this_year");

  const range = computeRange(rangeKey);
  const pnl = profitAndLoss(revenue, expenses, range.from, range.to);

  const revenueRows = Object.entries(pnl.revenueByCategory)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1]);
  const expenseRows = Object.entries(pnl.expensesByCategory)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit & Loss"
        description="Internal management report · cash basis (counts money when it actually moves)."
        actions={
          <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as RangeKey)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This month</SelectItem>
              <SelectItem value="last_month">Last month</SelectItem>
              <SelectItem value="last_3">Last 3 months</SelectItem>
              <SelectItem value="this_year">This year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {range.label}
                {rangeKey !== "all" && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {range.from} → {range.to}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Section title="Revenue">
                {revenueRows.length === 0 ? (
                  <EmptyRow label="No revenue in this period" />
                ) : (
                  revenueRows.map(([cat, amt]) => (
                    <StatementRow key={cat} label={humanizeStatus(cat)} value={amt} />
                  ))
                )}
                <TotalRow label="Total revenue" value={pnl.totalRevenue} />
              </Section>

              <Section title="Expenses">
                {expenseRows.length === 0 ? (
                  <EmptyRow label="No paid expenses in this period" />
                ) : (
                  expenseRows.map(([cat, amt]) => (
                    <StatementRow
                      key={cat}
                      label={humanizeStatus(cat)}
                      value={amt}
                      negative
                    />
                  ))
                )}
                <TotalRow label="Total expenses" value={pnl.totalExpenses} negative />
              </Section>

              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Net profit</span>
                <span
                  className={cn(
                    "text-lg font-semibold tabular-nums",
                    pnl.net >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {formatCurrency(pnl.net)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <SummaryTile label="Revenue" value={pnl.totalRevenue} tone="success" />
            <SummaryTile label="Expenses" value={pnl.totalExpenses} tone="muted" />
            <SummaryTile
              label="Net profit"
              value={pnl.net}
              tone={pnl.net >= 0 ? "success" : "destructive"}
              emphasize
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function StatementRow({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">
        {negative ? "− " : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function TotalRow({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="mt-1 flex items-center justify-between border-t pt-1.5 text-sm font-medium">
      <span>{label}</span>
      <span className="tabular-nums">
        {negative ? "− " : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

function SummaryTile({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone: "success" | "destructive" | "muted";
  emphasize?: boolean;
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <Card className={emphasize ? "border-primary/40" : undefined}>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
}
