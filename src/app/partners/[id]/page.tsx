"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Wallet } from "lucide-react";

const dict = {
  ar: {
    capital: "إجمالي رأس المال (التمويل)", withdrawals: "إجمالي السحوبات",
    profitDistributed: "الأرباح الموزعة (مشاريع مقفولة)", balance: "الرصيد الحالي",
    newWithdrawal: "سحب جديد", cancel: "إلغاء", amount: "القيمة *", date: "التاريخ", notes: "ملاحظات",
    save: "حفظ السحب", saving: "جارٍ الحفظ...", err: "تعذر تسجيل السحب",
    fundingHistory: "تاريخ التمويل (رأس المال)", withdrawalHistory: "تاريخ السحوبات",
    distributedTitle: "الأرباح الموزعة لكل مشروع (مقفول)", pendingTitle: "مشاريع لسه مفتوحة (الربح مش موزّع بعد)",
    thDate: "التاريخ", thAmount: "القيمة", thNotes: "ملاحظات",
    thProject: "المشروع", thShare: "النسبة", thProfit: "الربح الموزّع", thStatus: "الحالة",
    noData: "لا يوجد بيانات.", loading: "جارٍ التحميل...",
    backToPartners: "رجوع للشركاء",
    pendingNote: "الأرباح دي محسوبة مبدئيًا بس هتتوزع فعليًا لرصيد الشريك بس لما المشروع يتقفل.",
  },
  en: {
    capital: "Total Capital (Funding)", withdrawals: "Total Withdrawals",
    profitDistributed: "Distributed Profit (Closed Projects)", balance: "Current Balance",
    newWithdrawal: "New Withdrawal", cancel: "Cancel", amount: "Amount *", date: "Date", notes: "Notes",
    save: "Save Withdrawal", saving: "Saving...", err: "Failed to record withdrawal",
    fundingHistory: "Funding History (Capital)", withdrawalHistory: "Withdrawal History",
    distributedTitle: "Distributed Profit per Project (Closed)", pendingTitle: "Still Open Projects (Profit not yet distributed)",
    thDate: "Date", thAmount: "Amount", thNotes: "Notes",
    thProject: "Project", thShare: "Share", thProfit: "Distributed Profit", thStatus: "Status",
    noData: "No data.", loading: "Loading...",
    backToPartners: "Back to Partners",
    pendingNote: "These profits are preliminary calculations only — they're credited to the partner's balance only once the project is closed.",
  },
};

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  const [data, setData] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ amount: 0, date: "", notes: "" });

  async function load() {
    const res = await fetch(`/api/partners/${id}/balance`);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function submitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/partners/${id}/withdrawals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? t.err);
    setForm({ amount: 0, date: "", notes: "" });
    setShowForm(false);
    load();
  }

  if (!data) return <AppShell title={t.loading}><></></AppShell>;

  return (
    <AppShell
      title={data.partner.name}
      action={
        <div className="flex gap-2">
          <button onClick={() => setShowForm((v) => !v)} className="bg-danger text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            {showForm ? <X size={16} /> : <Wallet size={16} />} {t.newWithdrawal}
          </button>
          <Link href="/partners" className="text-sm px-4 py-2 rounded-xl border">{t.backToPartners}</Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">{t.capital}</p><p className="font-bold text-lg">{data.totalCapital.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.withdrawals}</p><p className="font-bold text-lg text-danger">{data.totalWithdrawals.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.profitDistributed}</p><p className="font-bold text-lg text-success">{data.totalProfitDistributed.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.balance}</p><p className={`font-bold text-lg ${data.balance >= 0 ? "text-success" : "text-danger"}`}>{data.balance.toLocaleString(localeCode)} {currency}</p></div>
      </div>

      {showForm && (
        <form onSubmit={submitWithdrawal} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.amount}</label>
            <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.date}</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button disabled={saving} className="bg-danger text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card !p-0 overflow-hidden">
          <div className="p-3 border-b font-semibold text-sm">{t.fundingHistory}</div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr className="text-right"><th className="p-2 font-medium">{t.thDate}</th><th className="p-2 font-medium">{t.thAmount}</th><th className="p-2 font-medium">{t.thNotes}</th></tr>
            </thead>
            <tbody>
              {data.fundingHistory.length === 0 && <tr><td className="p-3 text-neutral-400" colSpan={3}>{t.noData}</td></tr>}
              {data.fundingHistory.map((f: any) => (
                <tr key={f.id} className="border-t">
                  <td className="p-2">{new Date(f.date).toLocaleDateString(localeCode)}</td>
                  <td className="p-2 font-medium">{Number(f.amount).toLocaleString(localeCode)}</td>
                  <td className="p-2">{f.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card !p-0 overflow-hidden">
          <div className="p-3 border-b font-semibold text-sm">{t.withdrawalHistory}</div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr className="text-right"><th className="p-2 font-medium">{t.thDate}</th><th className="p-2 font-medium">{t.thAmount}</th><th className="p-2 font-medium">{t.thNotes}</th></tr>
            </thead>
            <tbody>
              {data.withdrawalHistory.length === 0 && <tr><td className="p-3 text-neutral-400" colSpan={3}>{t.noData}</td></tr>}
              {data.withdrawalHistory.map((w: any) => (
                <tr key={w.id} className="border-t">
                  <td className="p-2">{new Date(w.date).toLocaleDateString(localeCode)}</td>
                  <td className="p-2 font-medium text-danger">{Number(w.amount).toLocaleString(localeCode)}</td>
                  <td className="p-2">{w.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-3 border-b font-semibold text-sm">{t.distributedTitle}</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right"><th className="p-2 font-medium">{t.thProject}</th><th className="p-2 font-medium">{t.thShare}</th><th className="p-2 font-medium">{t.thProfit}</th></tr>
          </thead>
          <tbody>
            {data.distributedProfits.length === 0 && <tr><td className="p-3 text-neutral-400" colSpan={3}>{t.noData}</td></tr>}
            {data.distributedProfits.map((p: any) => (
              <tr key={p.projectId} className="border-t">
                <td className="p-2"><Link href={`/projects/${p.projectId}`} className="text-primary hover:underline">{p.projectName}</Link></td>
                <td className="p-2">{p.sharePct}%</td>
                <td className="p-2 font-semibold text-success">{p.profitAmt.toLocaleString(localeCode)} {currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.pendingProjects.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="p-3 border-b font-semibold text-sm">{t.pendingTitle}</div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr className="text-right"><th className="p-2 font-medium">{t.thProject}</th><th className="p-2 font-medium">{t.thShare}</th><th className="p-2 font-medium">{t.thStatus}</th></tr>
            </thead>
            <tbody>
              {data.pendingProjects.map((p: any) => (
                <tr key={p.projectId} className="border-t">
                  <td className="p-2"><Link href={`/projects/${p.projectId}`} className="text-primary hover:underline">{p.projectName}</Link></td>
                  <td className="p-2">{p.sharePct}%</td>
                  <td className="p-2 text-neutral-500">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-xs text-neutral-400 border-t">{t.pendingNote}</p>
        </div>
      )}
    </AppShell>
  );
}
