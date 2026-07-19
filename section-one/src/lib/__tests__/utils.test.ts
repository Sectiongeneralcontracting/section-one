import { describe, it, expect } from "vitest";
import { formatCurrency, cn } from "../utils";

describe("formatCurrency", () => {
  it("formats a numeric value with the EGP currency symbol by default", () => {
    const out = formatCurrency(1000);
    expect(out).toContain("1,000");
  });
  it("accepts string input", () => {
    const out = formatCurrency("2500.50");
    expect(out).toContain("2,500.5");
  });
});

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("ignores falsy values", () => {
    expect(cn("text-sm", false, undefined, "font-bold")).toBe("text-sm font-bold");
  });
});
