/**
 * Reporting for the analytics pages (Financial, Workforce, and the cross-domain
 * executive view). Pure functions over the domain store data, cash-basis where
 * money is involved — same source of truth as the dashboard, so no two screens
 * can disagree.
 */

import type { Expense, Invoice, Payment, RevenueEntry } from "@/lib/finance/types";
import {
  AGING_BUCKETS,
  agingSummary,
  expensesPaidInRange,
  monthRange,
  openExpenses,
  openInvoices,
  profitAndLoss,
  revenueInRange,
  type AgingBucket,
} from "@/lib/finance/reporting";
import type {
  CompensationRecord,
  Worker,
  WorkerPayment,
  WorkerPaymentItem,
} from "@/lib/workforce/types";
import { WORKER_TYPES } from "@/lib/workforce/types";
import {
  outstandingForWorker,
  totalEarned,
  totalPaid,
} from "@/lib/workforce/reporting";
import { humanizeStatus } from "@/lib/status";
import type { BreakdownSlice } from "./dashboard";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** First/last day + short label of the month `offset` months before today. */
function monthOffset(offset: number): { from: string; to: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const { from, to } = monthRange(d);
  return { from, to, label: MONTH_LABELS[d.getMonth()] };
}

/** A month bucket with one or more numeric series (index signature for charts). */
export interface MonthPoint {
  month: string;
  [key: string]: string | number;
}

export interface AgingRow {
  bucket: string;
  amount: number;
  [key: string]: string | number;
}

const AGING_LABELS: Record<AgingBucket, string> = {
  current: "Current",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
};

// --- Finance analytics ----------------------------------------------------

export interface FinanceAnalytics {
  revenueThisMonth: number;
  expensesThisMonth: number;
  netThisMonth: number;
  marginPct: number; // net / revenue
}

export function financeSummary(
  revenue: RevenueEntry[],
  expenses: Expense[],
): FinanceAnalytics {
  const { from, to } = monthRange();
  const rev = revenueInRange(revenue, from, to);
  const exp = expensesPaidInRange(expenses, from, to);
  const net = rev - exp;
  return {
    revenueThisMonth: rev,
    expensesThisMonth: exp,
    netThisMonth: net,
    marginPct: rev > 0 ? (net / rev) * 100 : 0,
  };
}

/** Net profit per month for the last `months` months (oldest first). */
export function netTrend(
  revenue: RevenueEntry[],
  expenses: Expense[],
  months = 6,
): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = monthOffset(-i);
    out.push({
      month: m.label,
      net:
        revenueInRange(revenue, m.from, m.to) -
        expensesPaidInRange(expenses, m.from, m.to),
    });
  }
  return out;
}

/** This month's paid expenses split by category (non-zero slices, largest first). */
export function expenseBreakdownThisMonth(
  revenue: RevenueEntry[],
  expenses: Expense[],
): BreakdownSlice[] {
  const { from, to } = monthRange();
  const pnl = profitAndLoss(revenue, expenses, from, to);
  return Object.entries(pnl.expensesByCategory)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: humanizeStatus(name), value }))
    .sort((a, b) => b.value - a.value);
}

/** This month's revenue split by category (non-zero slices, largest first). */
export function revenueBreakdownThisMonth(
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

/** Accounts-receivable aging (open invoice balances by bucket). */
export function arAging(invoices: Invoice[]): AgingRow[] {
  const summary = agingSummary(
    openInvoices(invoices).map((i) => ({
      due_date: i.due_date,
      amount: i.balance,
    })),
  );
  return AGING_BUCKETS.map((b) => ({
    bucket: AGING_LABELS[b],
    amount: summary[b],
  }));
}

/** Accounts-payable aging (unpaid expense amounts by bucket). */
export function apAging(expenses: Expense[]): AgingRow[] {
  const summary = agingSummary(
    openExpenses(expenses).map((e) => ({
      due_date: e.due_date,
      amount: e.amount,
    })),
  );
  return AGING_BUCKETS.map((b) => ({
    bucket: AGING_LABELS[b],
    amount: summary[b],
  }));
}

// --- Workforce analytics --------------------------------------------------

export interface WorkforceAnalytics {
  activeWorkers: number;
  totalWorkers: number;
  totalPaid: number;
  totalOutstanding: number;
}

export function workforceSummary(
  workers: Worker[],
  records: CompensationRecord[],
  items: WorkerPaymentItem[],
): WorkforceAnalytics {
  let paid = 0;
  let outstanding = 0;
  for (const w of workers) {
    paid += totalPaid(w.id, records, items);
    outstanding += outstandingForWorker(w.id, records, items);
  }
  return {
    activeWorkers: workers.filter((w) => w.status === "active").length,
    totalWorkers: workers.length,
    totalPaid: paid,
    totalOutstanding: outstanding,
  };
}

/** Active-worker headcount by type (employee / tutor / contractor). */
export function headcountByType(workers: Worker[]): BreakdownSlice[] {
  return WORKER_TYPES.map((t) => ({
    name: humanizeStatus(t),
    value: workers.filter((w) => w.status === "active" && w.worker_type === t)
      .length,
  })).filter((s) => s.value > 0);
}

export interface WorkerMoney {
  name: string;
  earned: number;
  paid: number;
  outstanding: number;
  [key: string]: string | number;
}

/** Per-worker earned / paid / outstanding, workers with any activity first. */
export function workerMoney(
  workers: Worker[],
  records: CompensationRecord[],
  items: WorkerPaymentItem[],
): WorkerMoney[] {
  return workers
    .map((w) => ({
      name: `${w.first_name} ${w.last_name}`,
      earned: totalEarned(w.id, records),
      paid: totalPaid(w.id, records, items),
      outstanding: outstandingForWorker(w.id, records, items),
    }))
    .filter((r) => r.earned > 0 || r.paid > 0)
    .sort((a, b) => b.outstanding - a.outstanding || b.earned - a.earned);
}

/** Worker payments totalled by month for the last `months` months. */
export function workerPaymentsByMonth(
  payments: WorkerPayment[],
  months = 6,
): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = monthOffset(-i);
    const total = payments.reduce(
      (sum, p) =>
        p.payment_date >= m.from && p.payment_date <= m.to
          ? sum + p.amount
          : sum,
      0,
    );
    out.push({ month: m.label, paid: total });
  }
  return out;
}

// --- Cross-domain (executive) ---------------------------------------------

/** Client payments received, totalled by month for the last `months` months. */
export function clientPaymentsByMonth(
  payments: Payment[],
  months = 6,
): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = monthOffset(-i);
    const total = payments.reduce(
      (sum, p) =>
        p.payment_date >= m.from && p.payment_date <= m.to
          ? sum + p.amount
          : sum,
      0,
    );
    out.push({ month: m.label, received: total });
  }
  return out;
}
