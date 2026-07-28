import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  clientId: z.string(),
  projectName: z.string().min(1),
  date: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const quotations = await prisma.quotation.findMany({
    where: { clientId, status: status as any },
    include: { client: { select: { id: true, name: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(quotations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
  if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });

  // توليد رقم عرض السعر تلقائيًا
  const last = await prisma.quotation.findFirst({ orderBy: { createdAt: "desc" }, select: { quotationNumber: true } });
  const lastNum = last ? parseInt(last.quotationNumber.replace(/\D/g, ""), 10) || 0 : 0;
  const quotationNumber = `QT-${String(lastNum + 1).padStart(5, "0")}`;

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      clientId: parsed.data.clientId,
      projectName: parsed.data.projectName,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
      notes: parsed.data.notes,
      createdById: (session.user as any).id,
    },
    include: { client: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "QUOTATION_CREATED",
    entityType: "Quotation",
    entityId: quotation.id,
    after: quotation,
  });

  return NextResponse.json(quotation, { status: 201 });
}
