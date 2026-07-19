import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      expenses: { orderBy: { date: "desc" } },
      partnerAllocations: { include: { partner: true } },
      closingReports: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

// تعديل بيانات المشروع، أو إغلاقه (action: "close"), أو إعادة فتحه (action: "reopen")
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.project.findUnique({
    where: { id: params.id },
    include: { expenses: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "close") {
    // منع إغلاق مشروع مغلق بالفعل
    if (before.status === "CLOSED")
      return NextResponse.json({ error: "المشروع مغلق بالفعل" }, { status: 400 });

    const totalExpense = before.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalRevenue = Number(before.contractValue);
    const netProfit = totalRevenue - totalExpense;

    const [project, report] = await prisma.$transaction([
      prisma.project.update({ where: { id: params.id }, data: { status: "CLOSED" } }),
      prisma.closingReport.create({
        data: { projectId: params.id, totalRevenue, totalExpense, netProfit },
      }),
    ]);

    await logAudit({
      userId: (session.user as any).id,
      action: "PROJECT_CLOSED",
      entityType: "Project",
      entityId: params.id,
      before,
      after: project,
    });
    await notifyAdmins("PROJECT_CLOSED", `تم إغلاق مشروع: ${before.name}`);

    return NextResponse.json({ project, report });
  }

  if (body.action === "reopen") {
    if (role !== "ADMIN")
      return NextResponse.json({ error: "إعادة الفتح تتطلب صلاحية Admin" }, { status: 403 });

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { status: "ONGOING" },
    });

    await logAudit({
      userId: (session.user as any).id,
      action: "PROJECT_REOPENED",
      entityType: "Project",
      entityId: params.id,
      before,
      after: project,
    });
    await notifyAdmins("PROJECT_REOPENED", `تمت إعادة فتح مشروع: ${before.name}`);

    return NextResponse.json(project);
  }

  // تعديل عادي (حالة، قيمة عقد...)
  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      contractValue: body.contractValue ?? undefined,
      status: body.status ?? undefined,
      description: body.description ?? undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "PROJECT_UPDATED",
    entityType: "Project",
    entityId: params.id,
    before,
    after: project,
  });
  if (body.contractValue && Number(body.contractValue) !== Number(before.contractValue)) {
    await notifyAdmins("CONTRACT_VALUE_EDITED", `تم تعديل قيمة عقد مشروع: ${project.name}`);
  }
  if (project.status === "READY_TO_CLOSE" && before.status !== "READY_TO_CLOSE") {
    await notifyAdmins("PROJECT_READY_TO_CLOSE", `مشروع جاهز للإغلاق: ${project.name}`);
  }

  return NextResponse.json(project);
}

// منع حذف أي مشروع مغلق (Security requirement)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.status === "CLOSED")
    return NextResponse.json({ error: "لا يمكن حذف مشروع مغلق" }, { status: 403 });

  await prisma.project.delete({ where: { id: params.id } });
  await logAudit({
    userId: (session.user as any).id,
    action: "PROJECT_DELETED",
    entityType: "Project",
    entityId: params.id,
    before: project,
  });
  return NextResponse.json({ ok: true });
}
