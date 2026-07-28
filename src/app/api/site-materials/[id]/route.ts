import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canEditSiteReport } from "@/lib/site-report-access";
import { computeStockBalance, canWithdraw } from "@/lib/inventory";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const before = await prisma.siteMaterialLog.findUnique({ where: { id: params.id }, include: { report: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = canEditSiteReport(before.report.createdAt, (session.user as any).role);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });

  let row;
  try {
    row = await prisma.$transaction(async (tx) => {
      // لو مربوط بحركة مخزون فعلية وطلب تغيير الكمية، نتحقق من الرصيد ونحدّث حركة المخزون كمان
      if (before.stockMovementId && body.quantity !== undefined && Number(body.quantity) !== Number(before.quantity)) {
        const movement = await tx.stockMovement.findUnique({ where: { id: before.stockMovementId } });
        if (movement) {
          const otherMovements = await tx.stockMovement.findMany({
            where: { itemId: movement.itemId, warehouseId: movement.warehouseId, id: { not: movement.id } },
          });
          const balanceWithoutThis = computeStockBalance(
            otherMovements.map((m) => ({ type: m.type as "IN" | "OUT", quantity: Number(m.quantity) }))
          );
          if (!canWithdraw(balanceWithoutThis, Number(body.quantity))) {
            throw new Error(`الكمية المتاحة في المخزن (${balanceWithoutThis}) أقل من الكمية الجديدة المطلوبة`);
          }
          await tx.stockMovement.update({ where: { id: movement.id }, data: { quantity: body.quantity } });
        }
      }

      return tx.siteMaterialLog.update({
        where: { id: params.id },
        data: {
          customName: body.customName ?? undefined,
          quantity: body.quantity ?? undefined,
          unit: body.unit ?? undefined,
          notes: body.notes ?? undefined,
        },
        include: { item: { select: { id: true, name: true, unit: true } } },
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "تعذر الحفظ" }, { status: 400 });
  }

  await logAudit({ userId: (session.user as any).id, action: "SITE_MATERIAL_LOG_UPDATED", entityType: "SiteMaterialLog", entityId: row.id, before, after: row });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const before = await prisma.siteMaterialLog.findUnique({ where: { id: params.id }, include: { report: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = canEditSiteReport(before.report.createdAt, (session.user as any).role);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    // نلغي حركة المخزون المرتبطة (لو موجودة) عشان الرصيد يرجع صح بعد حذف الاستهلاك
    if (before.stockMovementId) {
      await tx.stockMovement.delete({ where: { id: before.stockMovementId } });
    }
    await tx.siteMaterialLog.delete({ where: { id: params.id } });
  });

  await logAudit({ userId: (session.user as any).id, action: "SITE_MATERIAL_LOG_DELETED", entityType: "SiteMaterialLog", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
