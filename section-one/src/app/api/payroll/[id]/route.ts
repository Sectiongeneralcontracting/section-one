import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";

const order = ["DRAFT", "APPROVED", "PAID"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;

  const body = await req.json();
  const nextStatus = body.status as string;

  const before = await prisma.payrollRecord.findUnique({
    where: { id: params.id },
    include: { employee: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (order.indexOf(nextStatus) !== order.indexOf(before.status) + 1) {
    return NextResponse.json({ error: `لا يمكن الانتقال من ${before.status} إلى ${nextStatus}` }, { status: 400 });
  }
  // صرف الراتب يتطلب صلاحية Admin
  if (nextStatus === "PAID" && role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const record = await prisma.payrollRecord.update({
    where: { id: params.id },
    data: { status: nextStatus as any, paidDate: nextStatus === "PAID" ? new Date() : undefined },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: `PAYROLL_${nextStatus}`,
    entityType: "PayrollRecord",
    entityId: record.id,
    before,
    after: record,
  });
  if (nextStatus === "PAID") {
    await notifyAdmins("PAYROLL_PAID", `تم صرف راتب ${before.employee.name} لشهر ${before.month}`);
  }

  return NextResponse.json(record);
}
