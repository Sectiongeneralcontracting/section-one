import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const schema = z.object({
  employeeId: z.string(),
  type: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"]).default("ANNUAL"),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leaves = await prisma.leaveRequest.findMany({
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(leaves);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (new Date(parsed.data.endDate) < new Date(parsed.data.startDate)) {
    return NextResponse.json({ error: "تاريخ النهاية لازم يكون بعد تاريخ البداية" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: parsed.data.employeeId } });
  if (!employee) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });

  const leave = await prisma.leaveRequest.create({
    data: {
      employeeId: parsed.data.employeeId,
      type: parsed.data.type,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      notes: parsed.data.notes,
    },
    include: { employee: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "LEAVE_REQUEST_CREATED",
    entityType: "LeaveRequest",
    entityId: leave.id,
    after: leave,
  });
  await notifyAdmins("LEAVE_REQUEST_SUBMITTED", `طلب إجازة جديد من ${employee.name}`);

  return NextResponse.json(leave, { status: 201 });
}
