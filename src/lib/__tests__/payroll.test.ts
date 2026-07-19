import { describe, it, expect } from "vitest";
import {
  computeNetSalary,
  computeAttendanceSummary,
  computeAbsenceDeduction,
  computeWorkedHours,
} from "../payroll";

describe("computeNetSalary", () => {
  it("adds allowances and subtracts deductions from base salary", () => {
    expect(computeNetSalary(10000, 1000, 500)).toBe(10500);
  });
  it("can result in 0 when deductions equal base + allowances", () => {
    expect(computeNetSalary(5000, 0, 5000)).toBe(0);
  });
});

describe("computeAttendanceSummary", () => {
  it("tallies each status correctly", () => {
    const summary = computeAttendanceSummary([
      { status: "PRESENT" }, { status: "PRESENT" }, { status: "ABSENT" },
      { status: "LEAVE" }, { status: "SICK" },
    ]);
    expect(summary).toEqual({ present: 2, absent: 1, leave: 1, sick: 1, total: 5 });
  });
});

describe("computeAbsenceDeduction", () => {
  it("returns 0 for no absence", () => {
    expect(computeAbsenceDeduction(9000, 0)).toBe(0);
  });
  it("deducts a proportional daily rate for absent days", () => {
    expect(computeAbsenceDeduction(9000, 3, 30)).toBe(900); // 300/day * 3
  });
});

describe("computeWorkedHours", () => {
  it("computes the hours between check-in and check-out", () => {
    const checkIn = new Date("2026-03-01T08:00:00Z");
    const checkOut = new Date("2026-03-01T16:30:00Z");
    expect(computeWorkedHours(checkIn, checkOut)).toBe(8.5);
  });
  it("returns 0 when check-out is before check-in", () => {
    const checkIn = new Date("2026-03-01T16:00:00Z");
    const checkOut = new Date("2026-03-01T08:00:00Z");
    expect(computeWorkedHours(checkIn, checkOut)).toBe(0);
  });
});
