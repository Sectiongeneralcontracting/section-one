import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      items: { orderBy: { createdAt: "asc" } },
      convertedProject: { select: { id: true, name: true, code: true } },
    },
  });
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quotation);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.quotation.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.status === "CONVERTED")
    return NextResponse.json({ error: "عرض السعر ده اتحول لعقد بالفعل — مينفعش يتعدّل" }, { status: 400 });

  // تحديث الحالة (إرسال / قبول / رفض)
  if (body.action) {
    const allowed: Record<string, string[]> = {
      DRAFT: ["SENT"],
      SENT: ["ACCEPTED", "REJECTED"],
      ACCEPTED: ["REJECTED"],
      REJECTED: ["SENT"],
    };
    const nextStatus = body.action as string;
    if (!allowed[before.status]?.includes(nextStatus)) {
      return NextResponse.json({ error: `لا يمكن الانتقال من ${before.status} إلى ${nextStatus}` }, { status: 400 });
    }
    const quotation = await prisma.quotation.update({ where: { id: params.id }, data: { status: nextStatus as any } });
    await logAudit({ userId: (session.user as any).id, action: `QUOTATION_${nextStatus}`, entityType: "Quotation", entityId: quotation.id, before, after: quotation });
    if (nextStatus === "ACCEPTED") {
      await notifyAdmins("QUOTATION_ACCEPTED", `العميل وافق على عرض السعر ${before.quotationNumber} — جاهز للتحويل لعقد`);
    }
    return NextResponse.json(quotation);
  }

  // تعديل بيانات عرض السعر الأساسية
  const quotation = await prisma.quotation.update({
    where: { id: params.id },
    data: {
      projectName: body.projectName ?? undefined,
      date: body.date ? new Date(body.date) : undefined,
      validUntil: body.validUntil !== undefined ? (body.validUntil ? new Date(body.validUntil) : null) : undefined,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({ userId: (session.user as any).id, action: "QUOTATION_UPDATED", entityType: "Quotation", entityId: quotation.id, before, after: quotation });
  return NextResponse.json(quotation);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.quotation.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.status === "CONVERTED")
    return NextResponse.json({ error: "عرض السعر ده اتحول لعقد بالفعل — مينفعش يتحذف" }, { status: 400 });

  await prisma.$transaction([
    prisma.quotationItem.deleteMany({ where: { quotationId: params.id } }),
    prisma.quotation.delete({ where: { id: params.id } }),
  ]);

  await logAudit({ userId: (session.user as any).id, action: "QUOTATION_DELETED", entityType: "Quotation", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
