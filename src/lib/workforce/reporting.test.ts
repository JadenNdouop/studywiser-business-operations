import { describe, expect, it } from "vitest";

import { seedData } from "./seed";
import {
  isRecordPaid,
  outstandingForWorker,
  totalEarned,
  totalPaid,
  unpaidRecords,
} from "./reporting";

const { records, items } = seedData();

describe("workforce compensation math", () => {
  it("counts total earned across a worker's records", () => {
    // Sarah: 1200 (paid) + 1080 (unpaid)
    expect(totalEarned("seed-wk-1", records)).toBe(2280);
  });

  it("counts total already paid", () => {
    expect(totalPaid("seed-wk-1", records, items)).toBe(1200);
  });

  it("outstanding = earned − paid", () => {
    expect(outstandingForWorker("seed-wk-1", records, items)).toBe(1080);
    expect(outstandingForWorker("seed-wk-2", records, items)).toBe(990);
  });

  it("outstanding is zero for a fully-paid worker", () => {
    expect(outstandingForWorker("seed-wk-3", records, items)).toBe(0);
  });

  it("knows which records are already paid (no double-pay)", () => {
    expect(isRecordPaid("seed-cr-1", items)).toBe(true); // paid
    expect(isRecordPaid("seed-cr-2", items)).toBe(false); // unpaid
    const unpaid = unpaidRecords("seed-wk-1", records, items).map((r) => r.id);
    expect(unpaid).toEqual(["seed-cr-2"]);
  });

  it("paying the remaining record drops outstanding to zero", () => {
    // Simulate paying Sarah's unpaid record by adding a payment item for it.
    const withPayment = [
      ...items,
      {
        id: "test-item",
        worker_payment_id: "test-pay",
        compensation_record_id: "seed-cr-2",
        amount: 1080,
      },
    ];
    expect(outstandingForWorker("seed-wk-1", records, withPayment)).toBe(0);
  });
});
