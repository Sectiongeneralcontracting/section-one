import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findUnique({
    where: { id: params.id },
    include: {
      contributions: { orderBy: { date: "desc" } },
      withdrawals: { orderBy: { date: "desc" } },
      projectAllocations: {
        include: { project: { select: { id: true, name: true, code: true, status: true } } },
      },
    },
  });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalCapital = partner.contributions.reduce((s, c) => s + Number(c.amount), 0);
  const totalWithdrawals = partner.withdrawals.reduce((s, w) => s + Number(w.amount), 0);

  // الأرباح الموزعة فعليًا = بس للمشاريع اللي حالتها CLOSED ومعاها profitAmt محسوب
  const distributedProfits = partner.projectAllocations.filter(
    (a) => a.project.status === "CLOSED" && a.profitAmt !== null
  );
  const totalProfitDistributed = distributedProfits.reduce((s, a) => s + Number(a.profitAmt), 0);

  // أرباح محسوبة لكنها لسه مش موزعة رسميًا (المشروع لسه مفتوح) — للعرض فقط، مش جزء من الرصيد
  const pendingAllocations = partner.projectAllocations.filter((a) => a.project.status !== "CLOSED");

  const balance = totalCapital - totalWithdrawals + totalProfitDistributed;

  return NextResponse.json({
    partner: { id: partner.id, name: partner.name },
    totalCapital,
    totalWithdrawals,
    totalProfitDistributed,
    balance,
    fundingHistory: partner.contributions,
    withdrawalHistory: partner.withdrawals,
    distributedProfits: distributedProfits.map((a) => ({
      projectId: a.project.id,
      projectName: a.project.name,
      projectCode: a.project.code,
      sharePct: Number(a.sharePct),
      profitAmt: Number(a.profitAmt),
    })),
    pendingProjects: pendingAllocations.map((a) => ({
      projectId: a.project.id,
      projectName: a.project.name,
      projectCode: a.project.code,
      status: a.project.status,
      sharePct: Number(a.sharePct),
    })),
  });
}
