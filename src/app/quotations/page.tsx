"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X } from "lucide-react";

const statusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  SENT: { ar: "مُرسل للعميل", en: "Sent to Client" },
  ACCEPTED: { ar: "مقبول", en: "Accepted" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
  CONVERTED: { ar: "تم تحويله لعقد", en: "Converted" },
};
const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  SENT: "bg-secondary/10 text-secondary",
  ACCEPTED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
  CONVERTED: "bg-primary/10 text-primary",
};

const dict = {
  ar: {
    title: "عروض الأسعار", newQuotation: "عرض سعر جديد", cancel: "إلغاء",
    client: "العميل *", chooseClient: "اختر العميل", projectName: "اسم المشروع المقترح *",
    date: "التاريخ", validUntil: "صالح حتى", notes: "ملاحظات",
    save: "حفظ عرض السعر", saving: "جارٍ الحفظ...", err: "تعذر حفظ عرض السعر",
    thNumber: "الرقم", thClient: "العميل", thProject: "المشروع المقترح", thValue: "القيمة", thStatus: "الحالة", thConverted: "المشروع الناتج",
    loading: "جارٍ التحميل...", empty: "لا يوجد عروض أسعار مسجلة بعد.",
  },
  en: {
    title: "Quotations", newQuotation: "New Quotation", cancel: "Cancel",
    client: "Client *", chooseClient: "Choose client", projectName: "Proposed Project Name *",
    date: "Date", validUntil: "Valid Until", notes: "Notes",
    save: "Save Quotation", saving: "Saving...", err: "Failed to save quotation",
    thNumber: "Number", thClient: "Client", thProject: "Proposed Project", thValue: "Value", thStatus: "Status", thConverted: "Resulting Project",
    loading: "Loading...", empty: "No quotations recorded yet.",
  },
};

export default function QuotationsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const [quotations, setQuotations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ clientId: "", projectName: "", date: "", validUntil: "", notes: "" });

  async function load() {
    setLoading(true);
    const [qRes, cRes] = await Promise.all([fetch("/api/quotations"), fetch("/api/clients")]);
    if (qRes.ok) setQuotations(await qRes.json());
    if (cRes.ok) setClients(await cRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? t.err);
    const data = await res.json();
    setForm({ clientId: "", projectName: "", date: "", validUntil: "", notes: "" });
    setShowForm(false);
    window.location.href = `/quotations/${data.id}`;
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newQuotation}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.client}</label>
            <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseClient}</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.projectName}</label>
            <input required value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.date}</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.validUntil}</label>
            <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thNumber}</th>
              <th className="p-3 font-medium">{t.thClient}</th>
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium">{t.thValue}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium">{t.thConverted}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.loading}</td></tr>}
            {!loading && quotations.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.empty}</td></tr>}
            {quotations.map((q) => {
              const total = q.items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0);
              return (
                <tr key={q.id} className="border-t hover:bg-neutral-50">
                  <td className="p-3"><Link href={`/quotations/${q.id}`} className="text-primary hover:underline font-mono text-xs">{q.quotationNumber}</Link></td>
                  <td className="p-3 font-medium">{q.client.name}</td>
                  <td className="p-3">{q.projectName}</td>
                  <td className="p-3">{total.toLocaleString(localeCode)} {currency}</td>
                  <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[q.status]}`}>{statusLabels[q.status][locale]}</span></td>
                  <td className="p-3">{q.convertedProject ? <Link href={`/projects/${q.convertedProject.id}`} className="text-primary hover:underline text-xs">{q.convertedProject.name}</Link> : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
