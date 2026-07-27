"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X } from "lucide-react";

const categoryLabels: Record<string, { ar: string; en: string }> = {
  OFFICE_RENT: { ar: "إيجار المكتب", en: "Office Rent" },
  TRANSPORTATION: { ar: "الانتقالات", en: "Transportation" },
  WATER: { ar: "فواتير المياه", en: "Water Bill" },
  ELECTRICITY: { ar: "فواتير الكهرباء", en: "Electricity Bill" },
  PHONE: { ar: "فواتير التليفون", en: "Phone Bill" },
  EMAIL_INTERNET: { ar: "اشتراكات الإيميل والإنترنت", en: "Email & Internet Subscriptions" },
  BUFFET: { ar: "البوفيه", en: "Buffet" },
  OTHER: { ar: "أخرى", en: "Other" },
};

const dict = {
  ar: {
    title: "مصروفات المكتب الرئيسي", newExpense: "مصروف جديد", cancel: "إلغاء",
    category: "البند", amount: "القيمة *", date: "التاريخ", description: "وصف إضافي",
    save: "حفظ وتوزيع تلقائي", saving: "جارٍ الحفظ والتوزيع...", err: "تعذر تسجيل المصروف",
    thCategory: "البند", thAmount: "القيمة", thDate: "التاريخ", thDistribution: "توزيعه على المشاريع",
    loading: "جارٍ التحميل...", empty: "لا يوجد مصروفات مكتب رئيسي مسجلة بعد.",
    note: "أي مصروف بتسجله هنا بيتوزع تلقائيًا كمصروف على كل المشاريع المفتوحة (الجارية) حسب نسبة قيمة كل مشروع من إجمالي قيمة المشاريع المفتوحة وقت التسجيل.",
  },
  en: {
    title: "Head Office Expenses", newExpense: "New Expense", cancel: "Cancel",
    category: "Category", amount: "Amount *", date: "Date", description: "Additional Description",
    save: "Save & Auto-Distribute", saving: "Saving & distributing...", err: "Failed to record expense",
    thCategory: "Category", thAmount: "Amount", thDate: "Date", thDistribution: "Distributed To",
    loading: "Loading...", empty: "No head office expenses recorded yet.",
    note: "Any expense recorded here is automatically distributed as an expense across all open (ongoing) projects, proportional to each project's contract value at the time of recording.",
  },
};

export default function HeadOfficeExpensesPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "OFFICE_RENT", amount: 0, date: "", description: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/head-office-expenses");
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/head-office-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? t.err);
    setForm({ category: "OFFICE_RENT", amount: 0, date: "", description: "" });
    setShowForm(false);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newExpense}
        </button>
      }
    >
      <p className="text-xs text-neutral-400">{t.note}</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.category}</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.amount}</label>
            <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.date}</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.description}</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-4">{error}</p>}
          <div className="lg:col-span-4">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading && <p className="text-sm text-neutral-400">{t.loading}</p>}
        {!loading && expenses.length === 0 && <p className="text-sm text-neutral-400">{t.empty}</p>}
        {expenses.map((exp) => (
          <div key={exp.id} className="card !p-0 overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{categoryLabels[exp.category]?.[locale]}</p>
                <p className="text-xs text-neutral-400">{exp.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{Number(exp.amount).toLocaleString(localeCode)} {currency}</p>
                <p className="text-xs text-neutral-400">{new Date(exp.date).toLocaleDateString(localeCode)}</p>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-neutral-500 mb-2">{t.thDistribution}:</p>
              <div className="flex flex-wrap gap-2">
                {exp.distributedExpenses.map((d: any) => (
                  <span key={d.id} className="text-xs bg-neutral-50 border rounded-full px-3 py-1">
                    {d.project.name}: <span className="font-medium">{Number(d.amount).toLocaleString(localeCode)} {currency}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
