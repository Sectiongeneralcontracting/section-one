import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { CLIENT_DATA, CONTRACTS_SEED_V2 } from "@/lib/import-data/raya-foodz-contracts-v2";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });

  const results: { project: string; status: string }[] = [];

  let client = await prisma.client.findFirst({ where: { name: CLIENT_DATA.name } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: CLIENT_DATA.name, address: CLIENT_DATA.address, notes: CLIENT_DATA.notes },
    });
  }

  for (const seed of CONTRACTS_SEED_V2) {
    const boqTotal = seed.boq.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const existingProject = await prisma.project.findUnique({
      where: { code: seed.projectCode },
      include: { contract: { include: { certificates: true } } },
    });

    if (existingProject) {
      // --- استبدال: تحديث المشروع والعقد، وحذف جدول الكميات القديم بالكامل واستبداله بالجديد ---
      await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          name: seed.projectName,
          contractValue: seed.contractValue,
          startDate: new Date(seed.signedDate),
          description: seed.notes,
        },
      });

      if (existingProject.contract) {
        await prisma.contract.update({
          where: { id: existingProject.contract.id },
          data: {
            contractNumber: seed.contractNumber,
            signedDate: new Date(seed.signedDate),
            advancePaymentPct: seed.advancePaymentPct,
            advancePaymentAmount: (seed.advancePaymentPct / 100) * seed.contractValue,
            notes: seed.notes,
          },
        });
        await prisma.boqItem.deleteMany({ where: { contractId: existingProject.contract.id } });
        await prisma.boqItem.createMany({
          data: seed.boq.map((b) => ({
            contractId: existingProject.contract!.id,
            code: b.code,
            description: b.description,
            unit: b.unit,
            quantity: b.quantity,
            unitPrice: b.unitPrice,
          })),
        });
      } else {
        const contract = await prisma.contract.create({
          data: {
            projectId: existingProject.id,
            contractNumber: seed.contractNumber,
            signedDate: new Date(seed.signedDate),
            retentionPct: 0,
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
      }

      await logAudit({
        userId: (session.user as any).id,
        action: "CONTRACT_BULK_REPLACED",
        entityType: "Project",
        entityId: existingProject.id,
        before: { contractValue: Number(existingProject.contractValue) },
        after: { contractValue: seed.contractValue, boqTotal },
      });

      results.push({
        project: seed.projectName,
        status: `تم الاستبدال — ${seed.boq.length} بند، القيمة الجديدة ${seed.contractValue.toLocaleString("ar-EG")} ج.م${
          existingProject.contract && existingProject.contract.certificates.length > 0
            ? ` ⚠️ تحذير: العقد ده عليه ${existingProject.contract.certificates.length} مستخلص مسجل من قبل — راجعها يدويًا لأن قيمة العقد اتغيرت`
            : ""
        }`,
      });
      continue;
    }

    // --- المشروع غير موجود أصلًا: إنشاء جديد بالكامل ---
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
        retentionPct: 0,
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
      entityType: "Project",
      entityId: project.id,
      after: { projectCode: seed.projectCode, boqTotal },
    });

    results.push({
      project: seed.projectName,
      status: `تم الإنشاء (مشروع جديد) — ${seed.boq.length} بند، القيمة ${seed.contractValue.toLocaleString("ar-EG")} ج.م`,
    });
  }

  return NextResponse.json({ client: client.name, results });
}
