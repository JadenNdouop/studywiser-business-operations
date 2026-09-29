import type {
  CompensationRecord,
  Worker,
  WorkerPayment,
  WorkerPaymentItem,
} from "./types";

export interface WorkforceData {
  workers: Worker[];
  records: CompensationRecord[];
  payments: WorkerPayment[];
  items: WorkerPaymentItem[];
}

function iso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}
function ymd(daysFromNow: number): string {
  return iso(daysFromNow).slice(0, 10);
}

/**
 * Example workforce data: three workers, some paid and some outstanding
 * compensation. Sarah has a paid period and an unpaid one; Marcus has one
 * unpaid period; Priya is paid up. All example data — clear it and add your own.
 */
export function seedData(): WorkforceData {
  const workers: Worker[] = [
    {
      id: "seed-wk-1",
      first_name: "Sarah",
      last_name: "Chen",
      email: "sarah.chen@example.com",
      phone: "(202) 555-0112",
      worker_type: "tutor",
      role_title: "Math & SAT Tutor",
      status: "active",
      start_date: ymd(-200),
      compensation_type: "per_session",
      compensation_rate: 60,
      contractor_status: "W-9 on file",
      documentation_status: "Complete",
      created_at: iso(-200),
      updated_at: iso(-2),
    },
    {
      id: "seed-wk-2",
      first_name: "Marcus",
      last_name: "Lee",
      email: "marcus.lee@example.com",
      phone: "(202) 555-0170",
      worker_type: "contractor",
      role_title: "Curriculum Designer",
      status: "active",
      start_date: ymd(-90),
      compensation_type: "hourly",
      compensation_rate: 45,
      contractor_status: "W-9 on file",
      documentation_status: "Complete",
      created_at: iso(-90),
      updated_at: iso(-3),
    },
    {
      id: "seed-wk-3",
      first_name: "Priya",
      last_name: "Nair",
      email: "priya.nair@example.com",
      phone: "(202) 555-0198",
      worker_type: "employee",
      role_title: "Operations Coordinator",
      status: "active",
      start_date: ymd(-320),
      compensation_type: "salary",
      compensation_rate: 2500,
      created_at: iso(-320),
      updated_at: iso(-2),
    },
  ];

  const records: CompensationRecord[] = [
    {
      id: "seed-cr-1",
      worker_id: "seed-wk-1",
      period_start: ymd(-30),
      period_end: ymd(-16),
      units: 20,
      rate: 60,
      amount_earned: 1200,
      notes: "20 sessions",
      created_at: iso(-15),
    },
    {
      id: "seed-cr-2",
      worker_id: "seed-wk-1",
      period_start: ymd(-15),
      period_end: ymd(-1),
      units: 18,
      rate: 60,
      amount_earned: 1080,
      notes: "18 sessions",
      created_at: iso(0),
    },
    {
      id: "seed-cr-3",
      worker_id: "seed-wk-2",
      period_start: ymd(-14),
      period_end: ymd(0),
      units: 22,
      rate: 45,
      amount_earned: 990,
      notes: "22 hours — unit 3 curriculum",
      created_at: iso(0),
    },
    {
      id: "seed-cr-4",
      worker_id: "seed-wk-3",
      period_start: ymd(-30),
      period_end: ymd(-1),
      rate: 2500,
      amount_earned: 2500,
      notes: "Monthly salary",
      created_at: iso(-1),
    },
  ];

  const payments: WorkerPayment[] = [
    {
      id: "seed-wp-1",
      worker_id: "seed-wk-1",
      payment_date: ymd(-14),
      amount: 1200,
      payment_method: "bank_transfer",
      created_at: iso(-14),
    },
    {
      id: "seed-wp-2",
      worker_id: "seed-wk-3",
      payment_date: ymd(-2),
      amount: 2500,
      payment_method: "bank_transfer",
      created_at: iso(-2),
    },
  ];

  const items: WorkerPaymentItem[] = [
    {
      id: "seed-wpi-1",
      worker_payment_id: "seed-wp-1",
      compensation_record_id: "seed-cr-1",
      amount: 1200,
    },
    {
      id: "seed-wpi-2",
      worker_payment_id: "seed-wp-2",
      compensation_record_id: "seed-cr-4",
      amount: 2500,
    },
  ];

  return { workers, records, payments, items };
}
