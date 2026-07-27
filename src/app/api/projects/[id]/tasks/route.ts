import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const taskSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  progress: z.number().min(0).max(100).default(0),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.projectTask.findMany({
    where: { projectId: params.id },
    orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (new Date(parsed.data.endDate) < new Date(parsed.data.startDate)) {
    return NextResponse.json({ error: "تاريخ النهاية لازم يكون بعد تاريخ البداية" }, { status: 400 });
  }

  const count = await prisma.projectTask.count({ where: { projectId: params.id } });

  const task = await prisma.projectTask.create({
    data: {
      projectId: params.id,
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      progress: parsed.data.progress,
      sortOrder: count,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PROJECT_TASK_CREATED",
    entityType: "ProjectTask",
    entityId: task.id,
    after: task,
  });

  return NextResponse.json(task, { status: 201 });
}
