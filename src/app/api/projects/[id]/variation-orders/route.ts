import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const voSchema = z.object({
  orderNumber: z.string().min(1),
  description: z.string().min(1),
  amount: z.number(), // ممكن تكون سالبة (تخفيض في قيمة العقد)
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.variationOrder.findMany({
    where: { projectId: params.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = voSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.status === "CLOSED")
    return NextResponse.json({ error: "لا يمكن إضافة أمر تغيير لمشروع مغلق" }, { status: 400 });

  const order = await prisma.variationOrder.create({
    data: {
      projectId: params.id,
      orderNumber: parsed.data.orderNumber,
      description: parsed.data.description,
      amount: parsed.data.amount,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      notes: parsed.data.notes,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "VARIATION_ORDER_CREATED",
    entityType: "VariationOrder",
    entityId: order.id,
    after: order,
  });

  return NextResponse.json(order, { status: 201 });
}
