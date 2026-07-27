import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.siteDailyReport.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true, code: true } },
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
