"use client";

/**
 * Workforce store — workers, compensation, and payments.
 *
 * Two modes (NEXT_PUBLIC_DEMO_MODE): localStorage in demo mode, Supabase
 * (Postgres + RLS, signed-in user) in live mode. Same useWorkforce() API.
 * Live writes are optimistic with revert-on-error (log + refetch).
 *
 * Shape note: a worker's contractor_status / documentation_status live in a
 * separate tutor_details table in the database; we merge them onto the worker on
 * read and write them back on save.
 */

import * as React from "react";

import type { WorkforceData } from "./seed";
import { seedData } from "./seed";
import { paidRecordIds } from "./reporting";
import type {
  CompensationRecord,
  Worker,
  WorkerPayment,
  WorkerPaymentItem,
} from "./types";
import { DEMO_MODE } from "@/lib/demo-mode";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const STORAGE_KEY = "studywiser_workforce_v1";

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

/** Worker row for the `workers` table (tutor_details fields live elsewhere). */
function toWorkerRow(w: Worker) {
  const { contractor_status: _c, documentation_status: _d, ...row } = w;
  void _c;
  void _d;
  return row;
}
/** The tutor_details half of a worker, or null when both fields are empty. */
function tutorDetails(w: Partial<Worker> & { id?: string }, id: string) {
  if (w.contractor_status == null && w.documentation_status == null) return null;
  return {
    worker_id: id,
    contractor_status: w.contractor_status ?? null,
    documentation_status: w.documentation_status ?? null,
  };
}

export type NewWorker = Partial<Omit<Worker, "id" | "created_at" | "updated_at">> &
  Pick<Worker, "first_name" | "last_name" | "worker_type">;
export type NewCompensation = {
  period_start: string;
  period_end: string;
  units?: number;
  rate: number;
  amount_earned: number;
  notes?: string;
};
export type PaymentMeta = {
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
};

interface WorkforceContextValue {
  ready: boolean;
  workers: Worker[];
  records: CompensationRecord[];
  payments: WorkerPayment[];
  items: WorkerPaymentItem[];
  getWorker: (id: string) => Worker | undefined;
  recordsForWorker: (workerId: string) => CompensationRecord[];
  paymentsForWorker: (workerId: string) => WorkerPayment[];
  itemsForPayment: (paymentId: string) => WorkerPaymentItem[];
  createWorker: (input: NewWorker) => string;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  addCompensation: (workerId: string, input: NewCompensation) => void;
  deleteCompensation: (id: string) => void;
  payWorker: (workerId: string, recordIds: string[], meta?: PaymentMeta) => string | undefined;
  deletePayment: (id: string) => void;
  resetToSeed: () => void;
}

const WorkforceContext = React.createContext<WorkforceContextValue | null>(null);

const EMPTY: WorkforceData = { workers: [], records: [], payments: [], items: [] };

