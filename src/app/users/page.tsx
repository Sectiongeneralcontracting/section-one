"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { ROLE_LABELS, ALL_ROLES } from "@/lib/modules";
import { Plus, X, Pencil } from "lucide-react";

type UserRow = { id: string; name: string; email: string; role: string; isActive: boolean };

const dict = {
  ar: {
    title: "المستخدمون", newUser: "مستخدم جديد", cancel: "إلغاء",
    editTitle: "تعديل بيانات المستخدم", newTitle: "مستخدم جديد",
    name: "الاسم *", email: "البريد الإلكتروني *", password: "كلمة المرور *", newPassword: "كلمة مرور جديدة (اختياري)",
    role: "الدور",
    save: "حفظ المستخدم", saveEdit: "حفظ التعديلات", saving: "جارٍ الحفظ...", err: "تعذر إنشاء المستخدم", errEdit: "تعذر حفظ التعديلات",
    thName: "الاسم", thEmail: "البريد الإلكتروني", thRole: "الدور", thStatus: "الحالة",
    loading: "جارٍ التحميل...", active: "نشط", inactive: "معطّل", enable: "تفعيل", disable: "تعطيل",
    emailNote: "البريد الإلكتروني مش قابل للتغيير بعد الإنشاء",
  },
  en: {
    title: "Users", newUser: "New User", cancel: "Cancel",
    editTitle: "Edit User", newTitle: "New User",
    name: "Name *", email: "Email *", password: "Password *", newPassword: "New Password (optional)",
    role: "Role",
    save: "Save User", saveEdit: "Save Changes", saving: "Saving...", err: "Failed to create user", errEdit: "Failed to save changes",
    thName: "Name", thEmail: "Email", thRole: "Role", thStatus: "Status",
    loading: "Loading...", active: "Active", inactive: "Inactive", enable: "Enable", disable: "Disable",
    emailNote: "Email cannot be changed after creation",
  },
};

export default function UsersPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function startNew() {
    setEditingId(null);
    setForm({ name: "", email: "", password: "", role: "VIEWER" });
    setShowForm((v) => !v || editingId !== null);
  }

  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (editingId) {
      const res = await fetch(`/api/users/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        }),
      });
      setSaving(false);
      if (!res.ok) {
        const data = await res.json();
        return setError(typeof data.error === "string" ? data.error : t.errEdit);
      }
    } else {
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
    }

    setForm({ name: "", email: "", password: "", role: "VIEWER" });
    setEditingId(null);
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
        <button onClick={startNew} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
          {showForm && !editingId ? t.cancel : t.newUser}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <p className="lg:col-span-4 font-semibold text-sm text-neutral-600">{editingId ? t.editTitle : t.newTitle}</p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.name}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.email}</label>
            <input
              required
              type="email"
              disabled={!!editingId}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-xl px-3 py-2 disabled:bg-neutral-50 disabled:text-neutral-400"
            />
            {editingId && <p className="text-xs text-neutral-400 mt-1">{t.emailNote}</p>}
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{editingId ? t.newPassword : t.password}</label>
            <input
              required={!editingId}
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.role}</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r][locale]}</option>)}
            </select>
          </div>
          {error && <p className="text-danger text-sm lg:col-span-4">{error}</p>}
          <div className="lg:col-span-4 flex gap-2">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : editingId ? t.saveEdit : t.save}
            </button>
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
                <td className="p-3">{ROLE_LABELS[u.role]?.[locale]}</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-500"}`}>
                    {u.isActive ? t.active : t.inactive}
                  </span>
                </td>
                <td className="p-3 flex items-center gap-3">
                  <button onClick={() => startEdit(u)} className="text-primary hover:opacity-70"><Pencil size={15} /></button>
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
