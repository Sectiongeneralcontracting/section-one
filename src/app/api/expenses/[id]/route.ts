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
  const before = await prisma.expense.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.project.status === "CLOSED")
    return NextResponse.json({ error: "لا يمكن تعديل مصروفات مشروع مغلق" }, { status: 400 });

  const expense = await prisma.expense.update({
    where: { id: params.id },
    data: {
      category: body.category ?? undefined,
      amount: body.amount ?? undefined,
      description: body.description ?? undefined,
      date: body.date ? new Date(body.date) : undefined,
    },
  });

  await logAudit({ userId: (session.user as any).id, action: "EXPENSE_UPDATED", entityType: "Expense", entityId: expense.id, before, after: expense });
  return NextResponse.json(expense);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.expense.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.project.status === "CLOSED")
    return NextResponse.json({ error: "لا يمكن حذف مصروفات مشروع مغلق" }, { status: 400 });

  await prisma.expense.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "EXPENSE_DELETED", entityType: "Expense", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
