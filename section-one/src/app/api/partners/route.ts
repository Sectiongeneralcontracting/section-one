import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { partnerSchema } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partners = await prisma.partner.findMany({
    include: { contributions: true, projectAllocations: { include: { project: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(partners);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = partnerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const partner = await prisma.partner.create({ data: parsed.data });

  await logAudit({
    userId: (session.user as any).id,
    action: "PARTNER_CREATED",
    entityType: "Partner",
    entityId: partner.id,
    after: partner,
  });

  return NextResponse.json(partner, { status: 201 });
}
