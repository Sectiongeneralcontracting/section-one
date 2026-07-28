"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const dict = {
  ar: {
    title: "جزاءات الموظفين", newPenalty: "جزاء جديد", cancel: "إلغاء",
    employee: "الموظف *", chooseEmployee: "اختر الموظف", amount: "القيمة *", date: "التاريخ",
    reason: "السبب *", save: "حفظ الجزاء", saving: "جارٍ الحفظ...", err: "تعذر تسجيل الجزاء",
    thEmployee: "الموظف", thAmount: "القيمة", thDate: "التاريخ", thReason: "السبب",
    loading: "جارٍ التحميل...", empty: "لا يوجد جزاءات مسجلة بعد.",
    note: "الجزاءات المسجلة خلال الشهر بتتخصم تلقائيًا وقت توليد راتب الموظف عن نفس الشهر.",
    confirmDelete: "تأكيد حذف الجزاء؟", errDelete: "تعذر الحذف",
  },
  en: {
    title: "Employee Penalties", newPenalty: "New Penalty", cancel: "Cancel",
    employee: "Employee *", chooseEmployee: "Choose employee", amount: "Amount *", date: "Date",
    reason: "Reason *", save: "Save Penalty", saving: "Saving...", err: "Failed to record penalty",
    thEmployee: "Employee", thAmount: "Amount", thDate: "Date", thReason: "Reason",
    loading: "Loading...", empty: "No penalties recorded yet.",
    note: "Penalties recorded within a month are automatically deducted when generating that month's payroll.",
    confirmDelete: "Confirm deleting this penalty?", errDelete: "Failed to delete",
  },
};

export default function PenaltiesPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const [penalties, setPenalties] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ employeeId: "", amount: 0, date: "", reason: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: 0, date: "", reason: "" });

  async function load() {
    setLoading(true);
    const [pRes, eRes] = await Promise.all([fetch("/api/employee-penalties"), fetch("/api/employees")]);
    if (pRes.ok) setPenalties(await pRes.json());
    if (eRes.ok) setEmployees(await eRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/employee-penalties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError(t.err);
    setForm({ employeeId: "", amount: 0, date: "", reason: "" });
    setShowForm(false);
    load();
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setEditForm({ amount: Number(p.amount), date: new Date(p.date).toISOString().slice(0, 10), reason: p.reason ?? "" });
  }

  async function saveEdited(penaltyId: string) {
    const res = await fetch(`/api/employee-penalties/${penaltyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    setEditingId(null);
    load();
  }

  async function removePenalty(penaltyId: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/employee-penalties/${penaltyId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newPenalty}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.employee}</label>
            <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseEmployee}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
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
            <label className="text-sm text-neutral-600 block mb-1">{t.reason}</label>
            <input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-4">{error}</p>}
          <div className="lg:col-span-4">
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
              <th className="p-3 font-medium">{t.thEmployee}</th>
              <th className="p-3 font-medium">{t.thAmount}</th>
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thReason}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.loading}</td></tr>}
            {!loading && penalties.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.empty}</td></tr>}
            {penalties.map((p) =>
              editingId === p.id ? (
                <tr key={p.id} className="border-t bg-neutral-50">
                  <td className="p-2 font-medium">{p.employee.name}</td>
                  <td className="p-2"><input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEdited(p.id)} className="text-success text-xs">{locale === "ar" ? "حفظ" : "Save"}</button>
                    <button onClick={() => setEditingId(null)} className="text-neutral-500 text-xs">{t.cancel}</button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.employee.name}</td>
                  <td className="p-3 text-danger">{Number(p.amount).toLocaleString(localeCode)} {currency}</td>
                  <td className="p-3">{new Date(p.date).toLocaleDateString(localeCode)}</td>
                  <td className="p-3">{p.reason}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => removePenalty(p.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">{t.note}</p>
    </AppShell>
  );
}
