import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contract = await prisma.subcontractorContract.findUnique({
    where: { id: params.id },
    include: {
      subcontractor: true,
      project: { select: { id: true, name: true, code: true } },
      certificates: { orderBy: { number: "asc" } },
      payments: { orderBy: { date: "desc" } },
    },
  });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "التعديل يتطلب صلاحية Admin" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.subcontractorContract.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contract = await prisma.subcontractorContract.update({
    where: { id: params.id },
    data: {
      contractNumber: body.contractNumber ?? undefined,
      scopeOfWork: body.scopeOfWork ?? undefined,
      contractValue: body.contractValue ?? undefined,
      signedDate: body.signedDate ? new Date(body.signedDate) : undefined,
    },
    include: { subcontractor: true, project: { select: { id: true, name: true, code: true } } },
  });

  await logAudit({ userId: (session.user as any).id, action: "SUBCONTRACTOR_CONTRACT_UPDATED", entityType: "SubcontractorContract", entityId: contract.id, before, after: contract });
  return NextResponse.json(contract);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.subcontractorContract.findUnique({ where: { id: params.id }, include: { certificates: true, payments: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.certificates.length > 0 || before.payments.length > 0)
    return NextResponse.json({ error: "لا يمكن حذف عقد له مستخلصات أو دفعات مسجلة" }, { status: 400 });

  await prisma.subcontractorContract.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "SUBCONTRACTOR_CONTRACT_DELETED", entityType: "SubcontractorContract", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
