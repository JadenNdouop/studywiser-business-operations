"use client";

/**
 * Finance store — the demo-mode "backend" for invoices, payments, revenue, and
 * expenses. Same idea as the CRM store: everything lives in React state and is
 * persisted to localStorage. When real Supabase is turned on, only this file
 * changes; the screens keep calling the same useFinance() methods.
 */

import * as React from "react";

import type { FinanceData } from "./seed";
import { seedData } from "./seed";
import type {
  Expense,
  ExpenseCategory,
  Invoice,
  InvoiceItem,
  Payment,
  RecurringStatus,
  RevenueCategory,
  RevenueEntry,
} from "./types";

const STORAGE_KEY = "studywiser_finance_v1";
const YEAR = new Date().getFullYear();

function now(): string {
  return new Date().toISOString();
}
function today(): string {
  return now().slice(0, 10);
}
function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type NewInvoiceItem = { description: string; quantity: number; rate: number };
export type NewInvoice = {
  client_id: string;
  issue_date?: string;
  due_date?: string;
  adjustments?: number;
  notes?: string;
  items: NewInvoiceItem[];
};
export type NewPayment = {
  amount: number;
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
};
export type NewExpense = Partial<Omit<Expense, "id" | "created_at" | "updated_at">> &
  Pick<Expense, "payee" | "amount" | "category">;
export type NewRevenue = {
  date?: string;
  client_id?: string;
  category: RevenueCategory;
  description?: string;
  amount: number;
};

interface FinanceContextValue {
  ready: boolean;
  invoices: Invoice[];
  payments: Payment[];
  revenue: RevenueEntry[];
  expenses: Expense[];
  getInvoice: (id: string) => Invoice | undefined;
  paymentsForInvoice: (invoiceId: string) => Payment[];
  createInvoice: (input: NewInvoice) => string;
  sendInvoice: (id: string) => void;
  cancelInvoice: (id: string) => void;
  deleteInvoice: (id: string) => void;
  recordPayment: (invoiceId: string, input: NewPayment) => void;
  addRevenue: (input: NewRevenue) => void;
  deleteRevenue: (id: string) => void;
  createExpense: (input: NewExpense) => string;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  markExpensePaid: (id: string, payment_date?: string, method?: string) => void;
  deleteExpense: (id: string) => void;
  resetToSeed: () => void;
}

const FinanceContext = React.createContext<FinanceContextValue | null>(null);

