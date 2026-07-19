import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const contractSchema = z.object({
  projectId: z.string(),
  contractNumber: z.string().min(1),
  signedDate: z.string(),
  durationDays: z.number().int().positive().optional(),
  retentionPct: z.number().min(0).max(100).default(5),
  advancePaymentPct: z.number().min(0).max(100).default(0),
  advancePaymentAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contracts = await prisma.contract.findMany({
    include: { project: { include: { client: true } }, certificates: true, boqItems: true },
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
  const parsed = contractSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.contract.findUnique({ where: { projectId: parsed.data.projectId } });
  if (existing) return NextResponse.json({ error: "يوجد عقد بالفعل لهذا المشروع" }, { status: 400 });

  const contract = await prisma.contract.create({
    data: { ...parsed.data, signedDate: new Date(parsed.data.signedDate) },
    include: { project: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "CONTRACT_CREATED",
    entityType: "Contract",
    entityId: contract.id,
    after: contract,
  });
  await notifyAdmins("CONTRACT_CREATED", `تم إنشاء عقد جديد: ${contract.contractNumber} لمشروع ${contract.project.name}`);

  return NextResponse.json(contract, { status: 201 });
}
