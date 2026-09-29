"use client";

/**
 * Workforce store — the demo-mode "backend" for workers, compensation, and
 * payments. Same pattern as CRM/Finance: React state persisted to localStorage.
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

  React.useEffect(() => {
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
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data, ready]);

  const api = React.useMemo<WorkforceContextValue>(() => {
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
      return id;
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
    }

    function payWorker(
      workerId: string,
      recordIds: string[],
      meta?: PaymentMeta,
    ): string | undefined {
      const paid = paidRecordIds(data.items);
      // No double-pay: only records that belong to the worker and aren't paid.
      const toPay = data.records.filter(
        (r) =>
          r.worker_id === workerId &&
          recordIds.includes(r.id) &&
          !paid.has(r.id),
      );
      if (toPay.length === 0) return undefined;

      const paymentId = newId();
      const amount = round2(
        toPay.reduce((sum, r) => sum + r.amount_earned, 0),
      );
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
      return paymentId;
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
      updateWorker: (id, patch) =>
        setData((d) => ({
          ...d,
          workers: d.workers.map((w) =>
            w.id === id ? { ...w, ...patch, id: w.id, updated_at: now() } : w,
          ),
        })),
      deleteWorker: (id) =>
        setData((d) => {
          const recIds = new Set(
            d.records.filter((r) => r.worker_id === id).map((r) => r.id),
          );
          return {
            workers: d.workers.filter((w) => w.id !== id),
            records: d.records.filter((r) => r.worker_id !== id),
            payments: d.payments.filter((p) => p.worker_id !== id),
            items: d.items.filter(
              (it) => !recIds.has(it.compensation_record_id),
            ),
          };
        }),
      addCompensation,
      deleteCompensation: (id) =>
        setData((d) => ({
          ...d,
          records: d.records.filter((r) => r.id !== id),
          items: d.items.filter((it) => it.compensation_record_id !== id),
        })),
      payWorker,
      deletePayment: (id) =>
        setData((d) => ({
          ...d,
          payments: d.payments.filter((p) => p.id !== id),
          items: d.items.filter((it) => it.worker_payment_id !== id),
        })),
      resetToSeed: () => setData(seedData()),
    };
  }, [data, ready]);

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
