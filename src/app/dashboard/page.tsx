import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
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
  const [projectsRaw, expenses, contributionAgg, clientsCount, closingReports, partners] = await Promise.all([
    prisma.project.findMany({
      include: { client: true, expenses: true, contract: { include: { certificates: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({ select: { amount: true, category: true, date: true } }),
    prisma.partnerContribution.aggregate({ _sum: { amount: true } }),
    prisma.client.count(),
    prisma.closingReport.findMany({ select: { netProfit: true, closedAt: true } }),
    prisma.partner.findMany({
      include: { projectAllocations: true },
    }),
  ]);

  const projects = projectsRaw.map((p) => p);

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

  const projectsTable = projects.map((p) => {
    const totalExpenses = p.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = Number(p.contractValue) - totalExpenses;
    const totalPayments = (p.contract?.certificates ?? [])
      .filter((c) => c.status === "PAID")
      .reduce((s, c) => s + Number(c.netPayable), 0);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      clientName: p.client.name,
      status: p.status,
      contractValue: Number(p.contractValue),
      totalExpenses,
      netProfit,
      totalPayments,
    };
  });

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
    projectsTable,
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

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b">
          <p className="font-semibold">المشاريع — قيمة، مصروفات، ربح، ودفعات محصّلة</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">المشروع</th>
              <th className="p-3 font-medium">العميل</th>
              <th className="p-3 font-medium">قيمة المشروع</th>
              <th className="p-3 font-medium">المصروفات</th>
              <th className="p-3 font-medium">الربح</th>
              <th className="p-3 font-medium">الدفعات المحصّلة</th>
              <th className="p-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {s.projectsTable.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={7}>لا يوجد مشاريع بعد.</td></tr>
            )}
            {s.projectsTable.map((p) => (
              <tr key={p.id} className="border-t hover:bg-neutral-50">
                <td className="p-3 font-medium">
                  <Link href={`/projects/${p.id}`} className="text-primary hover:underline">{p.name}</Link>
                </td>
                <td className="p-3">{p.clientName}</td>
                <td className="p-3">{p.contractValue.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3 text-danger">{p.totalExpenses.toLocaleString("ar-EG")} ج.م</td>
                <td className={`p-3 font-medium ${p.netProfit >= 0 ? "text-success" : "text-danger"}`}>{p.netProfit.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{p.totalPayments.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
          {s.projectsTable.length > 0 && (
            <tfoot>
              <tr className="border-t bg-neutral-50 font-semibold">
                <td className="p-3" colSpan={2}>الإجمالي</td>
                <td className="p-3">{s.projectsTable.reduce((sum, p) => sum + p.contractValue, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3 text-danger">{s.projectsTable.reduce((sum, p) => sum + p.totalExpenses, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3 text-success">{s.projectsTable.reduce((sum, p) => sum + p.netProfit, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{s.projectsTable.reduce((sum, p) => sum + p.totalPayments, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </AppShell>
  );
}
