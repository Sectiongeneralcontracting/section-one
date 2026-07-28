import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyRoles } from "@/lib/audit";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { userId: (session.user as any).id } });
  if (!employee) return NextResponse.json({ error: "حسابك مش مربوط بسجل موظف — كلّم الأدمن" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"
  let where: any = { employeeId: employee.id };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const records = await prisma.attendanceRecord.findMany({ where, orderBy: { date: "desc" } });
  const today = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: startOfDay(new Date()) } },
  });

  return NextResponse.json({ employee: { id: employee.id, name: employee.name }, records, today });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { userId: (session.user as any).id } });
  if (!employee) return NextResponse.json({ error: "حسابك مش مربوط بسجل موظف — كلّم الأدمن" }, { status: 404 });

  const body = await req.json();
  const action = body.action as "checkin" | "checkout";
  const today = startOfDay(new Date());

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (action === "checkin") {
    if (existing) return NextResponse.json({ error: "إنت مسجّل حضور بالفعل النهاردة" }, { status: 400 });
    const record = await prisma.attendanceRecord.create({
      data: { employeeId: employee.id, date: today, status: "PRESENT", checkIn: new Date(), approvalStatus: "PENDING" },
    });
    await logAudit({ userId: (session.user as any).id, action: "ATTENDANCE_CHECKIN", entityType: "AttendanceRecord", entityId: record.id, after: record });
    await notifyRoles(["FINANCE_MANAGER", "ADMIN"], "ATTENDANCE_PENDING_APPROVAL", `${employee.name} سجّل حضور النهاردة — محتاج اعتماد`);
    return NextResponse.json(record, { status: 201 });
  }

  if (action === "checkout") {
    if (!existing || !existing.checkIn) return NextResponse.json({ error: "لازم تسجّل حضور الأول" }, { status: 400 });
    if (existing.checkOut) return NextResponse.json({ error: "إنت مسجّل انصراف بالفعل النهاردة" }, { status: 400 });
    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: new Date(), approvalStatus: "PENDING" },
    });
    await logAudit({ userId: (session.user as any).id, action: "ATTENDANCE_CHECKOUT", entityType: "AttendanceRecord", entityId: record.id, after: record });
    return NextResponse.json(record);
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
