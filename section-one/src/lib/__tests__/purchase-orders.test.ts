import { describe, it, expect } from "vitest";
import { computePoTotal } from "../purchase-orders";

describe("computePoTotal", () => {
  it("returns 0 for an empty order", () => {
    expect(computePoTotal([])).toBe(0);
  });
  it("sums quantity × unit price across items", () => {
    const total = computePoTotal([
      { quantity: 10, unitPrice: 50 },
      { quantity: 2, unitPrice: 1000 },
    ]);
    expect(total).toBe(2500);
  });
  it("rounds to 2 decimal places", () => {
    const total = computePoTotal([{ quantity: 3, unitPrice: 10.005 }]);
    expect(total).toBe(30.02);
  });
});
