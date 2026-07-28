"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const dict = {
  ar: {
    title: "مقاولو الباطن", newSub: "مقاول باطن جديد", cancel: "إلغاء",
    editTitle: "تعديل بيانات المقاول", newTitle: "مقاول باطن جديد",
    name: "الاسم *", specialty: "التخصص", phone: "الهاتف", email: "البريد الإلكتروني",
    taxNumber: "الرقم الضريبي", address: "العنوان", save: "حفظ", saveEdit: "حفظ التعديلات", saving: "جارٍ الحفظ...", err: "تعذر الحفظ",
    confirmDelete: "تأكيد حذف المقاول نهائيًا؟ العملية لا يمكن التراجع عنها.", errDelete: "تعذر الحذف — لو المقاول له عقود مسجلة مش هيتحذف",
    thName: "الاسم", thSpecialty: "التخصص", thContracts: "عدد العقود", thPaid: "إجمالي المدفوع", thRating: "متوسط التقييم",
    loading: "جارٍ التحميل...", empty: "لا يوجد مقاولو باطن مسجلين بعد.",
  },
  en: {
    title: "Subcontractors", newSub: "New Subcontractor", cancel: "Cancel",
    editTitle: "Edit Subcontractor", newTitle: "New Subcontractor",
    name: "Name *", specialty: "Specialty", phone: "Phone", email: "Email",
    taxNumber: "Tax Number", address: "Address", save: "Save", saveEdit: "Save Changes", saving: "Saving...", err: "Failed to save",
    confirmDelete: "Confirm permanently deleting this subcontractor? This cannot be undone.", errDelete: "Failed to delete — cannot delete if the subcontractor has registered contracts",
    thName: "Name", thSpecialty: "Specialty", thContracts: "Contracts", thPaid: "Total Paid", thRating: "Avg. Rating",
    loading: "Loading...", empty: "No subcontractors registered yet.",
  },
};

const emptyForm = { name: "", specialty: "", phone: "", email: "", taxNumber: "", address: "" };

export default function ContractorsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/subcontractors");
    if (res.ok) setSubs(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm((v) => !v || editingId !== null);
  }

  function startEdit(s: any) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      specialty: s.specialty ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      taxNumber: s.taxNumber ?? "",
      address: s.address ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(editingId ? `/api/subcontractors/${editingId}` : "/api/subcontractors", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError(t.err);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  }

  async function removeSubcontractor(subId: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/subcontractors/${subId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={startNew} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
          {showForm && !editingId ? t.cancel : t.newSub}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <p className="lg:col-span-3 font-semibold text-sm text-neutral-600">{editingId ? t.editTitle : t.newTitle}</p>
          <input required placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.specialty} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.email} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.taxNumber} value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.address} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border rounded-xl px-3 py-2" />
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3 flex gap-2">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium">{saving ? t.saving : editingId ? t.saveEdit : t.save}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} className="text-sm px-4 py-2 rounded-xl border">
                {t.cancel}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thName}</th>
              <th className="p-3 font-medium">{t.thSpecialty}</th>
              <th className="p-3 font-medium">{t.thContracts}</th>
              <th className="p-3 font-medium">{t.thPaid}</th>
              <th className="p-3 font-medium">{t.thRating}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.loading}</td></tr>}
            {!loading && subs.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.empty}</td></tr>}
            {subs.map((s) => {
              const totalPaid = s.contracts.reduce((sum: number, c: any) => sum + c.payments.reduce((x: number, p: any) => x + Number(p.amount), 0), 0);
              const avgRating = s.evaluations.length
                ? (s.evaluations.reduce((sum: number, e: any) => sum + (e.qualityScore + e.timelinessScore + e.safetyScore) / 3, 0) / s.evaluations.length).toFixed(1)
                : "—";
              return (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-medium"><Link href={`/contractors/${s.id}`} className="text-primary hover:underline">{s.name}</Link></td>
                  <td className="p-3">{s.specialty || "—"}</td>
                  <td className="p-3">{s.contracts.length}</td>
                  <td className="p-3">{totalPaid.toLocaleString(localeCode)} {currency}</td>
                  <td className="p-3">{avgRating} / 5</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEdit(s)} className="text-primary hover:opacity-70"><Pencil size={15} /></button>
                    <button onClick={() => removeSubcontractor(s.id)} className="text-danger hover:opacity-70"><Trash2 size={15} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
