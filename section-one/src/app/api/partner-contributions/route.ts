import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contributionSchema } from "@/lib/schemas";
import { logAudit, notifyAdmins } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contributions = await prisma.partnerContribution.findMany({
    include: { partner: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(contributions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = contributionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contribution = await prisma.partnerContribution.create({
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PARTNER_CONTRIBUTION_CREATED",
    entityType: "PartnerContribution",
    entityId: contribution.id,
    after: contribution,
  });
  await notifyAdmins(
    "PARTNER_CONTRIBUTION_EDITED",
    `تم تسجيل مساهمة جديدة بقيمة ${contribution.amount}`
  );

  return NextResponse.json(contribution, { status: 201 });
}
