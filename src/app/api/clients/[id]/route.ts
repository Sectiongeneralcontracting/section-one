import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clientSchema } from "@/lib/schemas";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = clientSchema.partial().safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.client.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = await prisma.client.update({ where: { id: params.id }, data: parsed.data });

  await logAudit({
    userId: (session.user as any).id,
    action: "CLIENT_UPDATED",
    entityType: "Client",
    entityId: client.id,
    before,
    after: client,
  });

  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { projects: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // منع حذف أي عميل مرتبط بمشروع (Security requirement)
  if (client.projects.length > 0)
    return NextResponse.json(
      { error: "لا يمكن حذف عميل مرتبط بمشروع — احذف/انقل المشاريع أولاً" },
      { status: 403 }
    );

  await prisma.client.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "CLIENT_DELETED",
    entityType: "Client",
    entityId: params.id,
    before: client,
  });
  return NextResponse.json({ ok: true });
}
