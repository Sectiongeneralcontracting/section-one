"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, HandCoins, Pencil, Trash2 } from "lucide-react";

type Partner = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  defaultShare: string;
  contributions: { amount: string }[];
};

const dict = {
  ar: {
    title: "الشركاء", recordContribution: "تسجيل مساهمة", newPartner: "شريك جديد", cancel: "إلغاء",
    editTitle: "تعديل بيانات الشريك", newTitle: "شريك جديد",
    name: "اسم الشريك *", phone: "رقم الهاتف", email: "البريد الإلكتروني", share: "النسبة الافتراضية %",
    save: "حفظ الشريك", saveEdit: "حفظ التعديلات", saving: "جارٍ الحفظ...",
    err: "تعذر حفظ الشريك — تأكد من البيانات (Admin فقط)", confirmDelete: "تأكيد حذف الشريك؟",
    partner: "الشريك *", choosePartner: "اختر الشريك", amount: "القيمة *", notes: "ملاحظات",
    saveContribution: "حفظ المساهمة", errContribution: "تعذر تسجيل المساهمة",
    thName: "اسم الشريك", thPhone: "الهاتف", thShare: "النسبة الافتراضية", thTotal: "إجمالي المساهمات",
    loading: "جارٍ التحميل...", empty: "لا يوجد شركاء بعد.",
  },
  en: {
    title: "Partners", recordContribution: "Record Contribution", newPartner: "New Partner", cancel: "Cancel",
    editTitle: "Edit Partner", newTitle: "New Partner",
    name: "Partner Name *", phone: "Phone", email: "Email", share: "Default Share %",
    save: "Save Partner", saveEdit: "Save Changes", saving: "Saving...",
    err: "Failed to save partner — check the data (Admin only)", confirmDelete: "Confirm partner deletion?",
    partner: "Partner *", choosePartner: "Choose partner", amount: "Amount *", notes: "Notes",
    saveContribution: "Save Contribution", errContribution: "Failed to record contribution",
    thName: "Partner Name", thPhone: "Phone", thShare: "Default Share", thTotal: "Total Contributions",
    loading: "Loading...", empty: "No partners yet.",
  },
};

export default function PartnersPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<"none" | "partner" | "contribution">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [partnerForm, setPartnerForm] = useState({ name: "", phone: "", email: "", defaultShare: 0 });
  const [contribForm, setContribForm] = useState({ partnerId: "", amount: 0, notes: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/partners");
    if (res.ok) setPartners(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(p: Partner) {
    setEditingId(p.id);
    setPartnerForm({ name: p.name, phone: p.phone ?? "", email: p.email ?? "", defaultShare: Number(p.defaultShare) });
    setShowForm("partner");
  }

  async function submitPartner(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(editingId ? `/api/partners/${editingId}` : "/api/partners", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...partnerForm, defaultShare: Number(partnerForm.defaultShare) }),
    });
    setSaving(false);
    if (!res.ok) return setError(t.err);
    setPartnerForm({ name: "", phone: "", email: "", defaultShare: 0 });
    setEditingId(null);
    setShowForm("none");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/partners/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.err);
    load();
  }

  async function submitContribution(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/partner-contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contribForm, amount: Number(contribForm.amount) }),
    });
    setSaving(false);
    if (!res.ok) return setError(t.errContribution);
    setContribForm({ partnerId: "", amount: 0, notes: "" });
    setShowForm("none");
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(showForm === "contribution" ? "none" : "contribution")}
            className="bg-secondary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <HandCoins size={16} /> {t.recordContribution}
          </button>
          <button
            onClick={() => { setEditingId(null); setPartnerForm({ name: "", phone: "", email: "", defaultShare: 0 }); setShowForm(showForm === "partner" ? "none" : "partner"); }}
            className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            {showForm === "partner" && !editingId ? <X size={16} /> : <Plus size={16} />}
            {t.newPartner}
          </button>
        </div>
      }
    >
      {showForm === "partner" && (
        <form onSubmit={submitPartner} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p className="sm:col-span-2 font-semibold text-sm text-neutral-600">{editingId ? t.editTitle : t.newTitle}</p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.name}</label>
            <input required value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.phone}</label>
            <input value={partnerForm.phone} onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.email}</label>
            <input type="email" value={partnerForm.email} onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.share}</label>
            <input type="number" step="0.01" value={partnerForm.defaultShare} onChange={(e) => setPartnerForm({ ...partnerForm, defaultShare: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : editingId ? t.saveEdit : t.save}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setShowForm("none"); }} className="text-sm px-4 py-2 rounded-xl border">{t.cancel}</button>
            )}
          </div>
        </form>
      )}

      {showForm === "contribution" && (
        <form onSubmit={submitContribution} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.partner}</label>
            <select required value={contribForm.partnerId} onChange={(e) => setContribForm({ ...contribForm, partnerId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.choosePartner}</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.amount}</label>
            <input required type="number" step="0.01" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={contribForm.notes} onChange={(e) => setContribForm({ ...contribForm, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button disabled={saving} className="bg-secondary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.saveContribution}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thName}</th>
              <th className="p-3 font-medium">{t.thPhone}</th>
              <th className="p-3 font-medium">{t.thShare}</th>
              <th className="p-3 font-medium">{t.thTotal}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.loading}</td></tr>}
            {!loading && partners.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.empty}</td></tr>
            )}
            {partners.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium"><Link href={`/partners/${p.id}`} className="text-primary hover:underline">{p.name}</Link></td>
                <td className="p-3">{p.phone || "—"}</td>
                <td className="p-3">{Number(p.defaultShare)}%</td>
                <td className="p-3">
                  {p.contributions.reduce((s, c) => s + Number(c.amount), 0).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")} {locale === "ar" ? "ج.م" : "EGP"}
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-primary hover:opacity-70"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-danger hover:opacity-70"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
