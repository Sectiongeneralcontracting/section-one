import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "التعديل يتطلب صلاحية Admin" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.employeeContract.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contract = await prisma.employeeContract.update({
    where: { id: params.id },
    data: {
      contractType: body.contractType ?? undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
      salary: body.salary ?? undefined,
      notes: body.notes ?? undefined,
    },
    include: { employee: true },
  });

  await logAudit({ userId: (session.user as any).id, action: "EMPLOYEE_CONTRACT_UPDATED", entityType: "EmployeeContract", entityId: contract.id, before, after: contract });
  return NextResponse.json(contract);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.employeeContract.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.employeeContract.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "EMPLOYEE_CONTRACT_DELETED", entityType: "EmployeeContract", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
