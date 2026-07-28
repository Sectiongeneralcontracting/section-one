"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X } from "lucide-react";

const dict = {
  ar: {
    title: "الموظفون", newEmployee: "موظف جديد", cancel: "إلغاء",
    name: "اسم الموظف", jobTitle: "المسمى الوظيفي", department: "القسم", phone: "رقم الهاتف",
    hireDate: "تاريخ التعيين *", baseSalary: "الراتب الأساسي *", save: "حفظ الموظف",
    err: "تعذر حفظ الموظف",
    thName: "الاسم", thJobTitle: "المسمى الوظيفي", thDepartment: "القسم", thSalary: "الراتب الأساسي",
    thAssignment: "التخصيص", thStatus: "الحالة", loading: "جارٍ التحميل...", empty: "لا يوجد موظفون بعد.",
    active: "نشط", inactive: "معطّل", enable: "تفعيل", disable: "تعطيل",
    bankName: "اسم البنك", bankAccount: "رقم الحساب البنكي",
    assignment: "التخصيص", headOffice: "المكتب الرئيسي (يوزّع على المشاريع المفتوحة)", changeAssignment: "تغيير",
    thUser: "حساب الدخول (للحضور الذاتي)", noUser: "غير مربوط", unlink: "إلغاء الربط",
  },
  en: {
    title: "Employees", newEmployee: "New Employee", cancel: "Cancel",
    name: "Employee Name", jobTitle: "Job Title", department: "Department", phone: "Phone",
    hireDate: "Hire Date *", baseSalary: "Base Salary *", save: "Save Employee",
    err: "Failed to save employee",
    thName: "Name", thJobTitle: "Job Title", thDepartment: "Department", thSalary: "Base Salary",
    thAssignment: "Assignment", thStatus: "Status", loading: "Loading...", empty: "No employees yet.",
    active: "Active", inactive: "Inactive", enable: "Enable", disable: "Disable",
    bankName: "Bank Name", bankAccount: "Bank Account Number",
    assignment: "Assignment", headOffice: "Head Office (distributed across open projects)", changeAssignment: "Change",
    thUser: "Login Account (for self check-in)", noUser: "Not linked", unlink: "Unlink",
  },
};

export default function EmployeesPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", jobTitle: "", department: "", phone: "", hireDate: "", baseSalary: 0, bankName: "", bankAccountNumber: "", projectId: "" });
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userLinkError, setUserLinkError] = useState("");

  async function load() {
    setLoading(true);
    const [eRes, pRes, uRes] = await Promise.all([fetch("/api/employees"), fetch("/api/projects"), fetch("/api/users")]);
    if (eRes.ok) setEmployees(await eRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    if (uRes.ok) setUsers(await uRes.json());
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
      body: JSON.stringify({ ...form, projectId: form.projectId || null }),
    });
    setSaving(false);
    if (!res.ok) return setError(t.err);
    setForm({ name: "", jobTitle: "", department: "", phone: "", hireDate: "", baseSalary: 0, bankName: "", bankAccountNumber: "", projectId: "" });
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

  async function updateAssignment(empId: string, projectId: string) {
    await fetch(`/api/employees/${empId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: projectId || null }),
    });
    setEditingAssignment(null);
    load();
  }

  async function updateUserLink(empId: string, userId: string) {
    setUserLinkError("");
    const res = await fetch(`/api/employees/${empId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId || null }),
    });
    if (!res.ok) {
      setUserLinkError((await res.json()).error ?? t.err);
      return;
    }
    setEditingUser(null);
    load();
  }

  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const activeProjects = projects.filter((p) => p.status !== "CLOSED");

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newEmployee}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input required placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder={t.jobTitle} value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.department} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border rounded-xl px-3 py-2" />
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.hireDate}</label>
            <input required type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.baseSalary}</label>
            <input required type="number" step="0.01" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.bankName}</label>
            <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.bankAccount}</label>
            <input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.assignment}</label>
            <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.headOffice}</option>
              {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium lg:col-span-3">{t.save}</button>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thName}</th>
              <th className="p-3 font-medium">{t.thJobTitle}</th>
              <th className="p-3 font-medium">{t.thDepartment}</th>
              <th className="p-3 font-medium">{t.thSalary}</th>
              <th className="p-3 font-medium">{t.thAssignment}</th>
              <th className="p-3 font-medium">{t.thUser}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={8}>{t.loading}</td></tr>}
            {!loading && employees.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={8}>{t.empty}</td></tr>}
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3">{e.jobTitle}</td>
                <td className="p-3">{e.department || "—"}</td>
                <td className="p-3">{Number(e.baseSalary).toLocaleString(localeCode)} {currency}</td>
                <td className="p-3">
                  {editingAssignment === e.id ? (
                    <select
                      autoFocus
                      defaultValue={e.projectId ?? ""}
                      onChange={(ev) => updateAssignment(e.id, ev.target.value)}
                      onBlur={() => setEditingAssignment(null)}
                      className="border rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="">{t.headOffice}</option>
                      {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  ) : (
                    <button onClick={() => setEditingAssignment(e.id)} className="text-xs text-primary hover:underline text-right">
                      {e.project ? e.project.name : t.headOffice.split(" (")[0]}
                    </button>
                  )}
                </td>
                <td className="p-3">
                  {editingUser === e.id ? (
                    <div>
                      <select
                        autoFocus
                        defaultValue={e.userId ?? ""}
                        onChange={(ev) => updateUserLink(e.id, ev.target.value)}
                        onBlur={() => setEditingUser(null)}
                        className="border rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="">{t.noUser}</option>
                        {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                      </select>
                      {userLinkError && <p className="text-danger text-xs mt-1">{userLinkError}</p>}
                    </div>
                  ) : (
                    <button onClick={() => setEditingUser(e.id)} className="text-xs text-primary hover:underline text-right">
                      {e.user ? e.user.name : t.noUser}
                    </button>
                  )}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${e.isActive ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-500"}`}>
                    {e.isActive ? t.active : t.inactive}
                  </span>
                </td>
                <td className="p-3"><button onClick={() => toggleActive(e)} className="text-primary text-xs">{e.isActive ? t.disable : t.enable}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
