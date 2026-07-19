import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { computeStockBalance, canWithdraw } from "@/lib/inventory";

const movementSchema = z.object({
  warehouseId: z.string(),
  itemId: z.string(),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().positive(),
  projectId: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId") ?? undefined;
  const warehouseId = searchParams.get("warehouseId") ?? undefined;

  const movements = await prisma.stockMovement.findMany({
    where: { itemId, warehouseId },
    include: { item: true, warehouse: true, project: true },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json(movements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = movementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // التحقق من الرصيد قبل تسجيل أي حركة "منصرف" — منع الرصيد السالب
  if (parsed.data.type === "OUT") {
    const existing = await prisma.stockMovement.findMany({
      where: { itemId: parsed.data.itemId, warehouseId: parsed.data.warehouseId },
    });
    const currentBalance = computeStockBalance(
      existing.map((m) => ({ type: m.type as "IN" | "OUT", quantity: Number(m.quantity) }))
    );
    if (!canWithdraw(currentBalance, parsed.data.quantity)) {
      return NextResponse.json(
        { error: `الرصيد الحالي (${currentBalance}) أقل من الكمية المطلوب صرفها` },
        { status: 400 }
      );
    }
  }

  const movement = await prisma.stockMovement.create({
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      createdById: (session.user as any).id,
    },
    include: { item: true, warehouse: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "STOCK_MOVEMENT_CREATED",
    entityType: "StockMovement",
    entityId: movement.id,
    after: movement,
  });

  return NextResponse.json(movement, { status: 201 });
}
