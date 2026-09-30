import { describe, expect, it } from "vitest";

import type { Expense, Invoice, RevenueEntry } from "@/lib/finance/types";
import type {
  CompensationRecord,
  Worker,
  WorkerPaymentItem,
} from "@/lib/workforce/types";
import {
  arAging,
  financeSummary,
  headcountByType,
  workerMoney,
  workforceSummary,
} from "./analytics";

function thisMonthDay(day: number): string {
  const d = new Date();
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function rev(id: string, date: string, amount: number): RevenueEntry {
  return { id, date, amount, category: "tutoring", source: "manual", created_at: date };
}
function exp(id: string, paidDate: string, amount: number): Expense {
  return {
    id, payee: "x", date: paidDate, category: "software", amount,
    recurring_status: "one_time", payment_status: "paid",
    payment_date: paidDate, created_at: paidDate,
  } as Expense;
}
function worker(id: string, type: Worker["worker_type"], status: Worker["status"], first: string): Worker {
  return {
    id, first_name: first, last_name: "X", worker_type: type, status,
    created_at: "x", updated_at: "x",
  } as Worker;
}
function comp(id: string, worker_id: string, amount: number): CompensationRecord {
  return { id, worker_id, period_start: "x", period_end: "x", rate: 0, amount_earned: amount, created_at: "x" };
}
function item(recordId: string, amount: number): WorkerPaymentItem {
  return { id: "i-" + recordId, worker_payment_id: "p", compensation_record_id: recordId, amount };
}

describe("finance summary", () => {
  it("computes this-month revenue, expenses, net, and margin", () => {
    const revenue = [rev("r1", thisMonthDay(5), 1000), rev("r2", thisMonthDay(6), 1000)];
    const expenses = [exp("e1", thisMonthDay(7), 800)];
    const s = financeSummary(revenue, expenses);
    expect(s.revenueThisMonth).toBe(2000);
    expect(s.expensesThisMonth).toBe(800);
    expect(s.netThisMonth).toBe(1200);
    expect(Math.round(s.marginPct)).toBe(60); // 1200/2000
  });
});

describe("AR aging", () => {
  it("buckets open invoice balances by how overdue they are", () => {
    const invoices: Invoice[] = [
      { status: "sent", balance: 100, due_date: daysAgo(10) } as Invoice, // 1–30
      { status: "sent", balance: 200, due_date: daysAgo(45) } as Invoice, // 31–60
      { status: "sent", balance: 50, due_date: daysFromNow(10) } as Invoice, // current
      { status: "paid", balance: 0, due_date: daysAgo(5) } as Invoice, // excluded
    ];
    const rows = arAging(invoices);
    const byBucket = Object.fromEntries(rows.map((r) => [r.bucket, r.amount]));
    expect(byBucket["Current"]).toBe(50);
    expect(byBucket["1–30 days"]).toBe(100);
    expect(byBucket["31–60 days"]).toBe(200);
  });
});

describe("workforce summary + breakdowns", () => {
  const workers = [
    worker("w1", "tutor", "active", "Sarah"),
    worker("w2", "contractor", "active", "Marcus"),
    worker("w3", "employee", "inactive", "Priya"),
  ];
  const records = [
    comp("c1", "w1", 1000), // paid
    comp("c2", "w1", 500), // unpaid
    comp("c3", "w2", 300), // unpaid
  ];
  const items = [item("c1", 1000)];

  it("totals paid and outstanding across workers", () => {
    const s = workforceSummary(workers, records, items);
    expect(s.activeWorkers).toBe(2);
    expect(s.totalWorkers).toBe(3);
    expect(s.totalPaid).toBe(1000);
    expect(s.totalOutstanding).toBe(800); // 500 + 300
  });

  it("counts active headcount by type", () => {
    const hc = Object.fromEntries(headcountByType(workers).map((h) => [h.name, h.value]));
    expect(hc["Tutor"]).toBe(1);
    expect(hc["Contractor"]).toBe(1);
    expect(hc["Employee"]).toBeUndefined(); // Priya inactive → filtered out
  });

  it("gives per-worker earned/paid/outstanding, most-owed first", () => {
    const rows = workerMoney(workers, records, items);
    expect(rows[0].name).toBe("Sarah X"); // outstanding 500 > Marcus 300
    expect(rows[0].earned).toBe(1500);
    expect(rows[0].paid).toBe(1000);
    expect(rows[0].outstanding).toBe(500);
    expect(rows.find((r) => r.name === "Priya X")).toBeUndefined(); // no activity
  });
});
