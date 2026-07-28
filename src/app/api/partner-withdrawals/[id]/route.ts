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
  const before = await prisma.partnerWithdrawal.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const withdrawal = await prisma.partnerWithdrawal.update({
    where: { id: params.id },
    data: {
      amount: body.amount ?? undefined,
      date: body.date ? new Date(body.date) : undefined,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({ userId: (session.user as any).id, action: "PARTNER_WITHDRAWAL_UPDATED", entityType: "PartnerWithdrawal", entityId: withdrawal.id, before, after: withdrawal });
  return NextResponse.json(withdrawal);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.partnerWithdrawal.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.partnerWithdrawal.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "PARTNER_WITHDRAWAL_DELETED", entityType: "PartnerWithdrawal", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
