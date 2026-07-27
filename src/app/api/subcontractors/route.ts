import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subcontractors = await prisma.subcontractor.findMany({
    include: {
      contracts: { include: { project: { select: { id: true, name: true } }, payments: true } },
      evaluations: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(subcontractors);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const subcontractor = await prisma.subcontractor.create({ data: parsed.data });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUBCONTRACTOR_CREATED",
    entityType: "Subcontractor",
    entityId: subcontractor.id,
    after: subcontractor,
  });

  return NextResponse.json(subcontractor, { status: 201 });
}
