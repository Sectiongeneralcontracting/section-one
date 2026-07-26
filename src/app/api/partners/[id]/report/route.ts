import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePartnerProfit } from "@/lib/allocations";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findUnique({ where: { id: params.id } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allocations = await prisma.partnerProjectAllocation.findMany({
    where: { partnerId: params.id },
    include: {
      project: {
        include: { expenses: true, client: true },
      },
    },
  });

  const rows = allocations.map((a) => {
    const totalExpenses = a.project.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = Number(a.project.contractValue) - totalExpenses;
    const sharePct = Number(a.sharePct);
    const partnerProfit = computePartnerProfit(sharePct, netProfit);
    return {
      projectId: a.project.id,
      projectCode: a.project.code,
      projectName: a.project.name,
      clientName: a.project.client.name,
      projectStatus: a.project.status,
      contractValue: Number(a.project.contractValue),
      totalExpenses,
      netProfit,
      sharePct,
      contributionAmount: Number(a.contributionAmount),
      partnerProfit,
    };
  });

  const totals = {
    totalProfit: rows.reduce((s, r) => s + r.partnerProfit, 0),
    totalContribution: rows.reduce((s, r) => s + r.contributionAmount, 0),
    totalExpensesShare: rows.reduce((s, r) => s + r.contributionAmount, 0),
    projectsCount: rows.length,
  };

  return NextResponse.json({ partner: { id: partner.id, name: partner.name }, rows, totals });
}
