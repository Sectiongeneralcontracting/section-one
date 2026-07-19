import { describe, it, expect } from "vitest";
import { canAssignEquipment, canSendToMaintenance, nextStatusAfterUnassign } from "../equipment";

describe("canAssignEquipment", () => {
  it("allows assignment only when available", () => {
    expect(canAssignEquipment("AVAILABLE")).toBe(true);
    expect(canAssignEquipment("IN_USE")).toBe(false);
    expect(canAssignEquipment("MAINTENANCE")).toBe(false);
    expect(canAssignEquipment("OUT_OF_SERVICE")).toBe(false);
  });
});

describe("canSendToMaintenance", () => {
  it("allows maintenance from any status except out of service", () => {
    expect(canSendToMaintenance("AVAILABLE")).toBe(true);
    expect(canSendToMaintenance("IN_USE")).toBe(true);
    expect(canSendToMaintenance("OUT_OF_SERVICE")).toBe(false);
  });
});

describe("nextStatusAfterUnassign", () => {
  it("returns AVAILABLE when no maintenance is needed", () => {
    expect(nextStatusAfterUnassign(false)).toBe("AVAILABLE");
  });
  it("returns MAINTENANCE when maintenance is flagged", () => {
    expect(nextStatusAfterUnassign(true)).toBe("MAINTENANCE");
  });
});
