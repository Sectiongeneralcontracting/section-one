"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/lib/use-locale";
import { TrendingUp, TrendingDown } from "lucide-react";

const dict = {
  ar: {
    loading: "جارٍ التحميل...", phone: "الهاتف", email: "البريد", address: "العنوان",
    totalValue: "إجمالي قيمة المشاريع", totalExpenses: "إجمالي المصروفات",
    totalCollected: "إجمالي المحصّل (مستخلصات مصروفة)", netCashFlow: "صافي التدفق النقدي",
    totalClientPaid: "إجمالي المدفوع فعليًا من العميل", thClientPaid: "المدفوع فعليًا",
    thProject: "المشروع", thValue: "قيمة المشروع", thExpenses: "المصروفات",
    thCollected: "المحصّل (مصروف من المستخلصات)", thPending: "معلّق التحصيل",
    thCashFlow: "حالة التدفق النقدي", thStatus: "حالة المشروع",
    noProjects: "لا يوجد مشاريع لهذا العميل بعد.", noContract: "لا يوجد عقد",
    footnote: '"المحصّل" = صافي مستخلصات هذا المشروع اللي بحالة "مصروف" فعليًا. "التدفق النقدي" = المحصّل − المصروفات الفعلية.',
  },
  en: {
    loading: "Loading...", phone: "Phone", email: "Email", address: "Address",
    totalValue: "Total Project Value", totalExpenses: "Total Expenses",
    totalCollected: "Total Collected (paid certificates)", netCashFlow: "Net Cash Flow",
    totalClientPaid: "Total Actually Paid by Client", thClientPaid: "Actually Paid",
    thProject: "Project", thValue: "Project Value", thExpenses: "Expenses",
    thCollected: "Collected (from certificates)", thPending: "Pending Collection",
    thCashFlow: "Cash Flow Status", thStatus: "Project Status",
    noProjects: "This client has no projects yet.", noContract: "No contract",
    footnote: '"Collected" = the net value of this project\'s certificates that are actually "Paid". "Cash Flow" = Collected − Actual Expenses.',
  },
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/clients/${id}`).then((r) => r.json()).then(setClient);
  }, [id]);

  if (!client) return <AppShell title={t.loading}><></></AppShell>;

  return (
    <AppShell title={client.name}>
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <p><span className="text-neutral-500">{t.phone}: </span>{client.phone || "—"}</p>
          <p><span className="text-neutral-500">{t.email}: </span>{client.email || "—"}</p>
          <p><span className="text-neutral-500">{t.address}: </span>{client.address || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">{t.totalValue}</p><p className="font-bold text-lg">{client.totals.totalContractValue.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.totalExpenses}</p><p className="font-bold text-lg text-danger">{client.totals.totalExpenses.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.totalCollected}</p><p className="font-bold text-lg text-success">{client.totals.totalCollected.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.totalClientPaid}</p><p className="font-bold text-lg text-success">{client.totals.totalClientPaid.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card">
          <p className="text-sm text-neutral-500">{t.netCashFlow}</p>
          <p className={`font-bold text-lg ${client.totals.totalCashFlow >= 0 ? "text-success" : "text-danger"}`}>
            {client.totals.totalCashFlow.toLocaleString(localeCode)} {currency}
          </p>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium">{t.thValue}</th>
              <th className="p-3 font-medium">{t.thExpenses}</th>
              <th className="p-3 font-medium">{t.thCollected}</th>
              <th className="p-3 font-medium">{t.thClientPaid}</th>
              <th className="p-3 font-medium">{t.thPending}</th>
              <th className="p-3 font-medium">{t.thCashFlow}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {client.projects.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={8}>{t.noProjects}</td></tr>
            )}
            {client.projects.map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-neutral-50">
                <td className="p-3 font-medium">
                  <Link href={`/projects/${p.id}`} className="text-primary hover:underline">{p.name}</Link>
                  <p className="text-xs text-neutral-400">{p.code}</p>
                </td>
                <td className="p-3">{p.contractValue.toLocaleString(localeCode)} {currency}</td>
                <td className="p-3">{p.totalExpenses.toLocaleString(localeCode)} {currency}</td>
                <td className="p-3">{p.totalCollected.toLocaleString(localeCode)} {currency}</td>
                <td className="p-3 font-medium">{p.totalClientPaid.toLocaleString(localeCode)} {currency}</td>
                <td className="p-3">
                  {p.hasContract ? `${p.totalPending.toLocaleString(localeCode)} ${currency}` : <span className="text-neutral-400">{t.noContract}</span>}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${p.cashFlowStatus === "positive" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {p.cashFlowStatus === "positive" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {p.cashFlow.toLocaleString(localeCode)} {currency}
                  </span>
                </td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">{t.footnote}</p>
    </AppShell>
  );
}
