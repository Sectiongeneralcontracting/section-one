import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subcontractor = await prisma.subcontractor.findUnique({
    where: { id: params.id },
    include: {
      contracts: {
        include: {
          project: { select: { id: true, name: true, code: true, status: true } },
          certificates: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      },
      evaluations: { orderBy: { evaluatedAt: "desc" } },
    },
  });
  if (!subcontractor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subcontractor);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.subcontractor.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subcontractor = await prisma.subcontractor.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      specialty: body.specialty ?? undefined,
      phone: body.phone ?? undefined,
      email: body.email ?? undefined,
      taxNumber: body.taxNumber ?? undefined,
      address: body.address ?? undefined,
      isActive: body.isActive ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUBCONTRACTOR_UPDATED",
    entityType: "Subcontractor",
    entityId: subcontractor.id,
    before,
    after: subcontractor,
  });

  return NextResponse.json(subcontractor);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.subcontractor.findUnique({ where: { id: params.id }, include: { contracts: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.contracts.length > 0)
    return NextResponse.json({ error: "لا يمكن حذف مقاول باطن له عقود مسجلة" }, { status: 400 });

  await prisma.subcontractor.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "SUBCONTRACTOR_DELETED", entityType: "Subcontractor", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
