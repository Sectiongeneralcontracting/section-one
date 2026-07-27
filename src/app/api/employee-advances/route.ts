import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const schema = z.object({
  employeeId: z.string(),
  amount: z.number().positive(),
  date: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const advances = await prisma.employeeAdvance.findMany({
    include: { employee: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(advances);
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

  const employee = await prisma.employee.findUnique({ where: { id: parsed.data.employeeId } });
  if (!employee) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });

  const advance = await prisma.employeeAdvance.create({
    data: {
      employeeId: parsed.data.employeeId,
      amount: parsed.data.amount,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      reason: parsed.data.reason,
    },
    include: { employee: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "EMPLOYEE_ADVANCE_CREATED",
    entityType: "EmployeeAdvance",
    entityId: advance.id,
    after: advance,
  });
  await notifyAdmins("EMPLOYEE_ADVANCE_RECORDED", `سلفة جديدة بقيمة ${advance.amount} للموظف ${employee.name} — هتتخصم تلقائيًا من أول راتب`);

  return NextResponse.json(advance, { status: 201 });
}
