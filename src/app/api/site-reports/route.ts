import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  projectId: z.string(),
  date: z.string().optional(),
  weatherNotes: z.string().optional(),
  generalNotes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  const reports = await prisma.siteDailyReport.findMany({
    where: { projectId },
    include: {
      project: { select: { id: true, name: true, code: true } },
      workerAttendance: true,
      equipmentLogs: true,
      materialLogs: true,
      photos: true,
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(reports);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();
  // نطبّع التاريخ لبداية اليوم عشان يوم واحد = تقرير واحد بس لكل مشروع
  date.setHours(0, 0, 0, 0);

  const existing = await prisma.siteDailyReport.findUnique({
    where: { projectId_date: { projectId: parsed.data.projectId, date } },
  });
  if (existing) {
    return NextResponse.json({ error: "يوجد تقرير مسجل بالفعل لهذا المشروع في هذا التاريخ", existingId: existing.id }, { status: 400 });
  }

  const report = await prisma.siteDailyReport.create({
    data: {
      projectId: parsed.data.projectId,
      date,
      weatherNotes: parsed.data.weatherNotes,
      generalNotes: parsed.data.generalNotes,
      createdById: (session.user as any).id,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_DAILY_REPORT_CREATED",
    entityType: "SiteDailyReport",
    entityId: report.id,
    after: report,
  });

  return NextResponse.json(report, { status: 201 });
}
