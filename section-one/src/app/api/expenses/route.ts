import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/schemas";
import { logAudit, notifyAdmins } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  const expenses = await prisma.expense.findMany({
    where: projectId ? { projectId } : undefined,
    include: { project: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      createdById: (session.user as any).id,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "EXPENSE_CREATED",
    entityType: "Expense",
    entityId: expense.id,
    after: expense,
  });
  await notifyAdmins("EXPENSE_EDITED", `تم إضافة مصروف جديد بقيمة ${expense.amount}`);

  return NextResponse.json(expense, { status: 201 });
}
