import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const paymentSchema = z.object({
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.clientPayment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payment = await prisma.clientPayment.update({
    where: { id: params.id },
    data: {
      amount: parsed.data.amount ?? undefined,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      notes: parsed.data.notes ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "CLIENT_PAYMENT_UPDATED",
    entityType: "ClientPayment",
    entityId: payment.id,
    before,
    after: payment,
  });

  return NextResponse.json(payment);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const before = await prisma.clientPayment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.clientPayment.delete({ where: { id: params.id } });

  await logAudit({
    userId: (session.user as any).id,
    action: "CLIENT_PAYMENT_DELETED",
    entityType: "ClientPayment",
    entityId: params.id,
    before,
  });

  return NextResponse.json({ ok: true });
}
