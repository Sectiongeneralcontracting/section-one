import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { computeStockBalance } from "@/lib/inventory";

const itemSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1),
  reorderLevel: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({
    include: { movements: { include: { warehouse: true } } },
    orderBy: { name: "asc" },
  });

  // إضافة الرصيد الحالي الإجمالي ورصيد كل مخزن لكل صنف
  const withBalances = items.map((item) => {
    const byWarehouse: Record<string, number> = {};
    for (const m of item.movements) {
      const delta = m.type === "IN" ? Number(m.quantity) : -Number(m.quantity);
      byWarehouse[m.warehouseId] = (byWarehouse[m.warehouseId] ?? 0) + delta;
    }
    const totalBalance = computeStockBalance(
      item.movements.map((m) => ({ type: m.type as "IN" | "OUT", quantity: Number(m.quantity) }))
    );
    return { ...item, totalBalance, byWarehouse };
  });

  return NextResponse.json(withBalances);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await prisma.inventoryItem.create({ data: parsed.data });
  await logAudit({
    userId: (session.user as any).id,
    action: "INVENTORY_ITEM_CREATED",
    entityType: "InventoryItem",
    entityId: item.id,
    after: item,
  });
  return NextResponse.json(item, { status: 201 });
}
