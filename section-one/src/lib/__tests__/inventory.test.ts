import { describe, it, expect } from "vitest";
import { computeStockBalance, canWithdraw, isLowStock } from "../inventory";

describe("computeStockBalance", () => {
  it("returns 0 for no movements", () => {
    expect(computeStockBalance([])).toBe(0);
  });
  it("adds IN movements and subtracts OUT movements", () => {
    const balance = computeStockBalance([
      { type: "IN", quantity: 100 },
      { type: "OUT", quantity: 30 },
      { type: "IN", quantity: 20 },
    ]);
    expect(balance).toBe(90);
  });
});

describe("canWithdraw", () => {
  it("allows a withdrawal that does not exceed the current balance", () => {
    expect(canWithdraw(100, 50)).toBe(true);
  });
  it("allows withdrawing the exact remaining balance", () => {
    expect(canWithdraw(50, 50)).toBe(true);
  });
  it("rejects a withdrawal that would make the balance negative", () => {
    expect(canWithdraw(30, 50)).toBe(false);
  });
  it("rejects a non-positive quantity", () => {
    expect(canWithdraw(100, 0)).toBe(false);
    expect(canWithdraw(100, -5)).toBe(false);
  });
});

describe("isLowStock", () => {
  it("flags stock at or below the reorder level", () => {
    expect(isLowStock(10, 10)).toBe(true);
    expect(isLowStock(5, 10)).toBe(true);
  });
  it("does not flag stock above the reorder level", () => {
    expect(isLowStock(15, 10)).toBe(false);
  });
});
