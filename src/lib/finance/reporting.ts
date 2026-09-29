/**
 * Shared financial calculations. Every screen that shows a number like
 * "Revenue this month", "Outstanding AR", or a P&L line uses these functions,
 * so the dashboard, the reports, and the analytics can never disagree.
 *
 * All figures are cash-basis: revenue counts when money is received, expenses
 * count when they're paid (payment_date), per the architecture doc.
 */

import type {
  Expense,
  ExpenseCategory,
  Invoice,
  RevenueCategory,
  RevenueEntry,
} from "./types";

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** First and last day (YYYY-MM-DD) of the month containing `date` (default today). */
export function monthRange(date = new Date()): { from: string; to: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = new Date(y, m, 1).toISOString().slice(0, 10);
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function inRange(d: string | undefined, from: string, to: string): boolean {
  return !!d && d >= from && d <= to;
}

/** Invoice status shown to the user — "overdue" is derived, never stored. */
export function effectiveInvoiceStatus(inv: Invoice, ref = today()): string {
  if (
    (inv.status === "sent" || inv.status === "partially_paid") &&
    inv.balance > 0 &&
    inv.due_date &&
    inv.due_date < ref
  ) {
    return "overdue";
  }
  return inv.status;
}

/** Expense payment status shown to the user — "overdue" is derived. */
export function effectiveExpenseStatus(exp: Expense, ref = today()): string {
  if (exp.payment_status !== "paid" && exp.due_date && exp.due_date < ref) {
    return "overdue";
  }
  return exp.payment_status;
}

export function daysPastDue(dueDate: string | undefined, ref = today()): number {
  if (!dueDate || dueDate >= ref) return 0;
  const ms = new Date(ref).getTime() - new Date(dueDate).getTime();
  return Math.floor(ms / 86_400_000);
}

export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export function agingBucket(dueDate: string | undefined, ref = today()): AgingBucket {
  const d = daysPastDue(dueDate, ref);
  if (d <= 0) return "current";
  if (d <= 30) return "1-30";
  if (d <= 60) return "31-60";
  if (d <= 90) return "61-90";
  return "90+";
}

export const AGING_BUCKETS: AgingBucket[] = ["current", "1-30", "31-60", "61-90", "90+"];

/** Invoices that still owe money (sent or partially paid). */
export function openInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter(
    (i) =>
      (i.status === "sent" || i.status === "partially_paid") && i.balance > 0,
  );
}

/** Accounts Receivable = total balance still owed on open invoices. */
export function totalReceivable(invoices: Invoice[]): number {
  return openInvoices(invoices).reduce((sum, i) => sum + i.balance, 0);
}

/** Unpaid expenses (Accounts Payable is a filtered view of expenses). */
export function openExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => e.payment_status !== "paid");
}

/** Accounts Payable = total amount still owed on unpaid expenses. */
export function totalPayable(expenses: Expense[]): number {
  return openExpenses(expenses).reduce((sum, e) => sum + e.amount, 0);
}

/** Group amounts into aging buckets for AR or AP. */
export function agingSummary(
  rows: { due_date?: string; amount: number }[],
  ref = today(),
): Record<AgingBucket, number> {
  const out: Record<AgingBucket, number> = {
    current: 0,
    "1-30": 0,
    "31-60": 0,
    "61-90": 0,
    "90+": 0,
  };
  for (const r of rows) out[agingBucket(r.due_date, ref)] += r.amount;
  return out;
}

export interface ProfitAndLoss {
  from: string;
  to: string;
  revenueByCategory: Record<RevenueCategory, number>;
  totalRevenue: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  totalExpenses: number;
  net: number;
}

/** Profit & Loss for a date range (cash basis). */
export function profitAndLoss(
  revenue: RevenueEntry[],
  expenses: Expense[],
  from: string,
  to: string,
): ProfitAndLoss {
  const revenueByCategory = {} as Record<RevenueCategory, number>;
  let totalRevenue = 0;
  for (const r of revenue) {
    if (!inRange(r.date, from, to)) continue;
    revenueByCategory[r.category] = (revenueByCategory[r.category] ?? 0) + r.amount;
    totalRevenue += r.amount;
  }

  const expensesByCategory = {} as Record<ExpenseCategory, number>;
  let totalExpenses = 0;
  for (const e of expenses) {
    // Cash basis: only expenses actually paid, in the period they were paid.
    if (e.payment_status !== "paid") continue;
    if (!inRange(e.payment_date, from, to)) continue;
    expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amount;
    totalExpenses += e.amount;
  }

  return {
    from,
    to,
    revenueByCategory,
    totalRevenue,
    expensesByCategory,
    totalExpenses,
    net: totalRevenue - totalExpenses,
  };
}

/** Total revenue received within a date range (cash basis). */
export function revenueInRange(
  revenue: RevenueEntry[],
  from: string,
  to: string,
): number {
  return revenue.reduce((sum, r) => (inRange(r.date, from, to) ? sum + r.amount : sum), 0);
}

/** Total expenses paid within a date range (cash basis). */
export function expensesPaidInRange(
  expenses: Expense[],
  from: string,
  to: string,
): number {
  return expenses.reduce(
    (sum, e) =>
      e.payment_status === "paid" && inRange(e.payment_date, from, to)
        ? sum + e.amount
        : sum,
    0,
  );
}
