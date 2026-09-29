/**
 * Workforce domain types. Mirror the workers / compensation_records /
 * worker_payments / worker_payment_items tables in supabase/migrations.
 *
 * Key rule (enforced in the store, mirrors the DB's unique index): a single
 * compensation record can be linked to at most ONE payment — so a worker can
 * never be paid twice for the same earnings.
 */

export type WorkerType = "employee" | "tutor" | "contractor";
export type WorkerStatus = "active" | "inactive" | "on_leave";
export type CompensationType = "hourly" | "salary" | "per_session" | "flat_rate";

export interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  worker_type: WorkerType;
  role_title?: string;
  status: WorkerStatus;
  start_date?: string;
  end_date?: string;
  compensation_type?: CompensationType;
  compensation_rate?: number;
  // Tutor/contractor-specific, informational (from tutor_details in the schema):
  contractor_status?: string;
  documentation_status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompensationRecord {
  id: string;
  worker_id: string;
  period_start: string; // YYYY-MM-DD
  period_end: string;
  units?: number; // hours or sessions
  rate: number;
  amount_earned: number;
  notes?: string;
  created_at: string;
}

export interface WorkerPayment {
  id: string;
  worker_id: string;
  payment_date: string; // YYYY-MM-DD
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

/** Links a payment to the compensation record it settled (one per record). */
export interface WorkerPaymentItem {
  id: string;
  worker_payment_id: string;
  compensation_record_id: string;
  amount: number;
}

export const WORKER_TYPES: WorkerType[] = ["employee", "tutor", "contractor"];
export const WORKER_STATUSES: WorkerStatus[] = [
  "active",
  "inactive",
  "on_leave",
];
export const COMPENSATION_TYPES: CompensationType[] = [
  "hourly",
  "salary",
  "per_session",
  "flat_rate",
];
