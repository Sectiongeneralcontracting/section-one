"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X, HandCoins, Pencil, Trash2 } from "lucide-react";

type Partner = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  defaultShare: string;
  contributions: { amount: string }[];
};

export default function PartnersPage() {
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
    if (!res.ok) return setError("تعذر حفظ الشريك — تأكد من البيانات (Admin فقط)");
    setPartnerForm({ name: "", phone: "", email: "", defaultShare: 0 });
    setEditingId(null);
    setShowForm("none");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("تأكيد حذف الشريك؟")) return;
    const res = await fetch(`/api/partners/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر الحذف");
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
    if (!res.ok) return setError("تعذر تسجيل المساهمة");
    setContribForm({ partnerId: "", amount: 0, notes: "" });
    setShowForm("none");
    load();
  }

  return (
    <AppShell
      title="الشركاء"
      action={
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(showForm === "contribution" ? "none" : "contribution")}
            className="bg-secondary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <HandCoins size={16} /> تسجيل مساهمة
          </button>
          <button
            onClick={() => { setEditingId(null); setPartnerForm({ name: "", phone: "", email: "", defaultShare: 0 }); setShowForm(showForm === "partner" ? "none" : "partner"); }}
            className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            {showForm === "partner" && !editingId ? <X size={16} /> : <Plus size={16} />}
            شريك جديد
          </button>
        </div>
      }
    >
      {showForm === "partner" && (
        <form onSubmit={submitPartner} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p className="sm:col-span-2 font-semibold text-sm text-neutral-600">{editingId ? "تعديل بيانات الشريك" : "شريك جديد"}</p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">اسم الشريك *</label>
            <input required value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">رقم الهاتف</label>
            <input value={partnerForm.phone} onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">البريد الإلكتروني</label>
            <input type="email" value={partnerForm.email} onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">النسبة الافتراضية %</label>
            <input type="number" step="0.01" value={partnerForm.defaultShare} onChange={(e) => setPartnerForm({ ...partnerForm, defaultShare: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "حفظ الشريك"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setShowForm("none"); }} className="text-sm px-4 py-2 rounded-xl border">إلغاء</button>
            )}
          </div>
        </form>
      )}

      {showForm === "contribution" && (
        <form onSubmit={submitContribution} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">الشريك *</label>
            <select required value={contribForm.partnerId} onChange={(e) => setContribForm({ ...contribForm, partnerId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">اختر الشريك</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">القيمة *</label>
            <input required type="number" step="0.01" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">ملاحظات</label>
            <input value={contribForm.notes} onChange={(e) => setContribForm({ ...contribForm, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button disabled={saving} className="bg-secondary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحفظ..." : "حفظ المساهمة"}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">اسم الشريك</th>
              <th className="p-3 font-medium">الهاتف</th>
              <th className="p-3 font-medium">النسبة الافتراضية</th>
              <th className="p-3 font-medium">إجمالي المساهمات</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>جارٍ التحميل...</td></tr>}
            {!loading && partners.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={5}>لا يوجد شركاء بعد.</td></tr>
            )}
            {partners.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.phone || "—"}</td>
                <td className="p-3">{Number(p.defaultShare)}%</td>
                <td className="p-3">
                  {p.contributions.reduce((s, c) => s + Number(c.amount), 0).toLocaleString("ar-EG")} ج.م
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
