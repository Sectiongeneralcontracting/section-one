import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleLabels: Record<string, string> = { ADMIN: "مدير النظام", MANAGER: "مدير", VIEWER: "مشاهد" };
  const role = (session.user as any).role as string;

  return NextResponse.json({
    name: session.user?.name,
    email: session.user?.email,
    role,
    roleLabel: roleLabels[role] ?? role,
  });
}
