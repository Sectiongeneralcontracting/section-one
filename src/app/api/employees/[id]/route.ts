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
  const before = await prisma.employee.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.userId) {
    const conflict = await prisma.employee.findUnique({ where: { userId: body.userId } });
    if (conflict && conflict.id !== params.id) {
      return NextResponse.json({ error: "الحساب ده مربوط بموظف تاني بالفعل" }, { status: 400 });
    }
  }

  let employee;
  try {
    employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: body.name ?? undefined,
        jobTitle: body.jobTitle ?? undefined,
        department: body.department ?? undefined,
        phone: body.phone ?? undefined,
        baseSalary: body.baseSalary ?? undefined,
        isActive: body.isActive ?? undefined,
        bankName: body.bankName ?? undefined,
        bankAccountNumber: body.bankAccountNumber ?? undefined,
        projectId: body.projectId !== undefined ? (body.projectId || null) : undefined,
        userId: body.userId !== undefined ? (body.userId || null) : undefined,
      },
      include: { project: { select: { id: true, name: true, code: true } }, user: { select: { id: true, name: true, email: true } } },
    });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ التعديلات" }, { status: 400 });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: "EMPLOYEE_UPDATED",
    entityType: "Employee",
    entityId: employee.id,
    before,
    after: employee,
  });

  return NextResponse.json(employee);
}
