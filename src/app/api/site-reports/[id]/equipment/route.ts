import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  equipmentId: z.string().optional(),
  customName: z.string().optional(),
  hoursUsed: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!parsed.data.equipmentId && !parsed.data.customName) {
    return NextResponse.json({ error: "لازم تختار معدة مسجلة أو تكتب اسمها" }, { status: 400 });
  }

  const report = await prisma.siteDailyReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });

  const row = await prisma.siteEquipmentLog.create({
    data: {
      reportId: params.id,
      equipmentId: parsed.data.equipmentId,
      customName: parsed.data.customName,
      hoursUsed: parsed.data.hoursUsed,
      notes: parsed.data.notes,
    },
    include: { equipment: { select: { id: true, name: true } } },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_EQUIPMENT_LOG_ADDED",
    entityType: "SiteEquipmentLog",
    entityId: row.id,
    after: row,
  });

  return NextResponse.json(row, { status: 201 });
}
