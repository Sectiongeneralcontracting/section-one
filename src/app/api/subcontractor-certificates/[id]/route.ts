import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const flow: Record<string, string> = { DRAFT: "SUBMITTED", SUBMITTED: "APPROVED", APPROVED: "PAID" };

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const before = await prisma.subcontractorCertificate.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextStatus = flow[before.status];
  if (body.action !== "advance" || !nextStatus) {
    return NextResponse.json({ error: "لا يوجد انتقال حالة متاح" }, { status: 400 });
  }

  const certificate = await prisma.subcontractorCertificate.update({
    where: { id: params.id },
    data: { status: nextStatus as any },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUBCONTRACTOR_CERTIFICATE_UPDATED",
    entityType: "SubcontractorCertificate",
    entityId: certificate.id,
    before,
    after: certificate,
  });

  return NextResponse.json(certificate);
}
