import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canEditSiteReport } from "@/lib/site-report-access";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photo = await prisma.sitePhoto.findUnique({ where: { id: params.id }, include: { report: true } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = canEditSiteReport(photo.report.createdAt, (session.user as any).role);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });

  await prisma.sitePhoto.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_PHOTO_DELETED",
    entityType: "SitePhoto",
    entityId: params.id,
  });

  return NextResponse.json({ ok: true });
}
