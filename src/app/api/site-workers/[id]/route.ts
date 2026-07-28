import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canEditSiteReport } from "@/lib/site-report-access";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const before = await prisma.siteWorkerAttendance.findUnique({ where: { id: params.id }, include: { report: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = canEditSiteReport(before.report.createdAt, (session.user as any).role);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });

  const row = await prisma.siteWorkerAttendance.update({
    where: { id: params.id },
    data: { trade: body.trade ?? undefined, count: body.count ?? undefined, notes: body.notes ?? undefined },
  });

  await logAudit({ userId: (session.user as any).id, action: "SITE_WORKER_ATTENDANCE_UPDATED", entityType: "SiteWorkerAttendance", entityId: row.id, before, after: row });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const before = await prisma.siteWorkerAttendance.findUnique({ where: { id: params.id }, include: { report: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = canEditSiteReport(before.report.createdAt, (session.user as any).role);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });

  await prisma.siteWorkerAttendance.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "SITE_WORKER_ATTENDANCE_DELETED", entityType: "SiteWorkerAttendance", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