export function WorkforceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<WorkforceData>(EMPTY);
  const [ready, setReady] = React.useState(false);

  const supabase = React.useMemo(
    () => (DEMO_MODE ? null : createSupabaseClient()),
    [],
  );

  const reload = React.useCallback(async () => {
    if (!supabase) return;
    const [wRes, tdRes, recRes, payRes, itemRes] = await Promise.all([
      supabase.from("workers").select("*").order("created_at", { ascending: false }),
      supabase.from("tutor_details").select("*"),
      supabase.from("compensation_records").select("*"),
      supabase.from("worker_payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("worker_payment_items").select("*"),
    ]);
    const tdByWorker = new Map<
      string,
      { contractor_status?: string; documentation_status?: string }
    >();
    for (const td of (tdRes.data ?? []) as {
      worker_id: string;
      contractor_status?: string;
      documentation_status?: string;
    }[]) {
      tdByWorker.set(td.worker_id, {
        contractor_status: td.contractor_status ?? undefined,
        documentation_status: td.documentation_status ?? undefined,
      });
    }
    const workers = ((wRes.data ?? []) as Worker[]).map((w) => ({
      ...w,
      ...(tdByWorker.get(w.id) ?? {}),
    }));
    setData({
      workers,
      records: (recRes.data ?? []) as CompensationRecord[],
      payments: (payRes.data ?? []) as WorkerPayment[],
      items: (itemRes.data ?? []) as WorkerPaymentItem[],
    });
  }, [supabase]);

  React.useEffect(() => {
    if (DEMO_MODE) {
      let loaded: WorkforceData | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) loaded = JSON.parse(raw) as WorkforceData;
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
        // ignore
      }
    }
  }, [data, ready]);

  const api = React.useMemo<WorkforceContextValue>(() => {
    function fire(run: () => Promise<void>) {
      if (!supabase) return;
      run().catch((err) => {
        console.error("[workforce] write failed, resyncing:", err);
        void reload();
      });
    }
    async function ok(p: PromiseLike<{ error: unknown }>): Promise<void> {
      const { error } = await p;
      if (error) throw error;
    }

    function createWorker(input: NewWorker): string {
      const id = newId();
      const ts = now();
      const worker: Worker = {
        status: "active",
        ...input,
        id,
        created_at: ts,
        updated_at: ts,
      };
      setData((d) => ({ ...d, workers: [worker, ...d.workers] }));
      fire(async () => {
        await ok(supabase!.from("workers").insert(toWorkerRow(worker)));
        const td = tutorDetails(worker, id);
        if (td) await ok(supabase!.from("tutor_details").insert(td));
      });
      return id;
    }

    function updateWorker(id: string, patch: Partial<Worker>) {
      setData((d) => ({
        ...d,
        workers: d.workers.map((w) =>
          w.id === id ? { ...w, ...patch, id: w.id, updated_at: now() } : w,
        ),
      }));
      fire(async () => {
        const {
          contractor_status,
          documentation_status,
          id: _id,
          ...workerPatch
        } = patch;
        void _id;
        if (Object.keys(workerPatch).length > 0) {
          await ok(supabase!.from("workers").update(workerPatch).eq("id", id));
        }
        if (
          contractor_status !== undefined ||
          documentation_status !== undefined
        ) {
          await ok(
            supabase!
              .from("tutor_details")
              .upsert(
                {
                  worker_id: id,
                  contractor_status: contractor_status ?? null,
                  documentation_status: documentation_status ?? null,
                },
                { onConflict: "worker_id" },
              ),
          );
        }
      });
    }

    function deleteWorker(id: string) {
      setData((d) => {
        const recIds = new Set(
          d.records.filter((r) => r.worker_id === id).map((r) => r.id),
        );
        return {
          workers: d.workers.filter((w) => w.id !== id),
          records: d.records.filter((r) => r.worker_id !== id),
          payments: d.payments.filter((p) => p.worker_id !== id),
          items: d.items.filter((it) => !recIds.has(it.compensation_record_id)),
        };
      });
      fire(async () => {
        // FK-safe order: payments (cascade their items), then comp records,
        // then tutor_details, then the worker.
        await ok(supabase!.from("worker_payments").delete().eq("worker_id", id));
        await ok(
          supabase!.from("compensation_records").delete().eq("worker_id", id),
        );
        await ok(supabase!.from("tutor_details").delete().eq("worker_id", id));
        await ok(supabase!.from("workers").delete().eq("id", id));
      });
    }

    function addCompensation(workerId: string, input: NewCompensation) {
      const record: CompensationRecord = {
        id: newId(),
        worker_id: workerId,
        period_start: input.period_start,
        period_end: input.period_end,
        units: input.units,
        rate: input.rate,
        amount_earned: round2(input.amount_earned),
        notes: input.notes,
        created_at: now(),
      };
      setData((d) => ({ ...d, records: [record, ...d.records] }));
      fire(() => ok(supabase!.from("compensation_records").insert(record)));
    }

    function deleteCompensation(id: string) {
      setData((d) => ({
        ...d,
        records: d.records.filter((r) => r.id !== id),
        items: d.items.filter((it) => it.compensation_record_id !== id),
      }));
      fire(async () => {
        await ok(
          supabase!
            .from("worker_payment_items")
            .delete()
            .eq("compensation_record_id", id),
        );
        await ok(supabase!.from("compensation_records").delete().eq("id", id));
      });
    }

    function payWorker(
      workerId: string,
      recordIds: string[],
      meta?: PaymentMeta,
    ): string | undefined {
      const paid = paidRecordIds(data.items);
      const toPay = data.records.filter(
        (r) =>
          r.worker_id === workerId &&
          recordIds.includes(r.id) &&
          !paid.has(r.id),
      );
      if (toPay.length === 0) return undefined;

      const paymentId = newId();
      const amount = round2(toPay.reduce((sum, r) => sum + r.amount_earned, 0));
      const payment: WorkerPayment = {
        id: paymentId,
        worker_id: workerId,
        payment_date: meta?.payment_date ?? today(),
        amount,
        payment_method: meta?.payment_method,
        reference_number: meta?.reference_number,
        notes: meta?.notes,
        created_at: now(),
      };
      const newItems: WorkerPaymentItem[] = toPay.map((r) => ({
        id: newId(),
        worker_payment_id: paymentId,
        compensation_record_id: r.id,
        amount: r.amount_earned,
      }));
      setData((d) => ({
        ...d,
        payments: [payment, ...d.payments],
        items: [...newItems, ...d.items],
      }));
      fire(async () => {
        await ok(supabase!.from("worker_payments").insert(payment));
        await ok(supabase!.from("worker_payment_items").insert(newItems));
      });
      return paymentId;
    }

    function deletePayment(id: string) {
      setData((d) => ({
        ...d,
        payments: d.payments.filter((p) => p.id !== id),
        items: d.items.filter((it) => it.worker_payment_id !== id),
      }));
      // worker_payment_items cascade on the payment delete.
      fire(() => ok(supabase!.from("worker_payments").delete().eq("id", id)));
    }

    return {
      ready,
      workers: data.workers,
      records: data.records,
      payments: data.payments,
      items: data.items,
      getWorker: (id) => data.workers.find((w) => w.id === id),
      recordsForWorker: (workerId) =>
        data.records
          .filter((r) => r.worker_id === workerId)
          .sort((a, b) => b.period_end.localeCompare(a.period_end)),
      paymentsForWorker: (workerId) =>
        data.payments
          .filter((p) => p.worker_id === workerId)
          .sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
      itemsForPayment: (paymentId) =>
        data.items.filter((i) => i.worker_payment_id === paymentId),
      createWorker,
      updateWorker,
      deleteWorker,
      addCompensation,
      deleteCompensation,
      payWorker,
      deletePayment,
      resetToSeed: () => {
        if (DEMO_MODE) setData(seedData());
        else void reload();
      },
    };
  }, [data, ready, supabase, reload]);

  return (
    <WorkforceContext.Provider value={api}>
      {children}
    </WorkforceContext.Provider>
  );
}

export function useWorkforce(): WorkforceContextValue {
  const ctx = React.useContext(WorkforceContext);
  if (!ctx)
    throw new Error("useWorkforce must be used within a <WorkforceProvider>");
  return ctx;
}
