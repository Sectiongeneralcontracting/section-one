import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Coins, TrendingDown, TrendingUp, HandCoins, Briefcase, Users } from "lucide-react";
import {
  MonthlyProfitChart,
  ExpensesByCategoryChart,
  PartnerDistributionBars,
} from "@/components/dashboard-charts";

const categoryLabels: Record<string, string> = {
  MATERIALS: "مواد",
  LABOR: "عمالة",
  SUBCONTRACTOR: "مقاولي باطن",
  EQUIPMENT: "معدات",
  ADMINISTRATIVE: "مصروفات إدارية",
  OTHER: "أخرى",
};
const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

async function getDashboardData() {
  const [projects, expenses, contributionAgg, clientsCount, closingReports, partners] = await Promise.all([
    prisma.project.findMany({ select: { contractValue: true, status: true } }),
    prisma.expense.findMany({ select: { amount: true, category: true, date: true } }),
    prisma.partnerContribution.aggregate({ _sum: { amount: true } }),
    prisma.client.count(),
    prisma.closingReport.findMany({ select: { netProfit: true, closedAt: true } }),
    prisma.partner.findMany({
      include: { projectAllocations: true },
    }),
  ]);

  const totalContracts = projects.reduce((s, p) => s + Number(p.contractValue), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalProfit = totalContracts - totalExpenses;

  // آخر 6 شهور من تقارير الإغلاق الفعلية
  const now = new Date();
  const monthly: { month: string; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthNames[d.getMonth()];
    const profit = closingReports
      .filter((r) => {
        const cd = new Date(r.closedAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      })
      .reduce((s, r) => s + Number(r.netProfit), 0);
    monthly.push({ month: label, profit });
  }

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
  }
  const expensesByCategory = Object.entries(byCategory).map(([k, v]) => ({
    name: categoryLabels[k] ?? k,
    value: v,
  }));

  const totalShare = partners.reduce((s, p) => s + Number(p.defaultShare), 0) || 1;
  const partnerDistribution = partners
    .filter((p) => Number(p.defaultShare) > 0)
    .map((p) => ({ name: p.name, pct: Math.round((Number(p.defaultShare) / totalShare) * 100) }));

  return {
    totalContracts,
    totalExpenses,
    totalProfit,
    totalContributions: Number(contributionAgg._sum.amount ?? 0),
    projectsCount: projects.length,
    clientsCount,
    monthly,
    expensesByCategory,
    partnerDistribution,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const s = await getDashboardData();

  return (
    <AppShell title="الرئيسية">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="إجمالي قيمة العقود" value={formatCurrency(s.totalContracts)} icon={Coins} tone="primary" />
        <KpiCard label="إجمالي المصروفات" value={formatCurrency(s.totalExpenses)} icon={TrendingDown} tone="danger" />
        <KpiCard label="إجمالي الأرباح" value={formatCurrency(s.totalProfit)} icon={TrendingUp} tone="success" />
        <KpiCard label="إجمالي مساهمات الشركاء" value={formatCurrency(s.totalContributions)} icon={HandCoins} tone="warning" />
        <KpiCard label="عدد المشاريع" value={String(s.projectsCount)} icon={Briefcase} tone="primary" />
        <KpiCard label="عدد العملاء" value={String(s.clientsCount)} icon={Users} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyProfitChart data={s.monthly} />
        <ExpensesByCategoryChart data={s.expensesByCategory} />
      </div>
      <PartnerDistributionBars data={s.partnerDistribution} />
    </AppShell>
  );
}
