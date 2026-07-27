import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  trade: z.string().min(1),
  count: z.number().int().positive(),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const report = await prisma.siteDailyReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });

  const row = await prisma.siteWorkerAttendance.create({
    data: { reportId: params.id, trade: parsed.data.trade, count: parsed.data.count, notes: parsed.data.notes },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_WORKER_ATTENDANCE_ADDED",
    entityType: "SiteWorkerAttendance",
    entityId: row.id,
    after: row,
  });

  return NextResponse.json(row, { status: 201 });
}
