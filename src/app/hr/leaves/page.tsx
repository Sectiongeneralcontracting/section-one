"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X } from "lucide-react";

const typeLabels: Record<string, { ar: string; en: string }> = {
  ANNUAL: { ar: "سنوية", en: "Annual" },
  SICK: { ar: "مرضية", en: "Sick" },
  UNPAID: { ar: "بدون راتب", en: "Unpaid" },
  OTHER: { ar: "أخرى", en: "Other" },
};
const statusLabels: Record<string, { ar: string; en: string }> = {
  PENDING: { ar: "معلّقة", en: "Pending" },
  APPROVED: { ar: "معتمدة", en: "Approved" },
  REJECTED: { ar: "مرفوضة", en: "Rejected" },
};
const statusStyles: Record<string, string> = {
  PENDING: "bg-secondary/10 text-secondary",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
};

const dict = {
  ar: {
    title: "إجازات الموظفين", newLeave: "طلب إجازة جديد", cancel: "إلغاء",
    employee: "الموظف *", chooseEmployee: "اختر الموظف", type: "نوع الإجازة",
    startDate: "من تاريخ *", endDate: "إلى تاريخ *", notes: "ملاحظات",
    save: "حفظ الطلب", saving: "جارٍ الحفظ...", err: "تعذر حفظ الطلب",
    thEmployee: "الموظف", thType: "النوع", thPeriod: "الفترة", thStatus: "الحالة",
    loading: "جارٍ التحميل...", empty: "لا يوجد طلبات إجازة بعد.", approve: "اعتماد", reject: "رفض",
  },
  en: {
    title: "Employee Leaves", newLeave: "New Leave Request", cancel: "Cancel",
    employee: "Employee *", chooseEmployee: "Choose employee", type: "Leave Type",
    startDate: "From *", endDate: "To *", notes: "Notes",
    save: "Save Request", saving: "Saving...", err: "Failed to save request",
    thEmployee: "Employee", thType: "Type", thPeriod: "Period", thStatus: "Status",
    loading: "Loading...", empty: "No leave requests yet.", approve: "Approve", reject: "Reject",
  },
};

export default function LeavesPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ employeeId: "", type: "ANNUAL", startDate: "", endDate: "", notes: "" });

  async function load() {
    setLoading(true);
    const [lRes, eRes] = await Promise.all([fetch("/api/leave-requests"), fetch("/api/employees")]);
    if (lRes.ok) setLeaves(await lRes.json());
    if (eRes.ok) setEmployees(await eRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError(t.err);
    setForm({ employeeId: "", type: "ANNUAL", startDate: "", endDate: "", notes: "" });
    setShowForm(false);
    load();
  }

  async function transition(leaveId: string, status: string) {
    const res = await fetch(`/api/leave-requests/${leaveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.err);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newLeave}
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
            <label className="text-sm text-neutral-600 block mb-1">{t.type}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.startDate}</label>
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.endDate}</label>
            <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
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
              <th className="p-3 font-medium">{t.thType}</th>
              <th className="p-3 font-medium">{t.thPeriod}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.loading}</td></tr>}
            {!loading && leaves.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.empty}</td></tr>}
            {leaves.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3 font-medium">{l.employee.name}</td>
                <td className="p-3">{typeLabels[l.type]?.[locale]}</td>
                <td className="p-3">{new Date(l.startDate).toLocaleDateString(localeCode)} - {new Date(l.endDate).toLocaleDateString(localeCode)}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[l.status]}`}>{statusLabels[l.status]?.[locale]}</span></td>
                <td className="p-3 flex gap-2">
                  {l.status === "PENDING" && (
                    <>
                      <button onClick={() => transition(l.id, "APPROVED")} className="text-success text-xs">{t.approve}</button>
                      <button onClick={() => transition(l.id, "REJECTED")} className="text-danger text-xs">{t.reject}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
