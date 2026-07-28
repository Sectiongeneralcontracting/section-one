import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { distributeExpenseAcrossOpenProjects } from "@/lib/expense-distribution";

const categoryLabels: Record<string, string> = {
  OFFICE_RENT: "إيجار المكتب",
  TRANSPORTATION: "الانتقالات",
  WATER: "فواتير المياه",
  ELECTRICITY: "فواتير الكهرباء",
  PHONE: "فواتير التليفون",
  EMAIL_INTERNET: "اشتراكات الإيميل والإنترنت",
  BUFFET: "البوفيه",
  PAYROLL: "رواتب موظفي المكتب الرئيسي",
  OTHER: "أخرى",
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "التعديل يتطلب صلاحية Admin" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.headOfficeExpense.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newAmount = body.amount !== undefined ? Number(body.amount) : Number(before.amount);
  const newCategory = body.category ?? before.category;
  const newDate = body.date ? new Date(body.date) : before.date;
  const newDescription = body.description ?? before.description ?? categoryLabels[newCategory];

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      // نمسح التوزيع القديم بالكامل ونعيد التوزيع من جديد بالقيمة الجديدة — عشان القيمة على المشاريع تفضل دقيقة
      await tx.expense.deleteMany({ where: { sourceHeadOfficeExpenseId: params.id } });

      const record = await tx.headOfficeExpense.update({
        where: { id: params.id },
        data: { amount: newAmount, category: newCategory, date: newDate, description: newDescription },
      });

      await distributeExpenseAcrossOpenProjects(tx, {
        amount: newAmount,
        category: "ADMINISTRATIVE",
        description: `${categoryLabels[newCategory] ?? newDescription} — موزّع من مصروفات المكتب الرئيسي`,
        date: newDate,
        sourceHeadOfficeExpenseId: record.id,
      });

      return tx.headOfficeExpense.findUnique({
        where: { id: record.id },
        include: { distributedExpenses: { include: { project: { select: { id: true, name: true, code: true } } } } },
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "تعذر حفظ التعديلات" }, { status: 400 });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: "HEAD_OFFICE_EXPENSE_UPDATED",
    entityType: "HeadOfficeExpense",
    entityId: params.id,
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.headOfficeExpense.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.expense.deleteMany({ where: { sourceHeadOfficeExpenseId: params.id } }),
    prisma.headOfficeExpense.delete({ where: { id: params.id } }),
  ]);

  await logAudit({
    userId: (session.user as any).id,
    action: "HEAD_OFFICE_EXPENSE_DELETED",
    entityType: "HeadOfficeExpense",
    entityId: params.id,
    before,
  });

  return NextResponse.json({ ok: true });
}
