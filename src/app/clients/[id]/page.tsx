"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/clients/${id}`).then((r) => r.json()).then(setClient);
  }, [id]);

  if (!client) return <AppShell title="جارٍ التحميل..."><></></AppShell>;

  return (
    <AppShell title={client.name}>
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <p><span className="text-neutral-500">الهاتف: </span>{client.phone || "—"}</p>
          <p><span className="text-neutral-500">البريد: </span>{client.email || "—"}</p>
          <p><span className="text-neutral-500">العنوان: </span>{client.address || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">إجمالي قيمة المشاريع</p><p className="font-bold text-lg">{client.totals.totalContractValue.toLocaleString("ar-EG")} ج.م</p></div>
        <div className="card"><p className="text-sm text-neutral-500">إجمالي المصروفات</p><p className="font-bold text-lg text-danger">{client.totals.totalExpenses.toLocaleString("ar-EG")} ج.م</p></div>
        <div className="card"><p className="text-sm text-neutral-500">إجمالي المحصّل (مستخلصات مصروفة)</p><p className="font-bold text-lg text-success">{client.totals.totalCollected.toLocaleString("ar-EG")} ج.م</p></div>
        <div className="card">
          <p className="text-sm text-neutral-500">صافي التدفق النقدي</p>
          <p className={`font-bold text-lg ${client.totals.totalCashFlow >= 0 ? "text-success" : "text-danger"}`}>
            {client.totals.totalCashFlow.toLocaleString("ar-EG")} ج.م
          </p>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">المشروع</th>
              <th className="p-3 font-medium">قيمة المشروع</th>
              <th className="p-3 font-medium">المصروفات</th>
              <th className="p-3 font-medium">المحصّل (مصروف من المستخلصات)</th>
              <th className="p-3 font-medium">معلّق التحصيل</th>
              <th className="p-3 font-medium">حالة التدفق النقدي</th>
              <th className="p-3 font-medium">حالة المشروع</th>
            </tr>
          </thead>
          <tbody>
            {client.projects.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={7}>لا يوجد مشاريع لهذا العميل بعد.</td></tr>
            )}
            {client.projects.map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-neutral-50">
                <td className="p-3 font-medium">
                  <Link href={`/projects/${p.id}`} className="text-primary hover:underline">{p.name}</Link>
                  <p className="text-xs text-neutral-400">{p.code}</p>
                </td>
                <td className="p-3">{p.contractValue.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{p.totalExpenses.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{p.totalCollected.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">
                  {p.hasContract ? `${p.totalPending.toLocaleString("ar-EG")} ج.م` : <span className="text-neutral-400">لا يوجد عقد</span>}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${p.cashFlowStatus === "positive" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {p.cashFlowStatus === "positive" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {p.cashFlow.toLocaleString("ar-EG")} ج.م
                  </span>
                </td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">
        "المحصّل" = صافي مستخلصات هذا المشروع اللي بحالة "مصروف" فعليًا. "التدفق النقدي" = المحصّل − المصروفات الفعلية.
      </p>
    </AppShell>
  );
}
