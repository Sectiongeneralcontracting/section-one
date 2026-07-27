import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withdrawals = await prisma.partnerWithdrawal.findMany({
    where: { partnerId: params.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(withdrawals);
}

// السحب صلاحية Admin فقط — ده بيخصم من رصيد الشريك مباشرة
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });

  const body = await req.json();
  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const partner = await prisma.partner.findUnique({ where: { id: params.id } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const withdrawal = await prisma.partnerWithdrawal.create({
    data: {
      partnerId: params.id,
      amount: parsed.data.amount,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      notes: parsed.data.notes,
      createdById: (session.user as any).id,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PARTNER_WITHDRAWAL_RECORDED",
    entityType: "PartnerWithdrawal",
    entityId: withdrawal.id,
    after: withdrawal,
  });

  return NextResponse.json(withdrawal, { status: 201 });
}
