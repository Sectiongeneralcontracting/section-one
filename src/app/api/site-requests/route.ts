import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyRoles } from "@/lib/audit";

const schema = z.object({
  projectId: z.string(),
  type: z.enum(["PURCHASE", "LABOR"]),
  // شراء
  supplierId: z.string().optional(),
  itemDescription: z.string().optional(),
  estimatedAmount: z.number().optional(),
  // عمالة
  trade: z.string().optional(),
  workersCount: z.number().int().positive().optional(),
  neededDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const requests = await prisma.siteRequest.findMany({
    where: { projectId, status: status as any },
    include: { project: { select: { id: true, name: true, code: true } }, supplier: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.type === "PURCHASE" && !parsed.data.itemDescription) {
    return NextResponse.json({ error: "وصف المطلوب شراؤه إجباري لطلب الشراء" }, { status: 400 });
  }
  if (parsed.data.type === "LABOR" && (!parsed.data.trade || !parsed.data.workersCount)) {
    return NextResponse.json({ error: "الحرفة وعدد العمالة إجباريين لطلب العمالة" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const request_ = await prisma.siteRequest.create({
    data: {
      projectId: parsed.data.projectId,
      type: parsed.data.type,
      supplierId: parsed.data.supplierId,
      itemDescription: parsed.data.itemDescription,
      estimatedAmount: parsed.data.estimatedAmount,
      trade: parsed.data.trade,
      workersCount: parsed.data.workersCount,
      neededDate: parsed.data.neededDate ? new Date(parsed.data.neededDate) : undefined,
      notes: parsed.data.notes,
      requestedById: (session.user as any).id,
    },
    include: { project: true, supplier: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SITE_REQUEST_CREATED",
    entityType: "SiteRequest",
    entityId: request_.id,
    after: request_,
  });
  await notifyRoles(
    ["FINANCE_MANAGER", "ADMIN"],
    "SITE_REQUEST_SUBMITTED",
    `طلب ${parsed.data.type === "PURCHASE" ? "شراء" : "عمالة"} جديد من مشروع ${project.name} — محتاج اعتماد المدير المالي`
  );

  return NextResponse.json(request_, { status: 201 });
}
