import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, notifyAdmins } from "@/lib/audit";

const transitions: Record<string, { next: string; notif: "CERTIFICATE_SUBMITTED" | "CERTIFICATE_APPROVED" | "CERTIFICATE_PAID"; dateField: "submittedDate" | "approvedDate" | "paidDate" }> = {
  submit: { next: "SUBMITTED", notif: "CERTIFICATE_SUBMITTED", dateField: "submittedDate" },
  approve: { next: "APPROVED", notif: "CERTIFICATE_APPROVED", dateField: "approvedDate" },
  pay: { next: "PAID", notif: "CERTIFICATE_PAID", dateField: "paidDate" },
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const action = body.action as keyof typeof transitions;
  const transition = transitions[action];
  if (!transition) return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });

  // اعتماد وصرف المستخلص يتطلب صلاحية Admin
  if ((action === "approve" || action === "pay") && role !== "ADMIN")
    return NextResponse.json({ error: "يتطلب صلاحية Admin" }, { status: 403 });

  const before = await prisma.paymentCertificate.findUnique({
    where: { id: params.id },
    include: { contract: { include: { project: true } } },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = ["DRAFT", "SUBMITTED", "APPROVED", "PAID"];
  if (order.indexOf(transition.next) !== order.indexOf(before.status) + 1) {
    return NextResponse.json({ error: `لا يمكن الانتقال من ${before.status} إلى ${transition.next} مباشرة` }, { status: 400 });
  }

  const certificate = await prisma.paymentCertificate.update({
    where: { id: params.id },
    data: { status: transition.next as any, [transition.dateField]: new Date() },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: `CERTIFICATE_${transition.next}`,
    entityType: "PaymentCertificate",
    entityId: certificate.id,
    before,
    after: certificate,
  });
  await notifyAdmins(
    transition.notif,
    `مستخلص رقم ${before.number} لمشروع ${before.contract.project.name} أصبح ${transition.next}`
  );

  return NextResponse.json(certificate);
}
