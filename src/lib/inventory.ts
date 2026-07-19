export type Movement = { type: "IN" | "OUT"; quantity: number };

export function computeStockBalance(movements: Movement[]): number {
  return movements.reduce((balance, m) => balance + (m.type === "IN" ? m.quantity : -m.quantity), 0);
}

// يتحقق إن حركة "منصرف" جديدة مش هتخلي الرصيد يبقى سالب
export function canWithdraw(currentBalance: number, quantity: number): boolean {
  return quantity > 0 && currentBalance - quantity >= 0;
}

export function isLowStock(currentBalance: number, reorderLevel: number): boolean {
  return currentBalance <= reorderLevel;
}
