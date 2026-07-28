import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { syncProjectValueFromBoq } from "@/lib/boq-sync";

const editSchema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.boqItem.findUnique({ where: { id: params.id }, include: { contract: { include: { project: true } } } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (before.contract.project.status === "CLOSED") {
    return NextResponse.json({ error: "لا يمكن تعديل بنود عقد مشروع مغلق" }, { status: 400 });
  }

  const item = await prisma.boqItem.update({
    where: { id: params.id },
    data: {
      code: parsed.data.code ?? undefined,
      description: parsed.data.description ?? undefined,
      unit: parsed.data.unit ?? undefined,
      quantity: parsed.data.quantity ?? undefined,
      unitPrice: parsed.data.unitPrice ?? undefined,
    },
  });
  const newProjectValue = await syncProjectValueFromBoq(prisma, before.contractId);

  await logAudit({
    userId: (session.user as any).id,
    action: "BOQ_ITEM_UPDATED",
    entityType: "BoqItem",
    entityId: item.id,
    before,
    after: item,
  });

  return NextResponse.json({ ...item, newProjectValue });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const item = await prisma.boqItem.findUnique({ where: { id: params.id }, include: { contract: { include: { project: true } } } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.contract.project.status === "CLOSED") {
    return NextResponse.json({ error: "لا يمكن تعديل بنود عقد مشروع مغلق" }, { status: 400 });
  }

  await prisma.boqItem.delete({ where: { id: params.id } });
  const newProjectValue = await syncProjectValueFromBoq(prisma, item.contractId);

  await logAudit({
    userId: (session.user as any).id,
    action: "BOQ_ITEM_DELETED",
    entityType: "BoqItem",
    entityId: params.id,
    before: item,
  });
  return NextResponse.json({ ok: true, newProjectValue });
}
