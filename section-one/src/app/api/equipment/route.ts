import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const equipmentSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(1),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const equipment = await prisma.equipment.findMany({
    include: {
      assignments: { where: { toDate: null }, include: { project: true } },
      maintenanceLogs: { orderBy: { date: "desc" }, take: 5 },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(equipment);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = equipmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const equipment = await prisma.equipment.create({
    data: { ...parsed.data, purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : undefined },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "EQUIPMENT_CREATED",
    entityType: "Equipment",
    entityId: equipment.id,
    after: equipment,
  });

  return NextResponse.json(equipment, { status: 201 });
}
