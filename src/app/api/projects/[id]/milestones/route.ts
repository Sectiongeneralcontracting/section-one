import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const milestoneSchema = z.object({
  name: z.string().min(1),
  dueDate: z.string(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const milestones = await prisma.milestone.findMany({
    where: { projectId: params.id },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(milestones);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = milestoneSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const milestone = await prisma.milestone.create({
    data: { projectId: params.id, name: parsed.data.name, dueDate: new Date(parsed.data.dueDate) },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "MILESTONE_CREATED",
    entityType: "Milestone",
    entityId: milestone.id,
    after: milestone,
  });

  return NextResponse.json(milestone, { status: 201 });
}
