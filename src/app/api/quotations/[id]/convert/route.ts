import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const schema = z.object({
  projectCode: z.string().min(1),
  contractNumber: z.string().min(1),
  startDate: z.string(),
  retentionPct: z.number().min(0).max(100).optional(),
  advancePaymentPct: z.number().min(0).max(100).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "التحويل لعقد يتطلب صلاحية Admin" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: { items: true, client: true },
  });
  if (!quotation) return NextResponse.json({ error: "عرض السعر غير موجود" }, { status: 404 });
  if (quotation.status !== "ACCEPTED") {
    return NextResponse.json({ error: "لازم عرض السعر يكون في حالة (مقبول من العميل) الأول قبل التحويل" }, { status: 400 });
  }
  if (quotation.items.length === 0) {
    return NextResponse.json({ error: "عرض السعر مفيهوش بنود — أضف بنود الأول" }, { status: 400 });
  }

  const existingCode = await prisma.project.findUnique({ where: { code: parsed.data.projectCode } });
  if (existingCode) return NextResponse.json({ error: "كود المشروع ده مستخدم بالفعل" }, { status: 400 });
  const existingContractNumber = await prisma.contract.findUnique({ where: { contractNumber: parsed.data.contractNumber } });
  if (existingContractNumber) return NextResponse.json({ error: "رقم العقد ده مستخدم بالفعل" }, { status: 400 });

  const contractValue = quotation.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const retentionPct = parsed.data.retentionPct ?? 5;
  const advancePaymentPct = parsed.data.advancePaymentPct ?? 0;

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          code: parsed.data.projectCode,
          name: quotation.projectName,
          clientId: quotation.clientId,
          contractValue,
          startDate: new Date(parsed.data.startDate),
          status: "ONGOING",
        },
      });

      const contract = await tx.contract.create({
        data: {
          projectId: project.id,
          contractNumber: parsed.data.contractNumber,
          signedDate: new Date(parsed.data.startDate),
          retentionPct,
          advancePaymentPct,
          advancePaymentAmount: (advancePaymentPct / 100) * contractValue,
          notes: `تم إنشاؤه من عرض السعر ${quotation.quotationNumber}`,
        },
      });

      await tx.boqItem.createMany({
        data: quotation.items.map((i) => ({
          contractId: contract.id,
          code: i.code ?? "-",
          description: i.description,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      const updatedQuotation = await tx.quotation.update({
        where: { id: params.id },
        data: { status: "CONVERTED", convertedProjectId: project.id },
      });

      return { project, contract, quotation: updatedQuotation };
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "تعذر التحويل" }, { status: 400 });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: "QUOTATION_CONVERTED",
    entityType: "Quotation",
    entityId: params.id,
    after: result,
  });
  await notifyAdmins("QUOTATION_CONVERTED", `تم تحويل عرض السعر ${quotation.quotationNumber} لمشروع فعلي: ${result.project.name}`);

  return NextResponse.json(result);
}
