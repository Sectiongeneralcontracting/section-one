import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins, notifyRoles } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const body = await req.json();
  const action = body.action as "approve" | "reject";

  const before = await prisma.siteRequest.findUnique({
    where: { id: params.id },
    include: { project: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "reject") {
    if (role !== "FINANCE_MANAGER" && role !== "ADMIN") {
      return NextResponse.json({ error: "رفض الطلب يتطلب صلاحية المدير المالي أو Admin" }, { status: 403 });
    }
    if (before.status === "APPROVED" || before.status === "REJECTED") {
      return NextResponse.json({ error: "الطلب ده اتحسم فيه بالفعل" }, { status: 400 });
    }
    const updated = await prisma.siteRequest.update({
      where: { id: params.id },
      data: { status: "REJECTED", rejectedById: userId, rejectionReason: body.reason ?? null },
    });
    await logAudit({ userId, action: "SITE_REQUEST_REJECTED", entityType: "SiteRequest", entityId: updated.id, before, after: updated });
    await notifyAdmins("SITE_REQUEST_REJECTED", `تم رفض طلب مشروع ${before.project.name}`);
    return NextResponse.json(updated);
  }

  // اعتماد — المرحلة الأولى: المدير المالي
  if (before.status === "PENDING_FINANCE") {
    if (role !== "FINANCE_MANAGER" && role !== "ADMIN") {
      return NextResponse.json({ error: "اعتماد الطلب في المرحلة دي يتطلب صلاحية المدير المالي" }, { status: 403 });
    }
    const updated = await prisma.siteRequest.update({
      where: { id: params.id },
      data: { status: "PENDING_ADMIN", financeApprovedById: userId, financeApprovedAt: new Date() },
    });
    await logAudit({ userId, action: "SITE_REQUEST_FINANCE_APPROVED", entityType: "SiteRequest", entityId: updated.id, before, after: updated });
    await notifyRoles(["ADMIN"], "SITE_REQUEST_FINANCE_APPROVED", `طلب مشروع ${before.project.name} اتعمد ماليًا — محتاج اعتماد Admin النهائي`);
    return NextResponse.json(updated);
  }

  // اعتماد — المرحلة الثانية: الأدمن
  if (before.status === "PENDING_ADMIN") {
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "الاعتماد النهائي يتطلب صلاحية Admin" }, { status: 403 });
    }
    const updated = await prisma.siteRequest.update({
      where: { id: params.id },
      data: { status: "APPROVED", adminApprovedById: userId, adminApprovedAt: new Date() },
    });
    await logAudit({ userId, action: "SITE_REQUEST_APPROVED", entityType: "SiteRequest", entityId: updated.id, before, after: updated });
    await notifyAdmins("SITE_REQUEST_APPROVED", `تم اعتماد طلب مشروع ${before.project.name} نهائيًا`);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "الطلب ده اتحسم فيه بالفعل" }, { status: 400 });
}
