import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canEditSiteReport } from "@/lib/site-report-access";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.siteDailyReport.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true, code: true, client: { select: { name: true, logoUrl: true } } } },
      workerAttendance: { orderBy: { createdAt: "asc" } },
      equipmentLogs: { include: { equipment: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      materialLogs: { include: { item: { select: { id: true, name: true, unit: true } } }, orderBy: { createdAt: "asc" } },
      photos: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(report);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const before = await prisma.siteDailyReport.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = canEditSiteReport(before.createdAt, (session.user as any).role);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });

  const report = await prisma.siteDailyReport.update({
    where: { id: params.id },
    data: {
      weatherNotes: body.weatherNotes ?? undefined,
      generalNotes: body.generalNotes ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_DAILY_REPORT_UPDATED",
    entityType: "SiteDailyReport",
    entityId: report.id,
    before,
    after: report,
  });

  return NextResponse.json(report);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.siteDailyReport.findUnique({
    where: { id: params.id },
    include: { materialLogs: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    const stockMovementIds = before.materialLogs.map((m) => m.stockMovementId).filter(Boolean) as string[];
    if (stockMovementIds.length > 0) {
      await tx.stockMovement.deleteMany({ where: { id: { in: stockMovementIds } } });
    }
    await tx.siteWorkerAttendance.deleteMany({ where: { reportId: params.id } });
    await tx.siteEquipmentLog.deleteMany({ where: { reportId: params.id } });
    await tx.siteMaterialLog.deleteMany({ where: { reportId: params.id } });
    await tx.sitePhoto.deleteMany({ where: { reportId: params.id } });
    await tx.siteDailyReport.delete({ where: { id: params.id } });
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_DAILY_REPORT_DELETED",
    entityType: "SiteDailyReport",
    entityId: params.id,
    before,
  });

  return NextResponse.json({ ok: true });
}
