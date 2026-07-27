import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const paymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.clientPayment.findMany({
    where: { projectId: params.id },
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
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payment = await prisma.clientPayment.create({
    data: {
      projectId: params.id,
      amount: parsed.data.amount,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      notes: parsed.data.notes,
      createdById: (session.user as any).id,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "CLIENT_PAYMENT_RECORDED",
    entityType: "ClientPayment",
    entityId: payment.id,
    after: payment,
  });
  await notifyAdmins("PARTNER_CONTRIBUTION_EDITED", `تم تسجيل دفعة من العميل بقيمة ${payment.amount} لمشروع ${project.name}`);

  return NextResponse.json(payment, { status: 201 });
}
