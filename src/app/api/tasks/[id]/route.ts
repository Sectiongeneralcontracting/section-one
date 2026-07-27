import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const task = await prisma.projectTask.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      progress: body.progress ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PROJECT_TASK_UPDATED",
    entityType: "ProjectTask",
    entityId: task.id,
    after: task,
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const task = await prisma.projectTask.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.projectTask.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "PROJECT_TASK_DELETED",
    entityType: "ProjectTask",
    entityId: params.id,
    before: task,
  });
  return NextResponse.json({ ok: true });
}
