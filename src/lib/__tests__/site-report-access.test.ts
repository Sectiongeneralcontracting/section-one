import { describe, it, expect } from "vitest";
import { canEditSiteReport } from "../site-report-access";

describe("canEditSiteReport", () => {
  it("allows editing within 24 hours for a non-admin", () => {
    const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // من ساعتين
    expect(canEditSiteReport(createdAt, "SITE_ENGINEER").allowed).toBe(true);
  });

  it("blocks editing after 24 hours for a non-admin", () => {
    const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // من 25 ساعة
    const result = canEditSiteReport(createdAt, "SITE_ENGINEER");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("always allows editing for admin regardless of time", () => {
    const createdAt = new Date(Date.now() - 999 * 60 * 60 * 1000);
    expect(canEditSiteReport(createdAt, "ADMIN").allowed).toBe(true);
  });

  it("blocks exactly at the 24-hour boundary plus a bit", () => {
    const createdAt = new Date(Date.now() - (24 * 60 + 1) * 60 * 1000);
    expect(canEditSiteReport(createdAt, "MANAGER").allowed).toBe(false);
  });
});
