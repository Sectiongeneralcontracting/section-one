"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  projects: { contractValue: string }[];
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(c: Client) {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setShowForm((v) => !v || editingId !== null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(editingId ? `/api/clients/${editingId}` : "/api/clients", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError("تعذر حفظ العميل — تأكد من البيانات");
      return;
    }
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setShowForm(false);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("تأكيد حذف العميل؟")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر الحذف");
    load();
  }

  return (
    <AppShell
      title="العملاء"
      action={
        <button
          onClick={startNew}
          className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
          {showForm && !editingId ? "إلغاء" : "عميل جديد"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p className="sm:col-span-2 font-semibold text-sm text-neutral-600">
            {editingId ? "تعديل بيانات العميل" : "عميل جديد"}
          </p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">اسم العميل *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">رقم الهاتف</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">العنوان</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">ملاحظات</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              rows={2}
            />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button
              disabled={saving}
              className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60"
            >
              {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "حفظ العميل"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setShowForm(false); }}
                className="text-sm px-4 py-2 rounded-xl border"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">اسم العميل</th>
              <th className="p-3 font-medium">الهاتف</th>
              <th className="p-3 font-medium">البريد الإلكتروني</th>
              <th className="p-3 font-medium">عدد المشاريع</th>
              <th className="p-3 font-medium">إجمالي قيمة العقود</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-4 text-neutral-400" colSpan={6}>جارٍ التحميل...</td></tr>
            )}
            {!loading && clients.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={6}>لا يوجد عملاء بعد — ابدأ بإضافة أول عميل.</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.phone || "—"}</td>
                <td className="p-3">{c.email || "—"}</td>
                <td className="p-3">{c.projects.length}</td>
                <td className="p-3">
                  {c.projects
                    .reduce((s, p) => s + Number(p.contractValue), 0)
                    .toLocaleString("ar-EG")}{" "}
                  ج.م
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(c)} className="text-primary hover:opacity-70"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-danger hover:opacity-70"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
