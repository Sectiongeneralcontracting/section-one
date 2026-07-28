"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const dict = {
  ar: {
    title: "عقود الموظفين", newContract: "عقد جديد", cancel: "إلغاء",
    employee: "الموظف *", chooseEmployee: "اختر الموظف", contractType: "نوع العقد *",
    contractTypePh: "دائم / مؤقت / تحت الاختبار...", startDate: "تاريخ البداية *", endDate: "تاريخ النهاية",
    salary: "الراتب في العقد *", notes: "ملاحظات", save: "حفظ العقد", saving: "جارٍ الحفظ...", err: "تعذر حفظ العقد",
    thEmployee: "الموظف", thType: "نوع العقد", thStart: "البداية", thEnd: "النهاية", thSalary: "الراتب",
    loading: "جارٍ التحميل...", empty: "لا يوجد عقود مسجلة بعد.", ongoing: "سارٍ",
    confirmDelete: "تأكيد حذف العقد؟", errDelete: "تعذر الحذف",
  },
  en: {
    title: "Employee Contracts", newContract: "New Contract", cancel: "Cancel",
    employee: "Employee *", chooseEmployee: "Choose employee", contractType: "Contract Type *",
    contractTypePh: "Permanent / Temporary / Probation...", startDate: "Start Date *", endDate: "End Date",
    salary: "Contract Salary *", notes: "Notes", save: "Save Contract", saving: "Saving...", err: "Failed to save contract",
    thEmployee: "Employee", thType: "Type", thStart: "Start", thEnd: "End", thSalary: "Salary",
    loading: "Loading...", empty: "No contracts recorded yet.", ongoing: "Ongoing",
    confirmDelete: "Confirm deleting this contract?", errDelete: "Failed to delete",
  },
};

export default function EmployeeContractsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ employeeId: "", contractType: "", startDate: "", endDate: "", salary: 0, notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ contractType: "", startDate: "", endDate: "", salary: 0, notes: "" });

  async function load() {
    setLoading(true);
    const [cRes, eRes] = await Promise.all([fetch("/api/employee-contracts"), fetch("/api/employees")]);
    if (cRes.ok) setContracts(await cRes.json());
    if (eRes.ok) setEmployees(await eRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/employee-contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError(t.err);
    setForm({ employeeId: "", contractType: "", startDate: "", endDate: "", salary: 0, notes: "" });
    setShowForm(false);
    load();
  }

  function startEdit(c: any) {
    setEditingId(c.id);
    setEditForm({
      contractType: c.contractType,
      startDate: new Date(c.startDate).toISOString().slice(0, 10),
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : "",
      salary: Number(c.salary),
      notes: c.notes ?? "",
    });
  }

  async function saveEdited(contractId: string) {
    const res = await fetch(`/api/employee-contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, endDate: editForm.endDate || null }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    setEditingId(null);
    load();
  }

  async function removeContract(contractId: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/employee-contracts/${contractId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newContract}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.employee}</label>
            <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseEmployee}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.contractType}</label>
            <input required value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} placeholder={t.contractTypePh} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.salary}</label>
            <input required type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.startDate}</label>
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.endDate}</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
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
              <th className="p-3 font-medium">{t.thEmployee}</th>
              <th className="p-3 font-medium">{t.thType}</th>
              <th className="p-3 font-medium">{t.thStart}</th>
              <th className="p-3 font-medium">{t.thEnd}</th>
              <th className="p-3 font-medium">{t.thSalary}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.loading}</td></tr>}
            {!loading && contracts.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.empty}</td></tr>}
            {contracts.map((c) =>
              editingId === c.id ? (
                <tr key={c.id} className="border-t bg-neutral-50">
                  <td className="p-2 font-medium">{c.employee.name}</td>
                  <td className="p-2"><input value={editForm.contractType} onChange={(e) => setEditForm({ ...editForm, contractType: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="number" step="0.01" value={editForm.salary} onChange={(e) => setEditForm({ ...editForm, salary: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEdited(c.id)} className="text-success text-xs">{locale === "ar" ? "حفظ" : "Save"}</button>
                    <button onClick={() => setEditingId(null)} className="text-neutral-500 text-xs">{t.cancel}</button>
                  </td>
                </tr>
              ) : (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.employee.name}</td>
                  <td className="p-3">{c.contractType}</td>
                  <td className="p-3">{new Date(c.startDate).toLocaleDateString(localeCode)}</td>
                  <td className="p-3">{c.endDate ? new Date(c.endDate).toLocaleDateString(localeCode) : t.ongoing}</td>
                  <td className="p-3">{Number(c.salary).toLocaleString(localeCode)} {currency}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEdit(c)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => removeContract(c.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
