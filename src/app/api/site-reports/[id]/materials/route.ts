import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { computeStockBalance, canWithdraw } from "@/lib/inventory";
import { canEditSiteReport } from "@/lib/site-report-access";

const schema = z.object({
  itemId: z.string().optional(),
  warehouseId: z.string().optional(), // مطلوب لو itemId موجود عشان نعرف نخصم من مخزن إيه
  customName: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!parsed.data.itemId && !parsed.data.customName) {
    return NextResponse.json({ error: "لازم تختار صنف من المخزون أو تكتب اسم المادة" }, { status: 400 });
  }
  if (parsed.data.itemId && !parsed.data.warehouseId) {
    return NextResponse.json({ error: "لازم تحدد المخزن اللي هيتخصم منه الصنف" }, { status: 400 });
  }

  const report = await prisma.siteDailyReport.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!report) return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });

  const access = canEditSiteReport(report.createdAt, (session.user as any).role);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });

  let stockMovementId: string | undefined;

  let row;
  try {
    row = await prisma.$transaction(async (tx) => {
      if (parsed.data.itemId && parsed.data.warehouseId) {
        const existingMovements = await tx.stockMovement.findMany({
          where: { itemId: parsed.data.itemId, warehouseId: parsed.data.warehouseId },
          select: { type: true, quantity: true },
        });
        const balance = computeStockBalance(existingMovements.map((m) => ({ type: m.type as "IN" | "OUT", quantity: Number(m.quantity) })));
        if (!canWithdraw(balance, parsed.data.quantity)) {
          throw new Error(`الكمية المتاحة في المخزن المختار (${balance}) أقل من الكمية المطلوبة`);
        }
        const movement = await tx.stockMovement.create({
          data: {
            warehouseId: parsed.data.warehouseId,
            itemId: parsed.data.itemId,
            type: "OUT",
            quantity: parsed.data.quantity,
            projectId: report.projectId,
            date: report.date,
            notes: `استهلاك موقع — تقرير يومي ${report.date.toISOString().slice(0, 10)}`,
            createdById: (session.user as any).id,
          },
        });
        stockMovementId = movement.id;
      }

      return tx.siteMaterialLog.create({
        data: {
          reportId: params.id,
          itemId: parsed.data.itemId,
          customName: parsed.data.customName,
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
          stockMovementId,
          notes: parsed.data.notes,
        },
        include: { item: { select: { id: true, name: true, unit: true } } },
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "تعذر تسجيل استهلاك المادة" }, { status: 400 });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_MATERIAL_LOG_ADDED",
    entityType: "SiteMaterialLog",
    entityId: row.id,
    after: row,
  });

  return NextResponse.json(row, { status: 201 });
}
