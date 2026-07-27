import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  subcontractorId: z.string(),
  projectId: z.string().optional(),
  qualityScore: z.number().int().min(1).max(5),
  timelinessScore: z.number().int().min(1).max(5),
  safetyScore: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const evaluation = await prisma.subcontractorEvaluation.create({
    data: { ...parsed.data, createdById: (session.user as any).id },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUBCONTRACTOR_EVALUATION_CREATED",
    entityType: "SubcontractorEvaluation",
    entityId: evaluation.id,
    after: evaluation,
  });

  return NextResponse.json(evaluation, { status: 201 });
}
