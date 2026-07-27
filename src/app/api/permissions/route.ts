import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { MODULES, ALL_ROLES } from "@/lib/modules";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });

  const rows = await prisma.permission.findMany();
  const editableRoles = ALL_ROLES.filter((r) => r !== "ADMIN");

  const matrix: Record<string, Record<string, { canView: boolean; canEdit: boolean }>> = {};
  for (const role of editableRoles) {
    matrix[role] = {};
    for (const m of MODULES) matrix[role][m.key] = { canView: false, canEdit: false };
  }
  for (const r of rows) {
    if (matrix[r.role]) matrix[r.role][r.module] = { canView: r.canView, canEdit: r.canEdit };
  }

  return NextResponse.json({ roles: editableRoles, modules: MODULES, matrix });
}

// body: { role, module, canView, canEdit }[]
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });

  const body = await req.json();
  const updates: { role: string; module: string; canView: boolean; canEdit: boolean }[] = body.updates ?? [];

  for (const u of updates) {
    if (u.role === "ADMIN") continue; // الأدمن مش قابل للتقييد أبدًا
    await prisma.permission.upsert({
      where: { role_module: { role: u.role as any, module: u.module } },
      update: { canView: u.canView, canEdit: u.canEdit },
      create: { role: u.role as any, module: u.module, canView: u.canView, canEdit: u.canEdit },
    });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: "PERMISSIONS_UPDATED",
    entityType: "Permission",
    entityId: "matrix",
    after: { count: updates.length },
  });

  return NextResponse.json({ ok: true });
}
