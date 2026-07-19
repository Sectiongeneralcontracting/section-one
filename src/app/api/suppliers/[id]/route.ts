import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.supplier.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      category: body.category ?? undefined,
      phone: body.phone ?? undefined,
      email: body.email ?? undefined,
      address: body.address ?? undefined,
      taxNumber: body.taxNumber ?? undefined,
      isActive: body.isActive ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUPPLIER_UPDATED",
    entityType: "Supplier",
    entityId: supplier.id,
    before,
    after: supplier,
  });

  return NextResponse.json(supplier);
}

// منع حذف مورد له أوامر شراء (اتساقًا مع نفس قاعدة الحماية المتبعة في النظام)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: { purchaseOrders: true },
  });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (supplier.purchaseOrders.length > 0)
    return NextResponse.json({ error: "لا يمكن حذف مورد له أوامر شراء مسجلة" }, { status: 403 });

  await prisma.supplier.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "SUPPLIER_DELETED",
    entityType: "Supplier",
    entityId: params.id,
    before: supplier,
  });
  return NextResponse.json({ ok: true });
}
