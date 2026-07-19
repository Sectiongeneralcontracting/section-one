import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      project: { include: { client: true } },
      boqItems: { orderBy: { createdAt: "asc" } },
      certificates: { orderBy: { number: "asc" } },
    },
  });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: {
      contractNumber: body.contractNumber ?? undefined,
      durationDays: body.durationDays ?? undefined,
      retentionPct: body.retentionPct ?? undefined,
      advancePaymentPct: body.advancePaymentPct ?? undefined,
      advancePaymentAmount: body.advancePaymentAmount ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "CONTRACT_UPDATED",
    entityType: "Contract",
    entityId: contract.id,
    before,
    after: contract,
  });

  return NextResponse.json(contract);
}
