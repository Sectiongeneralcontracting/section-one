import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const equipment = await prisma.equipment.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      type: body.type ?? undefined,
      status: body.status ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "EQUIPMENT_UPDATED",
    entityType: "Equipment",
    entityId: equipment.id,
    before,
    after: equipment,
  });

  return NextResponse.json(equipment);
}
