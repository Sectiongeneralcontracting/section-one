export function validateAllocationTotal(
  allocations: { sharePct: number }[]
): { valid: boolean; total: number; error?: string } {
  if (allocations.length === 0) return { valid: true, total: 0 };

  const total = allocations.reduce((s, a) => s + Number(a.sharePct), 0);
  const rounded = Math.round(total * 100) / 100;

  if (Math.round(rounded) !== 100) {
    return {
      valid: false,
      total: rounded,
      error: `مجموع النسب لازم يساوي 100% (حاليًا ${rounded}%)`,
    };
  }
  return { valid: true, total: rounded };
}

// يحسب صافي الربح لكل شريك بناءً على نسبته وصافي ربح المشروع
export function computePartnerProfit(sharePct: number, projectNetProfit: number): number {
  return Math.round((sharePct / 100) * projectNetProfit * 100) / 100;
}
