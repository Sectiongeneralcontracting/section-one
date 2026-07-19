"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X } from "lucide-react";

const statusLabels: Record<string, string> = { DRAFT: "مسودة", APPROVED: "معتمد", PAID: "مصروف" };
const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  APPROVED: "bg-primary/10 text-primary",
  PAID: "bg-success/10 text-success",
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ employeeId: "", allowances: 0, extraDeductions: 0 });

  async function load() {
    setLoading(true);
    const [eRes, rRes] = await Promise.all([fetch("/api/employees"), fetch(`/api/payroll?month=${month}`)]);
    if (eRes.ok) setEmployees(await eRes.json());
    if (rRes.ok) setRecords(await rRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [month]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? "تعذر توليد الراتب");
    setForm({ employeeId: "", allowances: 0, extraDeductions: 0 });
    setShowForm(false);
    load();
  }

  async function transition(id: string, status: string) {
    const res = await fetch(`/api/payroll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر تنفيذ الإجراء");
    load();
  }

  const totalNet = records.reduce((s, r) => s + Number(r.netSalary), 0);

  return (
    <AppShell
      title="الرواتب"
      action={
        <div className="flex gap-2 items-center">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
          <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            {showForm ? <X size={16} /> : <Plus size={16} />} توليد راتب
          </button>
        </div>
      }
    >
      {showForm && (
        <form onSubmit={generate} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">الموظف *</label>
            <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">اختر الموظف</option>
              {employees.filter((e) => e.isActive).map((e) => <option key={e.id} value={e.id}>{e.name} ({Number(e.baseSalary).toLocaleString("ar-EG")} ج.م)</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">بدلات</label>
            <input type="number" step="0.01" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">خصومات إضافية (تأمينات/ضريبة)</label>
            <input type="number" step="0.01" value={form.extraDeductions} onChange={(e) => setForm({ ...form, extraDeductions: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <p className="text-xs text-neutral-400 sm:col-span-3">خصم الغياب هيتحسب تلقائيًا من سجلات الحضور للشهر ده ويتضاف على الخصومات دي.</p>
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-3">
            {saving ? "جارٍ الحساب..." : "توليد الراتب"}
          </button>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">الموظف</th>
              <th className="p-3 font-medium">الأساسي</th>
              <th className="p-3 font-medium">البدلات</th>
              <th className="p-3 font-medium">الخصومات</th>
              <th className="p-3 font-medium">الصافي</th>
              <th className="p-3 font-medium">الحالة</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={7}>جارٍ التحميل...</td></tr>}
            {!loading && records.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={7}>لا يوجد رواتب مسجلة لهذا الشهر.</td></tr>}
            {records.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.employee.name}</td>
                <td className="p-3">{Number(r.baseSalary).toLocaleString("ar-EG")}</td>
                <td className="p-3">{Number(r.allowances).toLocaleString("ar-EG")}</td>
                <td className="p-3">{Number(r.deductions).toLocaleString("ar-EG")}</td>
                <td className="p-3 font-semibold">{Number(r.netSalary).toLocaleString("ar-EG")}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[r.status]}`}>{statusLabels[r.status]}</span></td>
                <td className="p-3">
                  {r.status === "DRAFT" && <button onClick={() => transition(r.id, "APPROVED")} className="text-primary text-xs">اعتماد</button>}
                  {r.status === "APPROVED" && <button onClick={() => transition(r.id, "PAID")} className="text-success text-xs">صرف</button>}
                </td>
              </tr>
            ))}
          </tbody>
          {records.length > 0 && (
            <tfoot><tr className="border-t bg-neutral-50 font-semibold"><td className="p-3" colSpan={4}>إجمالي صافي الرواتب</td><td className="p-3">{totalNet.toLocaleString("ar-EG")} ج.م</td><td colSpan={2} /></tr></tfoot>
          )}
        </table>
      </div>
    </AppShell>
  );
}
