"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X } from "lucide-react";

type UserRow = { id: string; name: string; email: string; role: string; isActive: boolean };

const roleLabels: Record<string, { ar: string; en: string }> = {
  ADMIN: { ar: "مدير النظام", en: "Admin" },
  MANAGER: { ar: "مدير", en: "Manager" },
  VIEWER: { ar: "مشاهد", en: "Viewer" },
};

const dict = {
  ar: {
    title: "المستخدمون", newUser: "مستخدم جديد", cancel: "إلغاء",
    name: "الاسم *", email: "البريد الإلكتروني *", password: "كلمة المرور *", role: "الدور",
    save: "حفظ المستخدم", saving: "جارٍ الحفظ...", err: "تعذر إنشاء المستخدم",
    thName: "الاسم", thEmail: "البريد الإلكتروني", thRole: "الدور", thStatus: "الحالة",
    loading: "جارٍ التحميل...", active: "نشط", inactive: "معطّل", enable: "تفعيل", disable: "تعطيل",
  },
  en: {
    title: "Users", newUser: "New User", cancel: "Cancel",
    name: "Name *", email: "Email *", password: "Password *", role: "Role",
    save: "Save User", saving: "Saving...", err: "Failed to create user",
    thName: "Name", thEmail: "Email", thRole: "Role", thStatus: "Status",
    loading: "Loading...", active: "Active", inactive: "Inactive", enable: "Enable", disable: "Disable",
  },
};

export default function UsersPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      return setError(typeof data.error === "string" ? data.error : t.err);
    }
    setForm({ name: "", email: "", password: "", role: "VIEWER" });
    setShowForm(false);
    load();
  }

  async function toggleActive(u: UserRow) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newUser}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.name}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.email}</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.password}</label>
            <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.role}</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="ADMIN">{roleLabels.ADMIN[locale]}</option>
              <option value="MANAGER">{roleLabels.MANAGER[locale]}</option>
              <option value="VIEWER">{roleLabels.VIEWER[locale]}</option>
            </select>
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
              <th className="p-3 font-medium">{t.thName}</th>
              <th className="p-3 font-medium">{t.thEmail}</th>
              <th className="p-3 font-medium">{t.thRole}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.loading}</td></tr>}
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{roleLabels[u.role]?.[locale]}</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-500"}`}>
                    {u.isActive ? t.active : t.inactive}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => toggleActive(u)} className="text-xs text-primary hover:underline">
                    {u.isActive ? t.disable : t.enable}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
