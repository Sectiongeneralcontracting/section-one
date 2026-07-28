import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_MODULE_MAP } from "@/lib/modules";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;

  const notifications = await prisma.notification.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // الأدمن بيشوف كل الإشعارات من غير فلترة
  if (role === "ADMIN") return NextResponse.json(notifications);

  // نجيب صلاحيات العرض بتاعة الدور ده مرة واحدة، ونفلتر بيها
  const permissions = await prisma.permission.findMany({ where: { role: role as any, canView: true } });
  const viewableModules = new Set(permissions.map((p) => p.module));

  const filtered = notifications.filter((n) => {
    const module = NOTIFICATION_MODULE_MAP[n.type];
    // إشعار من غير موديول محدد = إشعار عام، يظهر للجميع
    if (!module) return true;
    return viewableModules.has(module);
  });

  return NextResponse.json(filtered);
}

// تعليم إشعار (أو الكل) كمقروء
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: (session.user as any).id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    await prisma.notification.update({
      where: { id: body.id },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
