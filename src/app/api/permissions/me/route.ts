import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULES } from "@/lib/modules";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;

  // الأدمن دايمًا له صلاحية كاملة على كل الموديولات — bypass تام لأي إعدادات مسجلة
  if (role === "ADMIN") {
    const full: Record<string, { canView: boolean; canEdit: boolean }> = {};
    for (const m of MODULES) full[m.key] = { canView: true, canEdit: true };
    return NextResponse.json({ role, permissions: full });
  }

  const rows = await prisma.permission.findMany({ where: { role: role as any } });
  const permissions: Record<string, { canView: boolean; canEdit: boolean }> = {};
  for (const m of MODULES) permissions[m.key] = { canView: false, canEdit: false };
  for (const r of rows) permissions[r.module] = { canView: r.canView, canEdit: r.canEdit };

  return NextResponse.json({ role, permissions });
}
