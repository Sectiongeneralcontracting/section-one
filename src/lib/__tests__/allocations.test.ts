import { describe, it, expect } from "vitest";
import { validateAllocationTotal, computePartnerProfit, computeSharesFromContributions } from "../allocations";

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

describe("computeSharesFromContributions", () => {
  it("computes each partner's share proportionally to their contribution", () => {
    const result = computeSharesFromContributions([
      { partnerId: "p1", contributionAmount: 600000 },
      { partnerId: "p2", contributionAmount: 400000 },
    ]);
    expect(result.find((r) => r.partnerId === "p1")?.sharePct).toBe(60);
    expect(result.find((r) => r.partnerId === "p2")?.sharePct).toBe(40);
  });

  it("handles three partners with unequal contributions summing to 100", () => {
    const result = computeSharesFromContributions([
      { partnerId: "p1", contributionAmount: 500000 },
      { partnerId: "p2", contributionAmount: 300000 },
      { partnerId: "p3", contributionAmount: 200000 },
    ]);
    const total = result.reduce((s, r) => s + r.sharePct, 0);
    expect(Math.round(total)).toBe(100);
  });

  it("returns 0% shares when total contribution is zero", () => {
    const result = computeSharesFromContributions([
      { partnerId: "p1", contributionAmount: 0 },
      { partnerId: "p2", contributionAmount: 0 },
    ]);
    expect(result.every((r) => r.sharePct === 0)).toBe(true);
  });

  it("gives a single partner 100% when they are the only contributor", () => {
    const result = computeSharesFromContributions([{ partnerId: "p1", contributionAmount: 250000 }]);
    expect(result[0].sharePct).toBe(100);
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
