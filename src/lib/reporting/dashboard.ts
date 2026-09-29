/**
 * Cross-domain reporting for the executive dashboard.
 *
 * These are pure functions over the domain store data (CRM, Finance, Workforce,
 * Operations). They're the single source of truth for the numbers on the
 * dashboard — no hardcoded figures — so the dashboard and the analytics pages
 * can never disagree. All money is cash-basis, matching finance/reporting.
 */

import type { Client, Lead, PipelineStage } from "@/lib/crm/types";
import { PIPELINE_STAGES } from "@/lib/crm/types";
import type { Expense, Invoice, RevenueEntry } from "@/lib/finance/types";
import {
  effectiveInvoiceStatus,
  expensesPaidInRange,
  monthRange,
  openInvoices,
  profitAndLoss,
  revenueInRange,
  today,
} from "@/lib/finance/reporting";
import type {
  BusinessEvent,
  Subscription,
  Task,
  Vendor,
} from "@/lib/operations/types";
import { renewalInfo } from "@/lib/operations/renewals";
import { humanizeStatus } from "@/lib/status";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** First/last day of the month that is `offset` months before `date`. */
function monthOffset(offset: number, date = new Date()): {
  from: string;
  to: string;
  label: string;
} {
  const d = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  const { from, to } = monthRange(d);
  return { from, to, label: MONTH_LABELS[d.getMonth()] };
}

/** Percent change from `prev` to `curr`, or undefined when there's no base. */
function pctChange(curr: number, prev: number): number | undefined {
  if (prev === 0) return undefined;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

// --- KPIs -----------------------------------------------------------------

export interface DashboardKpis {
  revenueThisMonth: number;
  revenueDelta?: number;
  netThisMonth: number;
  netDelta?: number;
  outstandingReceivable: number;
  activeClients: number;
}

export function dashboardKpis(
  revenue: RevenueEntry[],
  expenses: Expense[],
  invoices: Invoice[],
  clients: Client[],
): DashboardKpis {
  const thisM = monthOffset(0);
  const lastM = monthOffset(-1);

  const revThis = revenueInRange(revenue, thisM.from, thisM.to);
  const revLast = revenueInRange(revenue, lastM.from, lastM.to);
  const netThis =
    revThis - expensesPaidInRange(expenses, thisM.from, thisM.to);
  const netLast =
    revLast - expensesPaidInRange(expenses, lastM.from, lastM.to);

  return {
    revenueThisMonth: revThis,
    revenueDelta: pctChange(revThis, revLast),
    netThisMonth: netThis,
    netDelta: pctChange(netThis, netLast),
    outstandingReceivable: openInvoices(invoices).reduce(
      (s, i) => s + i.balance,
      0,
    ),
    activeClients: clients.filter((c) => c.status === "active").length,
  };
}

// --- Charts ---------------------------------------------------------------

export interface TrendPoint {
  month: string;
  revenue: number;
  expenses: number;
  // Index signature so the chart components (which take generic row maps)
  // accept this shape directly.
  [key: string]: string | number;
}

/** Revenue vs. expenses for the last `months` months (oldest first). */
export function revenueExpenseTrend(
  revenue: RevenueEntry[],
  expenses: Expense[],
  months = 6,
): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = monthOffset(-i);
    out.push({
      month: m.label,
      revenue: revenueInRange(revenue, m.from, m.to),
      expenses: expensesPaidInRange(expenses, m.from, m.to),
    });
  }
  return out;
}

export interface BreakdownSlice {
  name: string;
  value: number;
}

/** This month's revenue split by category (only non-zero slices). */
export function revenueByCategoryThisMonth(
  revenue: RevenueEntry[],
  expenses: Expense[],
): BreakdownSlice[] {
  const { from, to } = monthRange();
  const pnl = profitAndLoss(revenue, expenses, from, to);
  return Object.entries(pnl.revenueByCategory)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: humanizeStatus(name), value }))
    .sort((a, b) => b.value - a.value);
}

