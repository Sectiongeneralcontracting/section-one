import { describe, it, expect } from "vitest";
import { computeCertificate } from "../certificates";

describe("computeCertificate", () => {
  const base = {
    contractValue: 1000000,
    cumulativePct: 30,
    previousCumulativeValue: 0,
    retentionPct: 5,
    advancePaymentAmount: 0,
    advanceRecoveredSoFar: 0,
  };

  it("computes the first certificate correctly with no retention/advance", () => {
    const r = computeCertificate(base);
    expect(r.cumulativeValue).toBe(300000);
    expect(r.thisPeriodValue).toBe(300000);
    expect(r.retentionAmount).toBe(15000); // 5%
    expect(r.netPayable).toBe(285000);
  });

  it("computes a second certificate based on the previous cumulative value", () => {
    const r = computeCertificate({ ...base, cumulativePct: 55, previousCumulativeValue: 300000 });
    expect(r.cumulativeValue).toBe(550000);
    expect(r.thisPeriodValue).toBe(250000);
    expect(r.retentionAmount).toBe(12500);
  });

  it("deducts advance payment recovery proportionally to the advance percentage", () => {
    const r = computeCertificate({
      ...base,
      advancePaymentAmount: 100000, // 10% of contract value
      advanceRecoveredSoFar: 0,
    });
    // thisPeriodValue = 300000, advance rate = 10% -> recovery = 30000
    expect(r.advanceRecoveryAmount).toBe(30000);
    expect(r.netPayable).toBe(300000 - 15000 - 30000);
  });

  it("stops recovering advance once the full advance amount has been recovered", () => {
    const r = computeCertificate({
      ...base,
      advancePaymentAmount: 100000,
      advanceRecoveredSoFar: 95000, // only 5000 left to recover
    });
    expect(r.advanceRecoveryAmount).toBe(5000);
  });

  it("applies tax percentage on this period's value", () => {
    const r = computeCertificate({ ...base, taxPct: 1 });
    expect(r.taxAmount).toBe(3000); // 1% of 300000
  });

  it("never lets this period value be negative-driven net payable silently wrong when cumulative decreases", () => {
    const r = computeCertificate({ ...base, cumulativePct: 20, previousCumulativeValue: 300000 });
    expect(r.thisPeriodValue).toBe(-100000);
  });
});
