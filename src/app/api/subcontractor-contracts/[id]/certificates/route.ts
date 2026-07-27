import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { computeCertificate } from "@/lib/certificates";

const schema = z.object({
  periodFrom: z.string(),
  periodTo: z.string(),
  cumulativePct: z.number().min(0).max(100),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const certificates = await prisma.subcontractorCertificate.findMany({
    where: { contractId: params.id },
    orderBy: { number: "asc" },
  });
  return NextResponse.json(certificates);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contract = await prisma.subcontractorContract.findUnique({
    where: { id: params.id },
    include: { certificates: { orderBy: { number: "desc" }, take: 1 } },
  });
  if (!contract) return NextResponse.json({ error: "العقد غير موجود" }, { status: 404 });

  const lastCert = contract.certificates[0];
  if (parsed.data.cumulativePct <= Number(lastCert?.cumulativePct ?? 0)) {
    return NextResponse.json({ error: "نسبة الإنجاز التراكمية لازم تكون أكبر من آخر مستخلص" }, { status: 400 });
  }

  const result = computeCertificate({
    contractValue: Number(contract.contractValue),
    cumulativePct: parsed.data.cumulativePct,
    previousCumulativeValue: lastCert ? Number(lastCert.cumulativePct) / 100 * Number(contract.contractValue) : 0,
    retentionPct: 0,
    advancePaymentAmount: 0,
    advanceRecoveredSoFar: 0,
  });

  const certificate = await prisma.subcontractorCertificate.create({
    data: {
      contractId: params.id,
      number: (lastCert?.number ?? 0) + 1,
      periodFrom: new Date(parsed.data.periodFrom),
      periodTo: new Date(parsed.data.periodTo),
      cumulativePct: parsed.data.cumulativePct,
      thisPeriodValue: result.thisPeriodValue,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "SUBCONTRACTOR_CERTIFICATE_CREATED",
    entityType: "SubcontractorCertificate",
    entityId: certificate.id,
    after: certificate,
  });

  return NextResponse.json(certificate, { status: 201 });
}
