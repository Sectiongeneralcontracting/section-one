import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const employeeSchema = z.object({
  name: z.string().min(2),
  jobTitle: z.string().min(1),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  nationalId: z.string().optional(),
  hireDate: z.string(),
  baseSalary: z.number().positive(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const employee = await prisma.employee.create({
    data: { ...parsed.data, hireDate: new Date(parsed.data.hireDate) },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "EMPLOYEE_CREATED",
    entityType: "Employee",
    entityId: employee.id,
    after: employee,
  });

  return NextResponse.json(employee, { status: 201 });
}
