import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KpiCard } from "./kpi-card";

describe("KpiCard", () => {
  it("renders the label and value", () => {
    render(<KpiCard label="Revenue (This Month)" value="$42,180" />);
    expect(screen.getByText("Revenue (This Month)")).toBeInTheDocument();
    expect(screen.getByText("$42,180")).toBeInTheDocument();
  });

  it("shows the trend percentage when a delta is provided", () => {
    render(<KpiCard label="Active Clients" value="38" delta={5.6} />);
    expect(screen.getByText("5.6%")).toBeInTheDocument();
  });
});
