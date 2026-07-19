import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";

const itemSchema = z.object({
  description: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

const poSchema = z.object({
  poNumber: z.string().min(1),
  supplierId: z.string(),
  projectId: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.purchaseOrder.findMany({
    include: { supplier: true, project: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = poSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { items, ...poData } = parsed.data;

  const order = await prisma.purchaseOrder.create({
    data: {
      ...poData,
      expectedDate: poData.expectedDate ? new Date(poData.expectedDate) : undefined,
      items: { create: items },
    },
    include: { items: true, supplier: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PURCHASE_ORDER_CREATED",
    entityType: "PurchaseOrder",
    entityId: order.id,
    after: order,
  });
  await notifyAdmins("PURCHASE_ORDER_CREATED", `تم إنشاء أمر شراء جديد: ${order.poNumber} من ${order.supplier.name}`);

  return NextResponse.json(order, { status: 201 });
}
