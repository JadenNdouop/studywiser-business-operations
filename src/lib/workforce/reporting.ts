/**
 * Workforce calculations. Pure functions so they're easy to unit-test and
 * reuse — the worker list, the detail page, and the dashboard all rely on the
 * same "outstanding compensation" math and can never disagree.
 */

import type {
  CompensationRecord,
  WorkerPaymentItem,
} from "./types";

/** Set of compensation-record ids that have already been paid. */
export function paidRecordIds(items: WorkerPaymentItem[]): Set<string> {
  return new Set(items.map((i) => i.compensation_record_id));
}

export function isRecordPaid(
  recordId: string,
  items: WorkerPaymentItem[],
): boolean {
  return items.some((i) => i.compensation_record_id === recordId);
}

/** A worker's compensation records that haven't been paid yet. */
export function unpaidRecords(
  workerId: string,
  records: CompensationRecord[],
  items: WorkerPaymentItem[],
): CompensationRecord[] {
  const paid = paidRecordIds(items);
  return records.filter(
    (r) => r.worker_id === workerId && !paid.has(r.id),
  );
}

/** Total a worker has earned across all their compensation records. */
export function totalEarned(
  workerId: string,
  records: CompensationRecord[],
): number {
  return records
    .filter((r) => r.worker_id === workerId)
    .reduce((sum, r) => sum + r.amount_earned, 0);
}

/** Total already paid out for a worker (sum of payment items on their records). */
export function totalPaid(
  workerId: string,
  records: CompensationRecord[],
  items: WorkerPaymentItem[],
): number {
  const workerRecordIds = new Set(
    records.filter((r) => r.worker_id === workerId).map((r) => r.id),
  );
  return items
    .filter((i) => workerRecordIds.has(i.compensation_record_id))
    .reduce((sum, i) => sum + i.amount, 0);
}

/**
 * Outstanding compensation for a worker = everything earned minus everything
 * paid. This is the number that must drop to zero once a worker is paid in full.
 */
export function outstandingForWorker(
  workerId: string,
  records: CompensationRecord[],
  items: WorkerPaymentItem[],
): number {
  return unpaidRecords(workerId, records, items).reduce(
    (sum, r) => sum + r.amount_earned,
    0,
  );
}
