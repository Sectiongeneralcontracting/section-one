import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.companyProfile.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.companyProfile.findUnique({ where: { id: "singleton" } });

  const updated = await prisma.companyProfile.update({
    where: { id: "singleton" },
    data: {
      name: body.name,
      logoUrl: body.logoUrl,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website,
      taxNumber: body.taxNumber,
      commercialReg: body.commercialReg,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "COMPANY_PROFILE_UPDATED",
    entityType: "CompanyProfile",
    entityId: "singleton",
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}
