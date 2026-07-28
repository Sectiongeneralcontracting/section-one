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
  const before = await prisma.warehouse.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const warehouse = await prisma.warehouse.update({
    where: { id: params.id },
    data: { name: body.name ?? undefined, location: body.location ?? undefined },
  });

  await logAudit({ userId: (session.user as any).id, action: "WAREHOUSE_UPDATED", entityType: "Warehouse", entityId: warehouse.id, before, after: warehouse });
  return NextResponse.json(warehouse);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.warehouse.findUnique({ where: { id: params.id }, include: { movements: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.movements.length > 0)
    return NextResponse.json({ error: "لا يمكن حذف مخزن له حركات مسجلة" }, { status: 400 });

  await prisma.warehouse.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "WAREHOUSE_DELETED", entityType: "Warehouse", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
