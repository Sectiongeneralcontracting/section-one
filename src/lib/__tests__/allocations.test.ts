import { describe, it, expect } from "vitest";
import { validateAllocationTotal, computePartnerProfit } from "../allocations";

describe("validateAllocationTotal", () => {
  it("passes when the list is empty (no allocations set yet)", () => {
    expect(validateAllocationTotal([]).valid).toBe(true);
  });
  it("passes when percentages sum to exactly 100", () => {
    const result = validateAllocationTotal([{ sharePct: 40 }, { sharePct: 35 }, { sharePct: 25 }]);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
  });
  it("fails when percentages sum to less than 100", () => {
    const result = validateAllocationTotal([{ sharePct: 40 }, { sharePct: 30 }]);
    expect(result.valid).toBe(false);
    expect(result.total).toBe(70);
  });
  it("fails when percentages sum to more than 100", () => {
    const result = validateAllocationTotal([{ sharePct: 60 }, { sharePct: 60 }]);
    expect(result.valid).toBe(false);
  });
  it("tolerates small floating point rounding errors", () => {
    const result = validateAllocationTotal([{ sharePct: 33.33 }, { sharePct: 33.33 }, { sharePct: 33.34 }]);
    expect(result.valid).toBe(true);
  });
});

describe("computePartnerProfit", () => {
  it("computes the correct share of profit", () => {
    expect(computePartnerProfit(40, 1000000)).toBe(400000);
  });
  it("returns 0 for a 0% share", () => {
    expect(computePartnerProfit(0, 1000000)).toBe(0);
  });
  it("handles a negative net profit (loss) proportionally", () => {
    expect(computePartnerProfit(50, -200000)).toBe(-100000);
  });
});
