import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function logAudit(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before as any,
      after: params.after as any,
    },
  });
}

// يرسل إشعار لكل الأدمن/المديرين عند حدوث أحداث مهمة
export async function notifyAdmins(type: NotificationType, message: string) {
  const recipients = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] }, isActive: true },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: recipients.map((r) => ({ userId: r.id, type, message })),
  });
}
