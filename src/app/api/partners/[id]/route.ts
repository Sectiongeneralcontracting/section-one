import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { partnerSchema } from "@/lib/schemas";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = partnerSchema.partial().safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.partner.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const partner = await prisma.partner.update({ where: { id: params.id }, data: parsed.data });

  await logAudit({
    userId: (session.user as any).id,
    action: "PARTNER_UPDATED",
    entityType: "Partner",
    entityId: partner.id,
    before,
    after: partner,
  });
  if (parsed.data.defaultShare !== undefined && Number(before.defaultShare) !== parsed.data.defaultShare) {
    await notifyAdmins("PARTNER_CONTRIBUTION_EDITED", `تم تعديل نسبة الشريك: ${partner.name}`);
  }

  return NextResponse.json(partner);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const partner = await prisma.partner.findUnique({
    where: { id: params.id },
    include: { projectAllocations: { include: { project: true } } },
  });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // منع حذف أي شريك مرتبط بمشروع مغلق (Security requirement)
  const linkedToClosed = partner.projectAllocations.some((a) => a.project.status === "CLOSED");
  if (linkedToClosed)
    return NextResponse.json(
      { error: "لا يمكن حذف شريك مرتبط بمشروع مغلق" },
      { status: 403 }
    );

  await prisma.partner.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "PARTNER_DELETED",
    entityType: "Partner",
    entityId: params.id,
    before: partner,
  });
  return NextResponse.json({ ok: true });
}
