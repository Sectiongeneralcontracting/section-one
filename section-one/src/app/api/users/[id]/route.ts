import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.user.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      isActive: body.isActive ?? undefined,
      role: body.role ?? undefined,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: user.id,
    before,
    after: user,
  });

  return NextResponse.json(user);
}