const EMPTY: FinanceData = {
  invoices: [],
  payments: [],
  revenue: [],
  expenses: [],
  invoiceSeq: 0,
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<FinanceData>(EMPTY);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let loaded: FinanceData | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as FinanceData;
    } catch {
      loaded = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loaded ?? seedData());
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage failures
    }
  }, [data, ready]);

  const api = React.useMemo<FinanceContextValue>(() => {
    const getInvoice = (id: string) => data.invoices.find((i) => i.id === id);

    function recalcStatus(inv: Invoice): Invoice {
      const balance = round2(inv.total - inv.amount_paid);
      let status = inv.status;
      if (status !== "cancelled" && status !== "draft") {
        status = balance <= 0 ? "paid" : inv.amount_paid > 0 ? "partially_paid" : "sent";
      }
      return { ...inv, balance, status };
    }

    function createInvoice(input: NewInvoice): string {
      const id = newId();
      const ts = now();
      const items: InvoiceItem[] = input.items.map((it) => ({
        id: newId(),
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        amount: round2(it.quantity * it.rate),
      }));
      const subtotal = round2(items.reduce((s, it) => s + it.amount, 0));
      const adjustments = round2(input.adjustments ?? 0);
      const total = round2(subtotal + adjustments);
      const seq = data.invoiceSeq + 1;
      const invoice: Invoice = {
        id,
        invoice_number: `SW-${YEAR}-${String(seq).padStart(4, "0")}`,
        client_id: input.client_id,
        issue_date: input.issue_date ?? today(),
        due_date: input.due_date,
        items,
        subtotal,
        adjustments,
        total,
        amount_paid: 0,
        balance: total,
        status: "draft",
        notes: input.notes,
        created_at: ts,
        updated_at: ts,
      };
      setData((d) => ({ ...d, invoices: [invoice, ...d.invoices], invoiceSeq: seq }));
      return id;
    }

    function setStatus(id: string, status: Invoice["status"]) {
      setData((d) => ({
        ...d,
        invoices: d.invoices.map((i) =>
          i.id === id ? { ...i, status, updated_at: now() } : i,
        ),
      }));
    }

    function recordPayment(invoiceId: string, input: NewPayment) {
      const inv = getInvoice(invoiceId);
      if (!inv) return;
      const amount = round2(Math.min(input.amount, inv.balance));
      if (amount <= 0) return;
      const paymentDate = input.payment_date ?? today();
      const payment: Payment = {
        id: newId(),
        invoice_id: invoiceId,
        client_id: inv.client_id,
        amount,
        payment_date: paymentDate,
        payment_method: input.payment_method,
        reference_number: input.reference_number,
        notes: input.notes,
        created_at: now(),
      };
      const revenueEntry: RevenueEntry = {
        id: newId(),
        date: paymentDate,
        client_id: inv.client_id,
        category: "tutoring",
        description: `Payment on ${inv.invoice_number}`,
        amount,
        source: "invoice_payment",
        payment_id: payment.id,
        created_at: now(),
      };
      setData((d) => ({
        ...d,
        payments: [payment, ...d.payments],
        revenue: [revenueEntry, ...d.revenue],
        invoices: d.invoices.map((i) =>
          i.id === invoiceId
            ? recalcStatus({
                ...i,
                amount_paid: round2(i.amount_paid + amount),
                updated_at: now(),
              })
            : i,
        ),
      }));
    }

    function deleteInvoice(id: string) {
      setData((d) => ({
        ...d,
        invoices: d.invoices.filter((i) => i.id !== id),
        payments: d.payments.filter((p) => p.invoice_id !== id),
        revenue: d.revenue.filter(
          (r) =>
            !(
              r.source === "invoice_payment" &&
              d.payments.find((p) => p.id === r.payment_id)?.invoice_id === id
            ),
        ),
      }));
    }

    function createExpense(input: NewExpense): string {
      const id = newId();
      const ts = now();
      const expense: Expense = {
        date: today(),
        recurring_status: "one_time" as RecurringStatus,
        payment_status: "pending",
        ...input,
        id,
        created_at: ts,
        updated_at: ts,
      };
      setData((d) => ({ ...d, expenses: [expense, ...d.expenses] }));
      return id;
    }

    return {
      ready,
      invoices: data.invoices,
      payments: data.payments,
      revenue: data.revenue,
      expenses: data.expenses,
      getInvoice,
      paymentsForInvoice: (invoiceId: string) =>
        data.payments
          .filter((p) => p.invoice_id === invoiceId)
          .sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
      createInvoice,
      sendInvoice: (id: string) => setStatus(id, "sent"),
      cancelInvoice: (id: string) => setStatus(id, "cancelled"),
      deleteInvoice,
      recordPayment,
      addRevenue: (input: NewRevenue) =>
        setData((d) => ({
          ...d,
          revenue: [
            {
              id: newId(),
              date: input.date ?? today(),
              client_id: input.client_id,
              category: input.category,
              description: input.description,
              amount: round2(input.amount),
              source: "manual",
              created_at: now(),
            },
            ...d.revenue,
          ],
        })),
      deleteRevenue: (id: string) =>
        setData((d) => ({
          ...d,
          revenue: d.revenue.filter((r) => r.id !== id),
        })),
      createExpense,
      updateExpense: (id: string, patch: Partial<Expense>) =>
        setData((d) => ({
          ...d,
          expenses: d.expenses.map((e) =>
            e.id === id ? { ...e, ...patch, id: e.id, updated_at: now() } : e,
          ),
        })),
      markExpensePaid: (id: string, payment_date?: string, method?: string) =>
        setData((d) => ({
          ...d,
          expenses: d.expenses.map((e) =>
            e.id === id
              ? {
                  ...e,
                  payment_status: "paid",
                  payment_date: payment_date ?? today(),
                  payment_method: method ?? e.payment_method,
                  updated_at: now(),
                }
              : e,
          ),
        })),
      deleteExpense: (id: string) =>
        setData((d) => ({
          ...d,
          expenses: d.expenses.filter((e) => e.id !== id),
        })),
      resetToSeed: () => setData(seedData()),
    };
  }, [data, ready]);

  return (
    <FinanceContext.Provider value={api}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = React.useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a <FinanceProvider>");
  return ctx;
}

export type { ExpenseCategory };
