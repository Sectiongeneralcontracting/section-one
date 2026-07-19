import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { canAssignEquipment } from "@/lib/equipment";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const equipment = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canAssignEquipment(equipment.status as any)) {
    return NextResponse.json({ error: `المعدة غير متاحة حاليًا (الحالة: ${equipment.status})` }, { status: 400 });
  }

  const [assignment] = await prisma.$transaction([
    prisma.equipmentAssignment.create({
      data: { equipmentId: params.id, projectId: body.projectId, notes: body.notes },
      include: { project: true },
    }),
    prisma.equipment.update({ where: { id: params.id }, data: { status: "IN_USE" } }),
  ]);

  await logAudit({
    userId: (session.user as any).id,
    action: "EQUIPMENT_ASSIGNED",
    entityType: "Equipment",
    entityId: params.id,
    after: assignment,
  });
  await notifyAdmins("EQUIPMENT_ASSIGNED", `تم تخصيص معدة ${equipment.name} لمشروع ${assignment.project.name}`);

  return NextResponse.json(assignment, { status: 201 });
}
