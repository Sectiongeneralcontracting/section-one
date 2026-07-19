import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { nextStatusAfterUnassign } from "@/lib/equipment";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const activeAssignment = await prisma.equipmentAssignment.findFirst({
    where: { equipmentId: params.id, toDate: null },
  });
  if (!activeAssignment) return NextResponse.json({ error: "المعدة مش مخصصة لمشروع حاليًا" }, { status: 400 });

  const nextStatus = nextStatusAfterUnassign(!!body.needsMaintenance);

  await prisma.$transaction([
    prisma.equipmentAssignment.update({ where: { id: activeAssignment.id }, data: { toDate: new Date() } }),
    prisma.equipment.update({ where: { id: params.id }, data: { status: nextStatus } }),
  ]);

  await logAudit({
    userId: (session.user as any).id,
    action: "EQUIPMENT_UNASSIGNED",
    entityType: "Equipment",
    entityId: params.id,
    after: { nextStatus },
  });

  return NextResponse.json({ ok: true, nextStatus });
}
