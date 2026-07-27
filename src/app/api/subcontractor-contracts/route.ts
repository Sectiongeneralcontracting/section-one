import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  subcontractorId: z.string(),
  projectId: z.string(),
  contractNumber: z.string().min(1),
  scopeOfWork: z.string().optional(),
  contractValue: z.number().positive(),
  signedDate: z.string(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  const contracts = await prisma.subcontractorContract.findMany({
    where: { projectId },
    include: {
      subcontractor: true,
      project: { select: { id: true, name: true, code: true } },
      certificates: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contracts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const contract = await prisma.subcontractorContract.create({
    data: {
      subcontractorId: parsed.data.subcontractorId,
      projectId: parsed.data.projectId,
      contractNumber: parsed.data.contractNumber,
      scopeOfWork: parsed.data.scopeOfWork,
      contractValue: parsed.data.contractValue,
      signedDate: new Date(parsed.data.signedDate),
    },
    include: { subcontractor: true, project: { select: { id: true, name: true, code: true } } },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUBCONTRACTOR_CONTRACT_CREATED",
    entityType: "SubcontractorContract",
    entityId: contract.id,
    after: contract,
  });

  return NextResponse.json(contract, { status: 201 });
}
