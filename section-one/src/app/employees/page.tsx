"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", jobTitle: "", department: "", phone: "", hireDate: "", baseSalary: 0 });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/employees");
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError("تعذر حفظ الموظف");
    setForm({ name: "", jobTitle: "", department: "", phone: "", hireDate: "", baseSalary: 0 });
    setShowForm(false);
    load();
  }

  async function toggleActive(emp: any) {
    await fetch(`/api/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !emp.isActive }),
    });
    load();
  }

  return (
    <AppShell
      title="الموظفون"
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "إلغاء" : "موظف جديد"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input required placeholder="اسم الموظف" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder="المسمى الوظيفي" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder="القسم" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border rounded-xl px-3 py-2" />
          <div>
            <label className="text-sm text-neutral-600 block mb-1">تاريخ التعيين *</label>
            <input required type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">الراتب الأساسي *</label>
            <input required type="number" step="0.01" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium lg:col-span-3">حفظ الموظف</button>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">الاسم</th>
              <th className="p-3 font-medium">المسمى الوظيفي</th>
              <th className="p-3 font-medium">القسم</th>
              <th className="p-3 font-medium">الراتب الأساسي</th>
              <th className="p-3 font-medium">الحالة</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>جارٍ التحميل...</td></tr>}
            {!loading && employees.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={6}>لا يوجد موظفون بعد.</td></tr>}
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3">{e.jobTitle}</td>
                <td className="p-3">{e.department || "—"}</td>
                <td className="p-3">{Number(e.baseSalary).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${e.isActive ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-500"}`}>
                    {e.isActive ? "نشط" : "معطّل"}
                  </span>
                </td>
                <td className="p-3"><button onClick={() => toggleActive(e)} className="text-primary text-xs">{e.isActive ? "تعطيل" : "تفعيل"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
