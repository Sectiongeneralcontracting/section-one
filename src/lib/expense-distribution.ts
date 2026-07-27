import type { Prisma } from "@prisma/client";

export type ProjectForDistribution = { id: string; contractValue: number | string };

export function computeDistributionShares<T extends ProjectForDistribution>(
  projects: T[],
  totalAmount: number
): { projectId: string; amount: number }[] {
  const totalValue = projects.reduce((s, p) => s + Number(p.contractValue), 0);
  if (totalValue <= 0) {
    // لو كل المشاريع بقيمة صفر (نادر) — وزّع بالتساوي بدل القسمة على صفر
    const equalShare = Math.round((totalAmount / projects.length) * 100) / 100;
    return projects.map((p) => ({ projectId: p.id, amount: equalShare }));
  }
  return projects.map((p) => ({
    projectId: p.id,
    amount: Math.round(((Number(p.contractValue) / totalValue) * totalAmount) * 100) / 100,
  }));
}

// تنشئ سجلات Expense فعلية على كل مشروع مفتوح، جوه transaction بتاعة الطالب
export async function distributeExpenseAcrossOpenProjects(
  tx: Prisma.TransactionClient,
  params: {
    amount: number;
    category: string; // قيمة من ExpenseCategory enum (MATERIALS/LABOR/SUBCONTRACTOR/EQUIPMENT/ADMINISTRATIVE/OTHER)
    description: string;
    date: Date;
    sourceHeadOfficeExpenseId?: string;
  }
) {
  const openProjects = await tx.project.findMany({
    where: { status: "ONGOING" },
    select: { id: true, contractValue: true },
  });

  if (openProjects.length === 0) {
    throw new Error("لا يوجد مشاريع مفتوحة (جارية) لتوزيع المصروف عليها حاليًا");
  }

  const shares = computeDistributionShares(openProjects, params.amount);

  await tx.expense.createMany({
    data: shares.map((s) => ({
      projectId: s.projectId,
      category: params.category as any,
      amount: s.amount,
      description: params.description,
      date: params.date,
      sourceHeadOfficeExpenseId: params.sourceHeadOfficeExpenseId,
    })),
  });

  return shares;
}
