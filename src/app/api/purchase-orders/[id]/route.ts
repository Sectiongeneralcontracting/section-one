import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { supplier: true, project: true, items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

const allowedTransitions: Record<string, string[]> = {
  DRAFT: ["APPROVED", "CANCELLED"],
  APPROVED: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["PAID"],
  PAID: [],
  CANCELLED: [],
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const nextStatus = body.status as string;

  const before = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { supplier: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!allowedTransitions[before.status]?.includes(nextStatus)) {
    return NextResponse.json(
      { error: `لا يمكن الانتقال من ${before.status} إلى ${nextStatus}` },
      { status: 400 }
    );
  }

  // صرف الأمر يتطلب صلاحية Admin
  if (nextStatus === "PAID" && role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });

  const order = await prisma.purchaseOrder.update({
    where: { id: params.id },
    data: { status: nextStatus as any },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: `PURCHASE_ORDER_${nextStatus}`,
    entityType: "PurchaseOrder",
    entityId: order.id,
    before,
    after: order,
  });
  if (nextStatus === "APPROVED") {
    await notifyAdmins("PURCHASE_ORDER_APPROVED", `تم اعتماد أمر شراء: ${before.poNumber} من ${before.supplier.name}`);
  }

  return NextResponse.json(order);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.purchaseOrder.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.status !== "DRAFT")
    return NextResponse.json({ error: "مينفعش تحذف أمر شراء اتعمد أو اتنفذ بالفعل" }, { status: 400 });

  await prisma.purchaseOrder.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "PURCHASE_ORDER_DELETED", entityType: "PurchaseOrder", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
