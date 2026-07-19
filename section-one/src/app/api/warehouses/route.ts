import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const warehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const warehouses = await prisma.warehouse.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(warehouses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = warehouseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const warehouse = await prisma.warehouse.create({ data: parsed.data });
  await logAudit({
    userId: (session.user as any).id,
    action: "WAREHOUSE_CREATED",
    entityType: "Warehouse",
    entityId: warehouse.id,
    after: warehouse,
  });
  return NextResponse.json(warehouse, { status: 201 });
}
