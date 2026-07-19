export type PoItemInput = { quantity: number; unitPrice: number };

export function computePoTotal(items: PoItemInput[]): number {
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return Math.round(total * 100) / 100;
}
