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
  const status = body.status as string;
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "حالة غير معروفة" }, { status: 400 });
  }

  const before = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leave = await prisma.leaveRequest.update({
    where: { id: params.id },
    data: { status: status as any },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "LEAVE_REQUEST_UPDATED",
    entityType: "LeaveRequest",
    entityId: leave.id,
    before,
    after: leave,
  });

  return NextResponse.json(leave);
}
