"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X } from "lucide-react";

const statusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  APPROVED: { ar: "معتمد", en: "Approved" },
  PAID: { ar: "مصروف", en: "Paid" },
};
const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  APPROVED: "bg-primary/10 text-primary",
  PAID: "bg-success/10 text-success",
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const dict = {
  ar: {
    title: "الرواتب", generate: "توليد راتب",
    employee: "الموظف *", chooseEmployee: "اختر الموظف", allowances: "بدلات",
    extraDeductions: "خصومات إضافية (تأمينات/ضريبة)",
    note: "خصم الغياب هيتحسب تلقائيًا من سجلات الحضور للشهر ده ويتضاف على الخصومات دي.",
    calculating: "جارٍ الحساب...", generateSalary: "توليد الراتب", err: "تعذر توليد الراتب", errAction: "تعذر تنفيذ الإجراء",
    thEmployee: "الموظف", thBase: "الأساسي", thAllowances: "البدلات", thDeductions: "الخصومات",
    thNet: "الصافي", thStatus: "الحالة", loading: "جارٍ التحميل...", empty: "لا يوجد رواتب مسجلة لهذا الشهر.",
    approve: "اعتماد", pay: "صرف", totalNet: "إجمالي صافي الرواتب",
  },
  en: {
    title: "Payroll", generate: "Generate Salary",
    employee: "Employee *", chooseEmployee: "Choose employee", allowances: "Allowances",
    extraDeductions: "Extra Deductions (insurance/tax)",
    note: "Absence deduction is calculated automatically from this month's attendance records and added to these deductions.",
    calculating: "Calculating...", generateSalary: "Generate Salary", err: "Failed to generate salary", errAction: "Action failed",
    thEmployee: "Employee", thBase: "Base", thAllowances: "Allowances", thDeductions: "Deductions",
    thNet: "Net", thStatus: "Status", loading: "Loading...", empty: "No salaries recorded for this month.",
    approve: "Approve", pay: "Pay", totalNet: "Total Net Salaries",
  },
};

export default function PayrollPage() {
  const locale = useLocale();
  const t = dict[locale];
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
    if (!res.ok) return setError((await res.json()).error ?? t.err);
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
    if (!res.ok) return alert((await res.json()).error ?? t.errAction);
    load();
  }

  const totalNet = records.reduce((s, r) => s + Number(r.netSalary), 0);
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  return (
    <AppShell
      title={t.title}
      action={
        <div className="flex gap-2 items-center">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
          <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            {showForm ? <X size={16} /> : <Plus size={16} />} {t.generate}
          </button>
        </div>
      }
    >
      {showForm && (
        <form onSubmit={generate} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.employee}</label>
            <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseEmployee}</option>
              {employees.filter((e) => e.isActive).map((e) => <option key={e.id} value={e.id}>{e.name} ({Number(e.baseSalary).toLocaleString(localeCode)} {currency})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.allowances}</label>
            <input type="number" step="0.01" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.extraDeductions}</label>
            <input type="number" step="0.01" value={form.extraDeductions} onChange={(e) => setForm({ ...form, extraDeductions: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <p className="text-xs text-neutral-400 sm:col-span-3">{t.note}</p>
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-3">
            {saving ? t.calculating : t.generateSalary}
          </button>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thEmployee}</th>
              <th className="p-3 font-medium">{t.thBase}</th>
              <th className="p-3 font-medium">{t.thAllowances}</th>
              <th className="p-3 font-medium">{t.thDeductions}</th>
              <th className="p-3 font-medium">{t.thNet}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={7}>{t.loading}</td></tr>}
            {!loading && records.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={7}>{t.empty}</td></tr>}
            {records.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.employee.name}</td>
                <td className="p-3">{Number(r.baseSalary).toLocaleString(localeCode)}</td>
                <td className="p-3">{Number(r.allowances).toLocaleString(localeCode)}</td>
                <td className="p-3">{Number(r.deductions).toLocaleString(localeCode)}</td>
                <td className="p-3 font-semibold">{Number(r.netSalary).toLocaleString(localeCode)}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[r.status]}`}>{statusLabels[r.status][locale]}</span></td>
                <td className="p-3">
                  {r.status === "DRAFT" && <button onClick={() => transition(r.id, "APPROVED")} className="text-primary text-xs">{t.approve}</button>}
                  {r.status === "APPROVED" && <button onClick={() => transition(r.id, "PAID")} className="text-success text-xs">{t.pay}</button>}
                </td>
              </tr>
            ))}
          </tbody>
          {records.length > 0 && (
            <tfoot><tr className="border-t bg-neutral-50 font-semibold"><td className="p-3" colSpan={4}>{t.totalNet}</td><td className="p-3">{totalNet.toLocaleString(localeCode)} {currency}</td><td colSpan={2} /></tr></tfoot>
          )}
        </table>
      </div>
    </AppShell>
  );
}
