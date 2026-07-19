import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const item = await prisma.boqItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.boqItem.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "BOQ_ITEM_DELETED",
    entityType: "BoqItem",
    entityId: params.id,
    before: item,
  });
  return NextResponse.json({ ok: true });
}
