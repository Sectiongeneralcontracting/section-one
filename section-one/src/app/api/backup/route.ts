import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// تصدير نسخة احتياطية كاملة (بدون كلمات المرور) بصيغة JSON
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    clients,
    projects,
    expenses,
    partners,
    contributions,
    allocations,
    closingReports,
    companyProfile,
    systemSettings,
  ] = await Promise.all([
    prisma.client.findMany(),
    prisma.project.findMany(),
    prisma.expense.findMany(),
    prisma.partner.findMany(),
    prisma.partnerContribution.findMany(),
    prisma.partnerProjectAllocation.findMany(),
    prisma.closingReport.findMany(),
    prisma.companyProfile.findUnique({ where: { id: "singleton" } }),
    prisma.systemSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      clients, projects, expenses, partners, contributions,
      allocations, closingReports, companyProfile, systemSettings,
    },
  };

  await logAudit({
    userId: (session.user as any).id,
    action: "BACKUP_EXPORTED",
    entityType: "System",
  });

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="section-finance-backup-${Date.now()}.json"`,
    },
  });
}

// استيراد نسخة احتياطية — يحذف البيانات الحالية ويستبدلها (خطوة حرجة، Admin فقط)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.confirm) {
    return NextResponse.json({ error: "يجب تأكيد الاستيراد صراحة (confirm: true)" }, { status: 400 });
  }
  const d = body.data;
  if (!d) return NextResponse.json({ error: "ملف النسخة الاحتياطية غير صالح" }, { status: 400 });

  await prisma.$transaction([
    prisma.closingReport.deleteMany(),
    prisma.partnerProjectAllocation.deleteMany(),
    prisma.partnerContribution.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.project.deleteMany(),
    prisma.client.deleteMany(),
    prisma.partner.deleteMany(),
  ]);

  await prisma.$transaction([
    prisma.client.createMany({ data: d.clients ?? [] }),
    prisma.partner.createMany({ data: d.partners ?? [] }),
  ]);
  await prisma.$transaction([
    prisma.project.createMany({ data: d.projects ?? [] }),
  ]);
  await prisma.$transaction([
    prisma.expense.createMany({ data: d.expenses ?? [] }),
    prisma.partnerContribution.createMany({ data: d.contributions ?? [] }),
    prisma.partnerProjectAllocation.createMany({ data: d.allocations ?? [] }),
    prisma.closingReport.createMany({ data: d.closingReports ?? [] }),
  ]);

  if (d.companyProfile) {
    await prisma.companyProfile.upsert({
      where: { id: "singleton" },
      update: d.companyProfile,
      create: { ...d.companyProfile, id: "singleton" },
    });
  }
  if (d.systemSettings) {
    await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      update: d.systemSettings,
      create: { ...d.systemSettings, id: "singleton" },
    });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: "BACKUP_RESTORED",
    entityType: "System",
  });

  return NextResponse.json({ ok: true });
}
