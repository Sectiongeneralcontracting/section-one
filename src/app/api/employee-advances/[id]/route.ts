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
  const before = await prisma.employeeAdvance.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.deducted)
    return NextResponse.json({ error: "السلفة دي اتخصمت بالفعل من راتب — مينفعش تتعدّل" }, { status: 400 });

  const advance = await prisma.employeeAdvance.update({
    where: { id: params.id },
    data: {
      amount: body.amount ?? undefined,
      date: body.date ? new Date(body.date) : undefined,
      reason: body.reason ?? undefined,
    },
  });

  await logAudit({ userId: (session.user as any).id, action: "EMPLOYEE_ADVANCE_UPDATED", entityType: "EmployeeAdvance", entityId: advance.id, before, after: advance });
  return NextResponse.json(advance);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.employeeAdvance.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.deducted)
    return NextResponse.json({ error: "السلفة دي اتخصمت بالفعل من راتب — مينفعش تتحذف" }, { status: 400 });

  await prisma.employeeAdvance.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "EMPLOYEE_ADVANCE_DELETED", entityType: "EmployeeAdvance", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
