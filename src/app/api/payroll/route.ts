import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { computeNetSalary, computeAbsenceDeduction } from "@/lib/payroll";

const genSchema = z.object({
  employeeId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // "YYYY-MM"
  allowances: z.number().min(0).default(0),
  extraDeductions: z.number().min(0).default(0), // تأمينات/ضريبة إضافية غير الغياب
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? undefined;

  const records = await prisma.payrollRecord.findMany({
    where: { month },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = genSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.payrollRecord.findUnique({
    where: { employeeId_month: { employeeId: parsed.data.employeeId, month: parsed.data.month } },
  });
  if (existing) return NextResponse.json({ error: "يوجد راتب مسجل بالفعل لهذا الموظف في هذا الشهر" }, { status: 400 });

  const employee = await prisma.employee.findUnique({ where: { id: parsed.data.employeeId } });
  if (!employee) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });

  // حساب أيام الغياب في الشهر المحدد من سجلات الحضور
  const [year, monthNum] = parsed.data.month.split("-").map(Number);
  const from = new Date(year, monthNum - 1, 1);
  const to = new Date(year, monthNum, 0, 23, 59, 59);
  const attendance = await prisma.attendanceRecord.findMany({
    where: { employeeId: parsed.data.employeeId, date: { gte: from, lte: to } },
  });
  const absentDays = attendance.filter((a) => a.status === "ABSENT").length;
  const absenceDeduction = computeAbsenceDeduction(Number(employee.baseSalary), absentDays);

  const totalDeductions = parsed.data.extraDeductions + absenceDeduction;
  const netSalary = computeNetSalary(Number(employee.baseSalary), parsed.data.allowances, totalDeductions);

  const record = await prisma.payrollRecord.create({
    data: {
      employeeId: parsed.data.employeeId,
      month: parsed.data.month,
      baseSalary: employee.baseSalary,
      allowances: parsed.data.allowances,
      deductions: totalDeductions,
      netSalary,
    },
    include: { employee: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PAYROLL_GENERATED",
    entityType: "PayrollRecord",
    entityId: record.id,
    after: record,
  });
  await notifyAdmins("PAYROLL_GENERATED", `تم توليد راتب ${employee.name} لشهر ${parsed.data.month}`);

  return NextResponse.json(record, { status: 201 });
}
