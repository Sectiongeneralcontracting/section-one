import type { PrismaClient } from "@prisma/client";

// بعد أي إضافة/تعديل/حذف لبند في جدول الكميات، بيعيد حساب الإجمالي ويحدّث قيمة المشروع المرتبط بالعقد تلقائيًا
export async function syncProjectValueFromBoq(
  prisma: PrismaClient,
  contractId: string
): Promise<number> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { boqItems: true },
  });
  if (!contract) throw new Error("العقد غير موجود");

  const boqTotal = contract.boqItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const rounded = Math.round(boqTotal * 100) / 100;

  await prisma.project.update({
    where: { id: contract.projectId },
    data: { contractValue: rounded },
  });

  return rounded;
}
