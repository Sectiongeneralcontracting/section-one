import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { CLIENT_DATA, CONTRACTS_SEED } from "@/lib/import-data/raya-foodz-contracts";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });

  const results: { project: string; status: string }[] = [];

  // 1) العميل — بيتعمل مرة واحدة بس (findFirst بالاسم لتجنب التكرار)
  let client = await prisma.client.findFirst({ where: { name: CLIENT_DATA.name } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: CLIENT_DATA.name, address: CLIENT_DATA.address, notes: CLIENT_DATA.notes },
    });
  }

  for (const seed of CONTRACTS_SEED) {
    // آمن للتشغيل أكتر من مرة: لو المشروع بالكود ده موجود بالفعل، تجاهله
    const existingProject = await prisma.project.findUnique({ where: { code: seed.projectCode } });
    if (existingProject) {
      results.push({ project: seed.projectName, status: "موجود بالفعل — تم التجاهل" });
      continue;
    }

    const boqTotal = seed.boq.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    const project = await prisma.project.create({
      data: {
        code: seed.projectCode,
        name: seed.projectName,
        clientId: client.id,
        contractValue: seed.contractValue,
        startDate: new Date(seed.signedDate),
        status: "ONGOING",
        description: seed.notes,
      },
    });

    const contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        contractNumber: seed.contractNumber,
        signedDate: new Date(seed.signedDate),
        retentionPct: 0, // لا يوجد نص صريح على ضمان حسن تنفيذ في هذه العقود
        advancePaymentPct: seed.advancePaymentPct,
        advancePaymentAmount: (seed.advancePaymentPct / 100) * seed.contractValue,
        notes: seed.notes,
      },
    });

    await prisma.boqItem.createMany({
      data: seed.boq.map((b) => ({
        contractId: contract.id,
        code: b.code,
        description: b.description,
        unit: b.unit,
        quantity: b.quantity,
        unitPrice: b.unitPrice,
      })),
    });

    await logAudit({
      userId: (session.user as any).id,
      action: "CONTRACT_BULK_IMPORTED",
      entityType: "Contract",
      entityId: contract.id,
      after: { projectCode: seed.projectCode, boqTotal, declaredValue: seed.contractValue },
    });

    results.push({
      project: seed.projectName,
      status: `تم الاستيراد — ${seed.boq.length} بند، إجمالي البنود ${boqTotal.toLocaleString("ar-EG")} ج.م`,
    });
  }

  return NextResponse.json({ client: client.name, results });
}
