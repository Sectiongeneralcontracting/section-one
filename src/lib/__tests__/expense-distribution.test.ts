import { describe, it, expect } from "vitest";
import { computeDistributionShares } from "../expense-distribution";

describe("computeDistributionShares", () => {
  it("distributes proportionally to each project's contract value", () => {
    const projects = [
      { id: "p1", contractValue: 600000 },
      { id: "p2", contractValue: 400000 },
    ];
    const shares = computeDistributionShares(projects, 10000);
    expect(shares.find((s) => s.projectId === "p1")?.amount).toBe(6000);
    expect(shares.find((s) => s.projectId === "p2")?.amount).toBe(4000);
  });

  it("sums up to (approximately) the original total amount", () => {
    const projects = [
      { id: "p1", contractValue: 500000 },
      { id: "p2", contractValue: 300000 },
      { id: "p3", contractValue: 200000 },
    ];
    const shares = computeDistributionShares(projects, 15000);
    const total = shares.reduce((s, x) => s + x.amount, 0);
    expect(Math.abs(total - 15000)).toBeLessThan(1);
  });

  it("splits equally when all project values are zero", () => {
    const projects = [
      { id: "p1", contractValue: 0 },
      { id: "p2", contractValue: 0 },
    ];
    const shares = computeDistributionShares(projects, 1000);
    expect(shares[0].amount).toBe(500);
    expect(shares[1].amount).toBe(500);
  });

  it("gives a single open project the full amount", () => {
    const shares = computeDistributionShares([{ id: "p1", contractValue: 100000 }], 5000);
    expect(shares[0].amount).toBe(5000);
  });
});
