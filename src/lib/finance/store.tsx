"use client";

/**
 * Finance store — invoices, payments, revenue, and expenses.
 *
 * Runs in two modes (NEXT_PUBLIC_DEMO_MODE): localStorage in demo mode,
 * Supabase (Postgres + RLS, signed-in user) in live mode. Same useFinance()
 * API either way, so screens and reporting don't change.
 *
 * All the money logic (invoice totals, payment allocation, status, the
 * revenue-per-payment row) is computed here in JS — the database has no
 * triggers for it — so live mode simply writes the computed values. Writes are
 * optimistic; on failure we log and refetch to resync.
 *
 * Shape note: the app keeps an invoice's line items nested on the invoice; the
 * database keeps them in a separate invoice_items table. We split them on write
 * and regroup them on read.
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
import { DEMO_MODE } from "@/lib/demo-mode";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

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
function withoutId<T extends { id?: string }>(patch: T): Partial<T> {
  const rest = { ...patch };
  delete rest.id;
  return rest;
}
/** An invoice row for the DB has no nested `items`. */
function toInvoiceRow(inv: Invoice): Omit<Invoice, "items"> {
  const { items: _items, ...row } = inv;
  void _items;
  return row;
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

  const supabase = React.useMemo(
    () => (DEMO_MODE ? null : createSupabaseClient()),
    [],
  );

  const reload = React.useCallback(async () => {
    if (!supabase) return;
    const [invRes, itemsRes, payRes, revRes, expRes] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("invoice_items").select("*"),
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("revenue").select("*").order("date", { ascending: false }),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
    ]);

    const itemsByInvoice = new Map<string, InvoiceItem[]>();
    for (const it of (itemsRes.data ?? []) as (InvoiceItem & {
      invoice_id: string;
    })[]) {
      const arr = itemsByInvoice.get(it.invoice_id) ?? [];
      arr.push({
        id: it.id,
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        amount: it.amount,
      });
      itemsByInvoice.set(it.invoice_id, arr);
    }

    const invoices = ((invRes.data ?? []) as Invoice[]).map((inv) => ({
      ...inv,
      items: itemsByInvoice.get(inv.id) ?? [],
    }));

    // Next invoice number continues from the highest SW-YEAR-NNNN on file.
    let maxSeq = 0;
    for (const inv of invoices) {
      const m = /^SW-(\d{4})-(\d+)$/.exec(inv.invoice_number);
      if (m && Number(m[1]) === YEAR) maxSeq = Math.max(maxSeq, Number(m[2]));
    }

    setData({
      invoices,
      payments: (payRes.data ?? []) as Payment[],
      revenue: (revRes.data ?? []) as RevenueEntry[],
      expenses: (expRes.data ?? []) as Expense[],
      invoiceSeq: maxSeq,
    });
  }, [supabase]);

  React.useEffect(() => {
    if (DEMO_MODE) {
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
    } else {
      reload().finally(() => setReady(true));
    }
  }, [reload]);

  React.useEffect(() => {
    if (DEMO_MODE && ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore storage failures
      }
    }
  }, [data, ready]);

  const api = React.useMemo<FinanceContextValue>(() => {
    const getInvoice = (id: string) => data.invoices.find((i) => i.id === id);

    function fire(run: () => Promise<void>) {
      if (!supabase) return;
      run().catch((err) => {
        console.error("[finance] write failed, resyncing:", err);
        void reload();
      });
    }
    async function ok(p: PromiseLike<{ error: unknown }>): Promise<void> {
      const { error } = await p;
      if (error) throw error;
    }

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
      fire(async () => {
        await ok(supabase!.from("invoices").insert(toInvoiceRow(invoice)));
        if (items.length) {
          await ok(
            supabase!
              .from("invoice_items")
              .insert(items.map((it) => ({ ...it, invoice_id: id }))),
          );
        }
      });
      return id;
    }

    function setStatus(id: string, status: Invoice["status"]) {
      setData((d) => ({
        ...d,
        invoices: d.invoices.map((i) =>
          i.id === id ? { ...i, status, updated_at: now() } : i,
        ),
      }));
      fire(() => ok(supabase!.from("invoices").update({ status }).eq("id", id)));
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
      const updatedInvoice = recalcStatus({
        ...inv,
        amount_paid: round2(inv.amount_paid + amount),
        updated_at: now(),
      });
      setData((d) => ({
        ...d,
        payments: [payment, ...d.payments],
        revenue: [revenueEntry, ...d.revenue],
        invoices: d.invoices.map((i) => (i.id === invoiceId ? updatedInvoice : i)),
      }));
      fire(async () => {
        await ok(supabase!.from("payments").insert(payment));
        await ok(
          supabase!.from("revenue").insert({
            id: revenueEntry.id,
            date: revenueEntry.date,
            client_id: revenueEntry.client_id,
            category: revenueEntry.category,
            description: revenueEntry.description,
            amount: revenueEntry.amount,
            source: revenueEntry.source,
            payment_id: revenueEntry.payment_id,
          }),
        );
        await ok(
          supabase!
            .from("invoices")
            .update({
              amount_paid: updatedInvoice.amount_paid,
              balance: updatedInvoice.balance,
              status: updatedInvoice.status,
            })
            .eq("id", invoiceId),
        );
      });
    }

    function deleteInvoice(id: string) {
      const paymentIds = data.payments
        .filter((p) => p.invoice_id === id)
        .map((p) => p.id);
      setData((d) => {
        const payIds = new Set(
          d.payments.filter((p) => p.invoice_id === id).map((p) => p.id),
        );
        return {
          ...d,
          invoices: d.invoices.filter((i) => i.id !== id),
          payments: d.payments.filter((p) => p.invoice_id !== id),
          revenue: d.revenue.filter(
            (r) => !(r.payment_id && payIds.has(r.payment_id)),
          ),
        };
      });
      fire(async () => {
        // FK order: clear payment-linked revenue, then payments, then invoice
        // (invoice_items cascade on the invoice delete).
        if (paymentIds.length) {
          await ok(
            supabase!.from("revenue").delete().in("payment_id", paymentIds),
          );
          await ok(supabase!.from("payments").delete().eq("invoice_id", id));
        }
        await ok(supabase!.from("invoices").delete().eq("id", id));
      });
    }

    function addRevenue(input: NewRevenue) {
      const entry: RevenueEntry = {
        id: newId(),
        date: input.date ?? today(),
        client_id: input.client_id,
        category: input.category,
        description: input.description,
        amount: round2(input.amount),
        source: "manual",
        created_at: now(),
      };
      setData((d) => ({ ...d, revenue: [entry, ...d.revenue] }));
      fire(() =>
        ok(
          supabase!.from("revenue").insert({
            id: entry.id,
            date: entry.date,
            client_id: entry.client_id,
            category: entry.category,
            description: entry.description,
            amount: entry.amount,
            source: entry.source,
          }),
        ),
      );
    }

    function deleteRevenue(id: string) {
      setData((d) => ({ ...d, revenue: d.revenue.filter((r) => r.id !== id) }));
      fire(() => ok(supabase!.from("revenue").delete().eq("id", id)));
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
      fire(() => ok(supabase!.from("expenses").insert(expense)));
      return id;
    }

    function updateExpense(id: string, patch: Partial<Expense>) {
      setData((d) => ({
        ...d,
        expenses: d.expenses.map((e) =>
          e.id === id ? { ...e, ...patch, id: e.id, updated_at: now() } : e,
        ),
      }));
      fire(() =>
        ok(supabase!.from("expenses").update(withoutId(patch)).eq("id", id)),
      );
    }

    function markExpensePaid(id: string, payment_date?: string, method?: string) {
      const patch = {
        payment_status: "paid" as const,
        payment_date: payment_date ?? today(),
        ...(method ? { payment_method: method } : {}),
      };
      setData((d) => ({
        ...d,
        expenses: d.expenses.map((e) =>
          e.id === id ? { ...e, ...patch, updated_at: now() } : e,
        ),
      }));
      fire(() => ok(supabase!.from("expenses").update(patch).eq("id", id)));
    }

    function deleteExpense(id: string) {
      setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));
      fire(() => ok(supabase!.from("expenses").delete().eq("id", id)));
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
      addRevenue,
      deleteRevenue,
      createExpense,
      updateExpense,
      markExpensePaid,
      deleteExpense,
      resetToSeed: () => {
        if (DEMO_MODE) setData(seedData());
        else void reload();
      },
    };
  }, [data, ready, supabase, reload]);

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
