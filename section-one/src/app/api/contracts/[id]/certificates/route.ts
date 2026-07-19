import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { computeCertificate } from "@/lib/certificates";

const certSchema = z.object({
  periodFrom: z.string(),
  periodTo: z.string(),
  cumulativePct: z.number().min(0).max(100),
  taxPct: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = certSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { project: true, certificates: true },
  });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lastCert = contract.certificates.sort((a, b) => b.number - a.number)[0];
  const previousCumulativeValue = lastCert ? Number(lastCert.cumulativeValue) : 0;
  const advanceRecoveredSoFar = contract.certificates.reduce((s, c) => s + Number(c.advanceRecoveryAmount), 0);

  if (parsed.data.cumulativePct <= (lastCert ? Number(lastCert.cumulativePct) : 0)) {
    return NextResponse.json(
      { error: "نسبة الإنجاز التراكمية لازم تكون أكبر من آخر مستخلص" },
      { status: 400 }
    );
  }

  const result = computeCertificate({
    contractValue: Number(contract.project.contractValue),
    cumulativePct: parsed.data.cumulativePct,
    previousCumulativeValue,
    retentionPct: Number(contract.retentionPct),
    advancePaymentAmount: Number(contract.advancePaymentAmount),
    advanceRecoveredSoFar,
    taxPct: parsed.data.taxPct ?? 0,
  });

  const certificate = await prisma.paymentCertificate.create({
    data: {
      contractId: params.id,
      number: (lastCert?.number ?? 0) + 1,
      periodFrom: new Date(parsed.data.periodFrom),
      periodTo: new Date(parsed.data.periodTo),
      cumulativePct: parsed.data.cumulativePct,
      previousCumulativeValue,
      cumulativeValue: result.cumulativeValue,
      thisPeriodValue: result.thisPeriodValue,
      retentionAmount: result.retentionAmount,
      advanceRecoveryAmount: result.advanceRecoveryAmount,
      taxAmount: result.taxAmount,
      netPayable: result.netPayable,
      notes: parsed.data.notes,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: "CERTIFICATE_CREATED",
    entityType: "PaymentCertificate",
    entityId: certificate.id,
    after: certificate,
  });

  return NextResponse.json(certificate, { status: 201 });
}
