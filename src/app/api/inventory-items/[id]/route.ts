import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "التعديل يتطلب صلاحية Admin" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.inventoryItem.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      unit: body.unit ?? undefined,
      reorderLevel: body.reorderLevel ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({ userId: (session.user as any).id, action: "INVENTORY_ITEM_UPDATED", entityType: "InventoryItem", entityId: item.id, before, after: item });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.inventoryItem.findUnique({ where: { id: params.id }, include: { movements: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.movements.length > 0)
    return NextResponse.json({ error: "لا يمكن حذف صنف له حركات مخزون مسجلة" }, { status: 400 });

  await prisma.inventoryItem.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "INVENTORY_ITEM_DELETED", entityType: "InventoryItem", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
