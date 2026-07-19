import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [projects, expenses, contributions, clients] = await Promise.all([
    prisma.project.findMany({ select: { contractValue: true, status: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.partnerContribution.aggregate({ _sum: { amount: true } }),
    prisma.client.count(),
  ]);

  const totalContracts = projects.reduce((s, p) => s + Number(p.contractValue), 0);
  const totalExpenses = Number(expenses._sum.amount ?? 0);
  const totalProfit = totalContracts - totalExpenses;

  const topClients = await prisma.client.findMany({
    include: { projects: { select: { contractValue: true } } },
    take: 10,
  });

  return NextResponse.json({
    totalContracts,
    totalExpenses,
    totalProfit,
    totalPartnerContributions: Number(contributions._sum.amount ?? 0),
    projectsCount: projects.length,
    ongoing: projects.filter((p) => p.status === "ONGOING").length,
    closed: projects.filter((p) => p.status === "CLOSED").length,
    readyToClose: projects.filter((p) => p.status === "READY_TO_CLOSE").length,
    delayed: projects.filter((p) => p.status === "DELAYED").length,
    clientsCount: clients,
    topClients: topClients
      .map((c) => ({
        name: c.name,
        value: c.projects.reduce((s, p) => s + Number(p.contractValue), 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  });
}
