import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const schema = z.object({
  amount: z.number().positive(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.subcontractorPayment.findMany({
    where: { contractId: params.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contract = await prisma.subcontractorContract.findUnique({
    where: { id: params.id },
    include: { subcontractor: true, project: true },
  });
  if (!contract) return NextResponse.json({ error: "العقد غير موجود" }, { status: 404 });

  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();
  const description = `دفعة لمقاول الباطن ${contract.subcontractor.name} — عقد ${contract.contractNumber}`;

  // الدفعة بتتحمّل مباشرة كمصروف على مصروفات المشروع (البند: مقاولي باطن)
  const payment = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        projectId: contract.projectId,
        category: "SUBCONTRACTOR",
        amount: parsed.data.amount,
        description,
        date,
      },
    });
    return tx.subcontractorPayment.create({
      data: {
        contractId: params.id,
        amount: parsed.data.amount,
        date,
        notes: parsed.data.notes,
        expenseId: expense.id,
        createdById: (session.user as any).id,
      },
    });
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUBCONTRACTOR_PAYMENT_RECORDED",
    entityType: "SubcontractorPayment",
    entityId: payment.id,
    after: payment,
  });
  await notifyAdmins(
    "SUBCONTRACTOR_PAYMENT_RECORDED",
    `دفعة بقيمة ${parsed.data.amount} لمقاول الباطن ${contract.subcontractor.name} في مشروع ${contract.project.name}`
  );

  return NextResponse.json(payment, { status: 201 });
}
