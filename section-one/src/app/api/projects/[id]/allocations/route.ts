import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { validateAllocationTotal } from "@/lib/allocations";

// body: { allocations: [{ partnerId, sharePct }] }
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const allocations: { partnerId: string; sharePct: number }[] = body.allocations ?? [];

  const check = validateAllocationTotal(allocations);
  if (!check.valid) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // احذف القديم وأنشئ الجديد (بسيط وآمن لعدد صغير من الشركاء لكل مشروع)
  await prisma.$transaction([
    prisma.partnerProjectAllocation.deleteMany({ where: { projectId: params.id } }),
    prisma.partnerProjectAllocation.createMany({
      data: allocations.map((a) => ({
        projectId: params.id,
        partnerId: a.partnerId,
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
  await notifyAdmins("PARTNER_CONTRIBUTION_EDITED", `تم تحديث نسب الشركاء لمشروع: ${project.name}`);

  const updated = await prisma.partnerProjectAllocation.findMany({
    where: { projectId: params.id },
    include: { partner: true },
  });
  return NextResponse.json(updated);
}
