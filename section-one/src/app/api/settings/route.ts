import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });

  const updated = await prisma.systemSettings.update({
    where: { id: "singleton" },
    data: {
      insuranceRate: body.insuranceRate,
      taxRate: body.taxRate,
      currency: body.currency,
      currencyFormat: body.currencyFormat,
      defaultLanguage: body.defaultLanguage,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SETTINGS_UPDATED",
    entityType: "SystemSettings",
    entityId: "singleton",
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}
