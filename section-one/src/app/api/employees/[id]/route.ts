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

  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      jobTitle: body.jobTitle ?? undefined,
      department: body.department ?? undefined,
      phone: body.phone ?? undefined,
      baseSalary: body.baseSalary ?? undefined,
      isActive: body.isActive ?? undefined,
    },
  });

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
