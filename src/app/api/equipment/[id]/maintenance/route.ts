import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { canSendToMaintenance } from "@/lib/equipment";

const maintenanceSchema = z.object({
  description: z.string().min(1),
  cost: z.number().min(0).default(0),
  performedBy: z.string().optional(),
  markOutOfService: z.boolean().default(false),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = maintenanceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const equipment = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canSendToMaintenance(equipment.status as any)) {
    return NextResponse.json({ error: "المعدة خارج الخدمة بالفعل" }, { status: 400 });
  }

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        equipmentId: params.id,
        description: parsed.data.description,
        cost: parsed.data.cost,
        performedBy: parsed.data.performedBy,
      },
    }),
    prisma.equipment.update({
      where: { id: params.id },
      data: { status: parsed.data.markOutOfService ? "OUT_OF_SERVICE" : "MAINTENANCE" },
    }),
  ]);

  await logAudit({
    userId: (session.user as any).id,
    action: "EQUIPMENT_MAINTENANCE_LOGGED",
    entityType: "Equipment",
    entityId: params.id,
    after: log,
  });
  await notifyAdmins("EQUIPMENT_MAINTENANCE", `تسجيل صيانة لمعدة ${equipment.name}: ${parsed.data.description}`);

  return NextResponse.json(log, { status: 201 });
}
