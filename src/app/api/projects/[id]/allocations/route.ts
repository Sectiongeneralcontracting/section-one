import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { computeSharesFromContributions } from "@/lib/allocations";

// body: { allocations: [{ partnerId, contributionAmount }] }
// النسبة % بتتحسب تلقائيًا من قيمة مساهمة كل شريك، مش بتتكتب يدوي
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const rawAllocations: { partnerId: string; contributionAmount: number }[] = body.allocations ?? [];

  if (rawAllocations.some((a) => Number(a.contributionAmount) < 0)) {
    return NextResponse.json({ error: "قيمة المساهمة لازم تكون رقم موجب" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allocations = computeSharesFromContributions(rawAllocations);

  // احذف القديم وأنشئ الجديد (بسيط وآمن لعدد صغير من الشركاء لكل مشروع)
  await prisma.$transaction([
    prisma.partnerProjectAllocation.deleteMany({ where: { projectId: params.id } }),
    prisma.partnerProjectAllocation.createMany({
      data: allocations.map((a) => ({
        projectId: params.id,
        partnerId: a.partnerId,
        contributionAmount: a.contributionAmount,
        sharePct: a.sharePct,
      })),
    }),
  ]);

  await logAudit({
    userId: (session.user as any).id,
    action: "PROJECT_PARTNER_ALLOCATIONS_UPDATED",
    entityType: "Project",
    entityId: params.id,
    after: allocations,
  });
  await notifyAdmins("PARTNER_CONTRIBUTION_EDITED", `تم تحديث مساهمات الشركاء لمشروع: ${project.name}`);

  const updated = await prisma.partnerProjectAllocation.findMany({
    where: { projectId: params.id },
    include: { partner: true },
  });
  return NextResponse.json(updated);
}
