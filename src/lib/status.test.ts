import { describe, expect, it } from "vitest";

import { getStatusMeta, humanizeStatus } from "./status";

describe("humanizeStatus", () => {
  it("turns snake_case into Title Case", () => {
    expect(humanizeStatus("new_lead")).toBe("New Lead");
    expect(humanizeStatus("partially_paid")).toBe("Partially Paid");
  });
});

describe("getStatusMeta", () => {
  it("maps known statuses to the right color", () => {
    expect(getStatusMeta("overdue").variant).toBe("destructive");
    expect(getStatusMeta("paid").variant).toBe("success");
    expect(getStatusMeta("converted").variant).toBe("success");
  });

  it("falls back to a neutral, humanized label for unknown statuses", () => {
    const meta = getStatusMeta("some_new_status");
    expect(meta.variant).toBe("muted");
    expect(meta.label).toBe("Some New Status");
  });
});
