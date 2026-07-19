import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "SICK"]).default("PRESENT"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const date = searchParams.get("date") ?? undefined;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: date ? new Date(date) : undefined,
    },
    include: { employee: true },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json(records);
}

// تسجيل أو تحديث حضور موظف في يوم معين (upsert)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const dateOnly = new Date(parsed.data.date);
  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: parsed.data.employeeId, date: dateOnly } },
    update: {
      status: parsed.data.status,
      checkIn: parsed.data.checkIn ? new Date(parsed.data.checkIn) : undefined,
      checkOut: parsed.data.checkOut ? new Date(parsed.data.checkOut) : undefined,
      notes: parsed.data.notes,
    },
    create: {
      employeeId: parsed.data.employeeId,
      date: dateOnly,
      status: parsed.data.status,
      checkIn: parsed.data.checkIn ? new Date(parsed.data.checkIn) : undefined,
      checkOut: parsed.data.checkOut ? new Date(parsed.data.checkOut) : undefined,
      notes: parsed.data.notes,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "ATTENDANCE_RECORDED",
    entityType: "AttendanceRecord",
    entityId: record.id,
    after: record,
  });

  return NextResponse.json(record, { status: 201 });
}
