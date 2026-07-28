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
  const before = await prisma.quotationItem.findUnique({ where: { id: params.id }, include: { quotation: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.quotationItem.update({
    where: { id: params.id },
    data: {
      code: body.code ?? undefined,
      description: body.description ?? undefined,
      unit: body.unit ?? undefined,
      quantity: body.quantity ?? undefined,
      unitPrice: body.unitPrice ?? undefined,
    },
  });

  await logAudit({ userId: (session.user as any).id, action: "QUOTATION_ITEM_UPDATED", entityType: "QuotationItem", entityId: item.id, before, after: item });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const before = await prisma.quotationItem.findUnique({ where: { id: params.id }, include: { quotation: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.quotationItem.delete({ where: { id: params.id } });
  await logAudit({ userId: (session.user as any).id, action: "QUOTATION_ITEM_DELETED", entityType: "QuotationItem", entityId: params.id, before });
  return NextResponse.json({ ok: true });
}
