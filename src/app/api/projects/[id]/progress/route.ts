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
  const pct = Number(body.completionPct);
  if (isNaN(pct) || pct < 0 || pct > 100)
    return NextResponse.json({ error: "النسبة لازم تكون بين 0 و 100" }, { status: 400 });

  const before = await prisma.project.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await prisma.project.update({
    where: { id: params.id },
    data: { completionPct: pct },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PROJECT_PROGRESS_UPDATED",
    entityType: "Project",
    entityId: params.id,
    before,
    after: project,
  });

  return NextResponse.json(project);
}
