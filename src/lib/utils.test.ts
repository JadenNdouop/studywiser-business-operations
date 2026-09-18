import { describe, expect, it } from "vitest";

import { cn, formatCurrency, formatNumber, formatPercent } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("resolves conflicting tailwind classes in favor of the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("formatCurrency", () => {
  it("formats whole dollars with a grouping separator", () => {
    expect(formatCurrency(42180)).toBe("$42,180");
  });

  it("rounds to whole dollars by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,235");
  });
});

describe("formatNumber", () => {
  it("adds grouping separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("formatPercent", () => {
  it("formats to one decimal place with a percent sign", () => {
    expect(formatPercent(12.4)).toBe("12.4%");
  });
});
