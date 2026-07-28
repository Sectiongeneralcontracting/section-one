import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role as string;
  if (role !== "FINANCE_MANAGER" && role !== "ADMIN") {
    return NextResponse.json({ error: "اعتماد الحضور يتطلب صلاحية المدير المالي أو Admin" }, { status: 403 });
  }

  const body = await req.json();
  const approvalStatus = body.approvalStatus as "APPROVED" | "REJECTED";
  if (!["APPROVED", "REJECTED"].includes(approvalStatus)) {
    return NextResponse.json({ error: "حالة غير معروفة" }, { status: 400 });
  }

  const before = await prisma.attendanceRecord.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const record = await prisma.attendanceRecord.update({
    where: { id: params.id },
    data: { approvalStatus, approvedById: (session.user as any).id, approvedAt: new Date() },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "ATTENDANCE_APPROVAL_UPDATED",
    entityType: "AttendanceRecord",
    entityId: record.id,
    before,
    after: record,
  });

  return NextResponse.json(record);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "الحذف يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.attendanceRecord.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.attendanceRecord.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "ATTENDANCE_DELETED", entityType: "AttendanceRecord", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
