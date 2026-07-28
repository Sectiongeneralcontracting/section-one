import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  code: z.string().optional(),
  description: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const quotation = await prisma.quotation.findUnique({ where: { id: params.id } });
  if (!quotation) return NextResponse.json({ error: "عرض السعر غير موجود" }, { status: 404 });

  const item = await prisma.quotationItem.create({ data: { ...parsed.data, quotationId: params.id } });

  await logAudit({ userId: (session.user as any).id, action: "QUOTATION_ITEM_CREATED", entityType: "QuotationItem", entityId: item.id, after: item });
  return NextResponse.json(item, { status: 201 });
}
