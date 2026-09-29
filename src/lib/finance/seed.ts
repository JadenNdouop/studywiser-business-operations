import type {
  Expense,
  Invoice,
  Payment,
  RevenueEntry,
} from "./types";

export interface FinanceData {
  invoices: Invoice[];
  payments: Payment[];
  revenue: RevenueEntry[];
  expenses: Expense[];
  /** Highest invoice sequence number issued so far this year. */
  invoiceSeq: number;
}

function iso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}
function ymd(daysFromNow: number): string {
  return iso(daysFromNow).slice(0, 10);
}
const YEAR = new Date().getFullYear();
function invNo(n: number): string {
  return `SW-${YEAR}-${String(n).padStart(4, "0")}`;
}

/**
 * Example finance data linked to the seeded CRM clients (seed-client-1..3),
 * covering the full lifecycle: a paid invoice, a partially-paid one, an overdue
 * one, and a draft — plus revenue and a mix of paid/unpaid expenses so the P&L
 * and AR/AP views have something to show. All example data; the user can clear
 * it (Reset) and enter their own.
 */
export function seedData(): FinanceData {
  const invoices: Invoice[] = [
    {
      id: "seed-inv-1",
      invoice_number: invNo(1),
      client_id: "seed-client-1",
      issue_date: ymd(-20),
      due_date: ymd(-6),
      items: [
        { id: "it-1a", description: "Algebra tutoring — 8 sessions", quantity: 8, rate: 90, amount: 720 },
        { id: "it-1b", description: "SAT prep — 4 sessions", quantity: 4, rate: 120, amount: 480 },
      ],
      subtotal: 1200,
      adjustments: 0,
      total: 1200,
      amount_paid: 1200,
      balance: 0,
      status: "paid",
      created_at: iso(-20),
      updated_at: iso(-6),
    },
    {
      id: "seed-inv-2",
      invoice_number: invNo(2),
      client_id: "seed-client-2",
      issue_date: ymd(-12),
      due_date: ymd(2),
      items: [
        { id: "it-2a", description: "Reading tutoring — 8 sessions", quantity: 8, rate: 100, amount: 800 },
      ],
      subtotal: 800,
      adjustments: 0,
      total: 800,
      amount_paid: 400,
      balance: 400,
      status: "partially_paid",
      created_at: iso(-12),
      updated_at: iso(-5),
    },
    {
      id: "seed-inv-3",
      invoice_number: invNo(3),
      client_id: "seed-client-1",
      issue_date: ymd(-40),
      due_date: ymd(-12),
      items: [
        { id: "it-3a", description: "Algebra tutoring — 6 sessions", quantity: 6, rate: 90, amount: 540 },
      ],
      subtotal: 540,
      adjustments: 0,
      total: 540,
      amount_paid: 0,
      balance: 540,
      status: "sent",
      created_at: iso(-40),
      updated_at: iso(-40),
    },
    {
      id: "seed-inv-4",
      invoice_number: invNo(4),
      client_id: "seed-client-3",
      issue_date: ymd(-1),
      due_date: ymd(13),
      items: [
        { id: "it-4a", description: "Summer reading program", quantity: 1, rate: 500, amount: 500 },
      ],
      subtotal: 500,
      adjustments: 0,
      total: 500,
      amount_paid: 0,
      balance: 500,
      status: "draft",
      created_at: iso(-1),
      updated_at: iso(-1),
    },
  ];

  const payments: Payment[] = [
    {
      id: "seed-pay-1",
      invoice_id: "seed-inv-1",
      client_id: "seed-client-1",
      amount: 1200,
      payment_date: ymd(-6),
      payment_method: "bank_transfer",
      created_at: iso(-6),
    },
    {
      id: "seed-pay-2",
      invoice_id: "seed-inv-2",
      client_id: "seed-client-2",
      amount: 400,
      payment_date: ymd(-5),
      payment_method: "card",
      created_at: iso(-5),
    },
  ];

  const revenue: RevenueEntry[] = [
    {
      id: "seed-rev-1",
      date: ymd(-6),
      client_id: "seed-client-1",
      category: "tutoring",
      description: "Payment on " + invNo(1),
      amount: 1200,
      source: "invoice_payment",
      payment_id: "seed-pay-1",
      created_at: iso(-6),
    },
    {
      id: "seed-rev-2",
      date: ymd(-5),
      client_id: "seed-client-2",
      category: "tutoring",
      description: "Payment on " + invNo(2),
      amount: 400,
      source: "invoice_payment",
      payment_id: "seed-pay-2",
      created_at: iso(-5),
    },
    {
      id: "seed-rev-3",
      date: ymd(-9),
      category: "consultation",
      description: "One-off parent consultation",
      amount: 150,
      source: "manual",
      created_at: iso(-9),
    },
  ];

  const expenses: Expense[] = [
    {
      id: "seed-exp-1",
      payee: "Tutor payroll",
      date: ymd(-8),
      category: "tutor_compensation",
      description: "Bi-weekly tutor pay",
      amount: 1400,
      recurring_status: "recurring",
      payment_status: "paid",
      payment_date: ymd(-7),
      payment_method: "bank_transfer",
      created_at: iso(-8),
      updated_at: iso(-7),
    },
    {
      id: "seed-exp-2",
      payee: "Zoom",
      date: ymd(-10),
      category: "software",
      description: "Zoom Pro — monthly",
      amount: 16,
      recurring_status: "recurring",
      payment_status: "paid",
      payment_date: ymd(-10),
      created_at: iso(-10),
      updated_at: iso(-10),
    },
    {
      id: "seed-exp-3",
      payee: "Meta Ads",
      date: ymd(-11),
      category: "advertising",
      description: "Instagram lead campaign",
      amount: 250,
      recurring_status: "one_time",
      payment_status: "paid",
      payment_date: ymd(-9),
      created_at: iso(-11),
      updated_at: iso(-9),
    },
    {
      id: "seed-exp-4",
      payee: "Hiscox",
      date: ymd(-4),
      due_date: ymd(9),
      category: "insurance",
      description: "Business liability — monthly",
      amount: 120,
      recurring_status: "recurring",
      payment_status: "pending",
      created_at: iso(-4),
      updated_at: iso(-4),
    },
    {
      id: "seed-exp-5",
      payee: "Bookkeeper",
      date: ymd(-16),
      due_date: ymd(-2),
      category: "accounting",
      description: "Monthly bookkeeping",
      amount: 300,
      recurring_status: "recurring",
      payment_status: "pending",
      created_at: iso(-16),
      updated_at: iso(-16),
    },
  ];

  return { invoices, payments, revenue, expenses, invoiceSeq: 4 };
}
