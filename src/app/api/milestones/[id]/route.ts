import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.milestone.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const completed = !!body.completed;
  const milestone = await prisma.milestone.update({
    where: { id: params.id },
    data: { completed, completedAt: completed ? new Date() : null },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "MILESTONE_UPDATED",
    entityType: "Milestone",
    entityId: milestone.id,
    before,
    after: milestone,
  });
  if (completed) {
    await notifyAdmins("MILESTONE_COMPLETED", `تم إنجاز مرحلة "${before.name}" في مشروع ${before.project.name}`);
  }

  return NextResponse.json(milestone);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const milestone = await prisma.milestone.findUnique({ where: { id: params.id } });
  if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.milestone.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "MILESTONE_DELETED",
    entityType: "Milestone",
    entityId: params.id,
    before: milestone,
  });
  return NextResponse.json({ ok: true });
}
