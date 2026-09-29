import { describe, expect, it } from "vitest";

import type { Client, Lead } from "@/lib/crm/types";
import type { Expense, Invoice, RevenueEntry } from "@/lib/finance/types";
import type { Task } from "@/lib/operations/types";
import {
  attentionItems,
  dashboardKpis,
  pipelineFunnel,
  revenueByCategoryThisMonth,
} from "./dashboard";

// A date in the current month (day 10), and one in the previous month.
function thisMonthDay(day: number): string {
  const d = new Date();
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}
function lastMonthDay(day: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function rev(id: string, date: string, amount: number, category: RevenueEntry["category"] = "tutoring"): RevenueEntry {
  return { id, date, amount, category, source: "manual", created_at: date };
}
function exp(id: string, paidDate: string, amount: number): Expense {
  return {
    id,
    payee: "x",
    date: paidDate,
    category: "software",
    amount,
    recurring_status: "one_time",
    payment_status: "paid",
    payment_date: paidDate,
    created_at: paidDate,
  } as Expense;
}

describe("dashboard KPIs", () => {
  it("computes revenue, net, AR, and active clients with month-over-month deltas", () => {
    const revenue = [
      rev("r1", thisMonthDay(10), 1000, "tutoring"),
      rev("r2", thisMonthDay(12), 500, "consultation"),
      rev("r3", lastMonthDay(10), 1000, "tutoring"), // last month total 1000
    ];
    const expenses = [
      exp("e1", thisMonthDay(11), 600), // this month paid 600
      exp("e2", lastMonthDay(11), 400), // last month paid 400
    ];
    const invoices: Invoice[] = [
      { balance: 300, status: "sent" } as Invoice,
      { balance: 0, status: "paid" } as Invoice,
      { balance: 200, status: "partially_paid" } as Invoice,
    ];
    const clients: Client[] = [
      { status: "active" } as Client,
      { status: "active" } as Client,
      { status: "lost" } as Client,
    ];

    const k = dashboardKpis(revenue, expenses, invoices, clients);
    expect(k.revenueThisMonth).toBe(1500); // 1000 + 500
    expect(k.netThisMonth).toBe(900); // 1500 - 600
    expect(k.outstandingReceivable).toBe(500); // 300 + 200
    expect(k.activeClients).toBe(2);
    // Revenue: this 1500 vs last 1000 = +50%
    expect(Math.round(k.revenueDelta ?? 0)).toBe(50);
    // Net: this 900 vs last (1000 - 400 = 600) = +50%
    expect(Math.round(k.netDelta ?? 0)).toBe(50);
  });
});

describe("pipeline funnel", () => {
  it("counts leads by stage in funnel order", () => {
    const leads = [
      { pipeline_stage: "new_lead" },
      { pipeline_stage: "new_lead" },
      { pipeline_stage: "contacted" },
      { pipeline_stage: "converted" },
    ] as Lead[];
    const funnel = pipelineFunnel(leads);
    const byName = Object.fromEntries(funnel.map((f) => [f.name, f.value]));
    expect(byName["New Lead"]).toBe(2);
    expect(byName["Contacted"]).toBe(1);
    expect(byName["Converted"]).toBe(1);
    expect(byName["Consultation"]).toBe(0);
  });
});

describe("revenue by category (this month)", () => {
  it("splits this month's revenue and ignores other months", () => {
    const revenue = [
      rev("r1", thisMonthDay(5), 800, "tutoring"),
      rev("r2", thisMonthDay(6), 200, "tutoring"),
      rev("r3", thisMonthDay(7), 300, "consultation"),
      rev("r4", lastMonthDay(5), 999, "tutoring"), // excluded
    ];
    const slices = revenueByCategoryThisMonth(revenue, []);
    const byName = Object.fromEntries(slices.map((s) => [s.name, s.value]));
    expect(byName["Tutoring"]).toBe(1000);
    expect(byName["Consultation"]).toBe(300);
    // Largest slice first
    expect(slices[0].name).toBe("Tutoring");
  });
});

describe("attention center", () => {
  it("surfaces overdue tasks and stays quiet when nothing is wrong", () => {
    const overdue = attentionItems(
      [],
      [],
      [
        { id: "t1", title: "x", status: "to_do", due_date: daysAgo(3) } as Task,
        { id: "t2", title: "y", status: "completed", due_date: daysAgo(3) } as Task,
      ],
      [],
      [],
      [],
    );
    const ids = overdue.map((i) => i.id);
    expect(ids).toContain("overdue-tasks");
    // The completed task shouldn't count.
    const item = overdue.find((i) => i.id === "overdue-tasks")!;
    expect(item.title).toContain("1 task");

    const clear = attentionItems([], [], [], [], [], []);
    expect(clear).toHaveLength(0);
  });
});
