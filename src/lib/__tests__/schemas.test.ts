import { describe, it, expect } from "vitest";
import { clientSchema, projectSchema, expenseSchema, partnerSchema, contributionSchema } from "../schemas";

describe("clientSchema", () => {
  it("accepts a valid client", () => {
    const result = clientSchema.safeParse({ name: "شركة النيل" });
    expect(result.success).toBe(true);
  });
  it("rejects a client with a name shorter than 2 chars", () => {
    const result = clientSchema.safeParse({ name: "ن" });
    expect(result.success).toBe(false);
  });
  it("rejects an invalid email", () => {
    const result = clientSchema.safeParse({ name: "شركة النيل", email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  const base = {
    code: "PRJ-001",
    name: "برج النيل",
    clientId: "abc123",
    contractValue: 1000000,
    startDate: "2026-01-01",
  };
  it("accepts a valid project with default status", () => {
    const result = projectSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("ONGOING");
  });
  it("rejects a negative or zero contract value", () => {
    const result = projectSchema.safeParse({ ...base, contractValue: 0 });
    expect(result.success).toBe(false);
  });
  it("rejects an invalid status", () => {
    const result = projectSchema.safeParse({ ...base, status: "UNKNOWN" });
    expect(result.success).toBe(false);
  });
});

describe("expenseSchema", () => {
  it("accepts a valid expense", () => {
    const result = expenseSchema.safeParse({
      projectId: "p1",
      category: "MATERIALS",
      amount: 5000,
    });
    expect(result.success).toBe(true);
  });
  it("rejects an invalid category", () => {
    const result = expenseSchema.safeParse({ projectId: "p1", category: "FOOD", amount: 5000 });
    expect(result.success).toBe(false);
  });
});

describe("partnerSchema", () => {
  it("rejects a share above 100%", () => {
    const result = partnerSchema.safeParse({ name: "شريك", defaultShare: 150 });
    expect(result.success).toBe(false);
  });
  it("accepts a share of 0-100", () => {
    const result = partnerSchema.safeParse({ name: "شريك", defaultShare: 40 });
    expect(result.success).toBe(true);
  });
});

describe("contributionSchema", () => {
  it("rejects a non-positive amount", () => {
    const result = contributionSchema.safeParse({ partnerId: "p1", amount: -10 });
    expect(result.success).toBe(false);
  });
});