/** Leads by pipeline stage, in funnel order (new → converted). */
export function pipelineFunnel(leads: Lead[]): BreakdownSlice[] {
  const counts = new Map<PipelineStage, number>();
  for (const l of leads) {
    counts.set(l.pipeline_stage, (counts.get(l.pipeline_stage) ?? 0) + 1);
  }
  return PIPELINE_STAGES.map((stage) => ({
    name: humanizeStatus(stage),
    value: counts.get(stage) ?? 0,
  }));
}

// --- Attention Center -----------------------------------------------------

export interface AttentionItem {
  id: string;
  title: string;
  meta: string;
  status: string;
}

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

/**
 * Things that need action right now, drawn from every domain. Only items with
 * a real count are returned, so an all-clear business shows an empty list.
 */
export function attentionItems(
  invoices: Invoice[],
  leads: Lead[],
  tasks: Task[],
  vendors: Vendor[],
  subscriptions: Subscription[],
  events: BusinessEvent[],
): AttentionItem[] {
  const ref = today();
  const items: AttentionItem[] = [];

  // Overdue invoices
  const overdue = invoices.filter(
    (i) => effectiveInvoiceStatus(i, ref) === "overdue",
  );
  if (overdue.length > 0) {
    const total = overdue.reduce((s, i) => s + i.balance, 0);
    const oldest = overdue
      .map((i) => i.due_date ?? ref)
      .sort()[0];
    const days = Math.max(
      0,
      Math.floor(
        (new Date(ref).getTime() - new Date(oldest).getTime()) / 86_400_000,
      ),
    );
    items.push({
      id: "overdue-invoices",
      title: `${overdue.length} invoice${overdue.length === 1 ? "" : "s"} overdue`,
      meta: `${money(total)} total · oldest ${days} day${days === 1 ? "" : "s"}`,
      status: "overdue",
    });
  }

  // Leads needing follow-up (past due, still in the pipeline)
  const followUps = leads.filter(
    (l) =>
      l.next_follow_up_date &&
      l.next_follow_up_date <= ref &&
      l.pipeline_stage !== "converted" &&
      l.pipeline_stage !== "lost",
  );
  if (followUps.length > 0) {
    items.push({
      id: "lead-followups",
      title: `${followUps.length} lead${followUps.length === 1 ? "" : "s"} need${followUps.length === 1 ? "s" : ""} follow-up`,
      meta: "Follow-up date has passed",
      status: "contacted",
    });
  }

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.due_date < ref && t.status !== "completed",
  );
  if (overdueTasks.length > 0) {
    const projects = new Set(
      overdueTasks.map((t) => t.project_id).filter(Boolean),
    );
    const across =
      projects.size > 0
        ? ` · across ${projects.size} project${projects.size === 1 ? "" : "s"}`
        : "";
    items.push({
      id: "overdue-tasks",
      title: `${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} overdue`,
      meta: `Past their due date${across}`,
      status: "blocked",
    });
  }

  // Renewals coming up (vendors + subscriptions, within ~30 days)
  const renewingVendors = vendors.filter(
    (v) => v.status === "active" && renewalInfo(v.renewal_date)?.tone !== "normal" && v.renewal_date,
  );
  const renewingSubs = subscriptions.filter(
    (s) => s.status === "active" && renewalInfo(s.renewal_date)?.tone !== "normal" && s.renewal_date,
  );
  const renewCount = renewingVendors.length + renewingSubs.length;
  if (renewCount > 0) {
    const names = [...renewingVendors.map((v) => v.name), ...renewingSubs.map((s) => s.service_name)]
      .slice(0, 2)
      .join(" · ");
    items.push({
      id: "renewals",
      title: `${renewCount} renewal${renewCount === 1 ? "" : "s"} coming up`,
      meta: names || "Due within 30 days",
      status: "scheduled",
    });
  }

  // Upcoming key business events (next 7 days)
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);
  const soonStr = soon.toISOString().slice(0, 10);
  const upcomingEvents = events.filter(
    (e) => e.event_date >= ref && e.event_date <= soonStr,
  );
  if (upcomingEvents.length > 0) {
    items.push({
      id: "upcoming-events",
      title: `${upcomingEvents.length} event${upcomingEvents.length === 1 ? "" : "s"} this week`,
      meta: upcomingEvents
        .slice(0, 2)
        .map((e) => e.title)
        .join(" · "),
      status: "scheduled",
    });
  }

  return items;
}
