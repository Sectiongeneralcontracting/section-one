import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const nextStatus = body.status as string;
  if (!["APPROVED", "REJECTED", "DRAFT"].includes(nextStatus)) {
    return NextResponse.json({ error: "حالة غير معروفة" }, { status: 400 });
  }
  // اعتماد أمر تغيير بيغيّر القيمة الفعلية للعقد — يتطلب Admin
  if (nextStatus === "APPROVED" && (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "اعتماد أمر التغيير يتطلب صلاحية Admin" }, { status: 403 });
  }

  const before = await prisma.variationOrder.findUnique({
    where: { id: params.id },
    include: { project: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.status !== "DRAFT") {
    return NextResponse.json({ error: "أمر التغيير ده اتحسم فيه بالفعل" }, { status: 400 });
  }

  const order = await prisma.variationOrder.update({
    where: { id: params.id },
    data: { status: nextStatus as any },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: `VARIATION_ORDER_${nextStatus}`,
    entityType: "VariationOrder",
    entityId: order.id,
    before,
    after: order,
  });
  if (nextStatus === "APPROVED") {
    await notifyAdmins(
      "VARIATION_ORDER_APPROVED",
      `تم اعتماد أمر تغيير رقم ${before.orderNumber} لمشروع ${before.project.name} بقيمة ${before.amount}`
    );
  }

  return NextResponse.json(order);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.variationOrder.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.status !== "DRAFT")
    return NextResponse.json({ error: "مينفعش تحذف أمر تغيير اتحسم فيه بالفعل" }, { status: 400 });

  await prisma.variationOrder.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "VARIATION_ORDER_DELETED", entityType: "VariationOrder", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
