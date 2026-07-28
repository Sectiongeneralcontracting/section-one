import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      project: { include: { client: true } },
      boqItems: { orderBy: { createdAt: "asc" } },
      certificates: { orderBy: { number: "asc" } },
    },
  });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.contract.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // لو نسبة الدفعة المقدمة اتغيّرت، نعيد حساب قيمتها تلقائيًا بناءً على قيمة المشروع الحالية
  const advancePaymentAmount =
    body.advancePaymentPct !== undefined
      ? (Number(body.advancePaymentPct) / 100) * Number(before.project.contractValue)
      : body.advancePaymentAmount ?? undefined;

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: {
      contractNumber: body.contractNumber ?? undefined,
      signedDate: body.signedDate ? new Date(body.signedDate) : undefined,
      durationDays: body.durationDays ?? undefined,
      retentionPct: body.retentionPct ?? undefined,
      advancePaymentPct: body.advancePaymentPct ?? undefined,
      advancePaymentAmount,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "CONTRACT_UPDATED",
    entityType: "Contract",
    entityId: contract.id,
    before,
    after: contract,
  });

  return NextResponse.json(contract);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { certificates: true, boqItems: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.certificates.length > 0) {
    return NextResponse.json({ error: "لا يمكن حذف عقد له مستخلصات مسجلة" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.boqItem.deleteMany({ where: { contractId: params.id } }),
    prisma.contract.delete({ where: { id: params.id } }),
    // العقد اتمسح، فقيمة المشروع مبقاش ليها مصدر — نرجّعها صفر لحد ما يتضاف عقد جديد
    prisma.project.update({ where: { id: before.projectId }, data: { contractValue: 0 } }),
  ]);

  await logAudit({
    userId: (session.user as any).id,
    action: "CONTRACT_DELETED",
    entityType: "Contract",
    entityId: params.id,
    before,
  });

  return NextResponse.json({ ok: true });
}
