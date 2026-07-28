"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { resizeImageToDataUrl } from "@/lib/image-utils";
import { Plus, X, Pencil, Trash2, User as UserIcon } from "lucide-react";

const dict = {
  ar: {
    title: "الموظفون", newEmployee: "موظف جديد", cancel: "إلغاء",
    editTitle: "تعديل بيانات الموظف", newTitle: "موظف جديد",
    name: "اسم الموظف", jobTitle: "المسمى الوظيفي", department: "القسم", phone: "رقم الهاتف",
    hireDate: "تاريخ التعيين *", baseSalary: "الراتب الأساسي *", save: "حفظ الموظف", saveEdit: "حفظ التعديلات",
    saving: "جارٍ الحفظ...", err: "تعذر حفظ الموظف",
    thPhoto: "", thName: "الاسم", thJobTitle: "المسمى الوظيفي", thDepartment: "القسم", thSalary: "الراتب الأساسي",
    thAssignment: "التخصيص", thStatus: "الحالة", loading: "جارٍ التحميل...", empty: "لا يوجد موظفون بعد.",
    active: "نشط", inactive: "معطّل", enable: "تفعيل", disable: "تعطيل",
    bankName: "اسم البنك", bankAccount: "رقم الحساب البنكي",
    assignment: "التخصيص", headOffice: "المكتب الرئيسي (يوزّع على المشاريع المفتوحة)", changeAssignment: "تغيير",
    thUser: "حساب الدخول (للحضور الذاتي)", noUser: "غير مربوط", unlink: "إلغاء الربط",
    photo: "صورة الموظف", uploadPhoto: "رفع صورة", uploading: "جارٍ الرفع...", removePhoto: "إزالة",
    confirmDelete: "تأكيد حذف الموظف نهائيًا؟ العملية لا يمكن التراجع عنها.", errDelete: "تعذر حذف الموظف",
  },
  en: {
    title: "Employees", newEmployee: "New Employee", cancel: "Cancel",
    editTitle: "Edit Employee", newTitle: "New Employee",
    name: "Employee Name", jobTitle: "Job Title", department: "Department", phone: "Phone",
    hireDate: "Hire Date *", baseSalary: "Base Salary *", save: "Save Employee", saveEdit: "Save Changes",
    saving: "Saving...", err: "Failed to save employee",
    thPhoto: "", thName: "Name", thJobTitle: "Job Title", thDepartment: "Department", thSalary: "Base Salary",
    thAssignment: "Assignment", thStatus: "Status", loading: "Loading...", empty: "No employees yet.",
    active: "Active", inactive: "Inactive", enable: "Enable", disable: "Disable",
    bankName: "Bank Name", bankAccount: "Bank Account Number",
    assignment: "Assignment", headOffice: "Head Office (distributed across open projects)", changeAssignment: "Change",
    thUser: "Login Account (for self check-in)", noUser: "Not linked", unlink: "Unlink",
    photo: "Employee Photo", uploadPhoto: "Upload Photo", uploading: "Uploading...", removePhoto: "Remove",
    confirmDelete: "Confirm permanently deleting this employee? This cannot be undone.", errDelete: "Failed to delete employee",
  },
};

const emptyForm = { name: "", jobTitle: "", department: "", phone: "", hireDate: "", baseSalary: 0, bankName: "", bankAccountNumber: "", projectId: "", photoUrl: "" };

export default function EmployeesPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState(emptyForm);
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

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm((v) => !v || editingId !== null);
  }

  function startEdit(e: any) {
    setEditingId(e.id);
    setForm({
      name: e.name, jobTitle: e.jobTitle, department: e.department ?? "", phone: e.phone ?? "",
      hireDate: e.hireDate ? new Date(e.hireDate).toISOString().slice(0, 10) : "",
      baseSalary: Number(e.baseSalary), bankName: e.bankName ?? "", bankAccountNumber: e.bankAccountNumber ?? "",
      projectId: e.projectId ?? "", photoUrl: e.photoUrl ?? "",
    });
    setShowForm(true);
  }

  async function handlePhotoUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 400, 0.85);
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    } catch {
      alert(t.err);
    }
    setUploadingPhoto(false);
    ev.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(editingId ? `/api/employees/${editingId}` : "/api/employees", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: form.projectId || null }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? t.err);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  }

  async function removeEmployee(id: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
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
        <button onClick={startNew} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
          {showForm && !editingId ? t.cancel : t.newEmployee}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <p className="lg:col-span-3 font-semibold text-sm text-neutral-600">{editingId ? t.editTitle : t.newTitle}</p>

          <div className="lg:col-span-3">
            <label className="text-sm text-neutral-600 block mb-1">{t.photo}</label>
            <div className="flex items-center gap-3">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="" className="h-16 w-16 object-cover rounded-full border" />
              ) : (
                <div className="h-16 w-16 rounded-full border bg-neutral-50 flex items-center justify-center text-neutral-300">
                  <UserIcon size={24} />
                </div>
              )}
              <label className="border rounded-xl px-4 py-2 text-sm font-medium cursor-pointer">
                {uploadingPhoto ? t.uploading : t.uploadPhoto}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="hidden" />
              </label>
              {form.photoUrl && (
                <button type="button" onClick={() => setForm({ ...form, photoUrl: "" })} className="text-danger text-sm">
                  {t.removePhoto}
                </button>
              )}
            </div>
          </div>

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
              <th className="p-3 font-medium">{t.thPhoto}</th>
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
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={9}>{t.loading}</td></tr>}
            {!loading && employees.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={9}>{t.empty}</td></tr>}
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">
                  {e.photoUrl ? (
                    <img src={e.photoUrl} alt={e.name} className="h-9 w-9 object-cover rounded-full border" />
                  ) : (
                    <div className="h-9 w-9 rounded-full border bg-neutral-50 flex items-center justify-center text-neutral-300">
                      <UserIcon size={16} />
                    </div>
                  )}
                </td>
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
                <td className="p-3 flex items-center gap-3">
                  <button onClick={() => startEdit(e)} className="text-primary hover:opacity-70"><Pencil size={15} /></button>
                  <button onClick={() => toggleActive(e)} className="text-xs text-primary hover:underline">{e.isActive ? t.disable : t.enable}</button>
                  <button onClick={() => removeEmployee(e.id)} className="text-danger hover:opacity-70"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
