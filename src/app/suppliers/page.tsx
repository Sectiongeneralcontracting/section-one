"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const categoryLabels: Record<string, string> = {
  MATERIALS: "مواد",
  EQUIPMENT: "معدات",
  SUBCONTRACTOR: "مقاولي باطن",
  SERVICES: "خدمات",
  OTHER: "أخرى",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "MATERIALS", phone: "", email: "", address: "", taxNumber: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/suppliers");
    if (res.ok) setSuppliers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(s: any) {
    setEditingId(s.id);
    setForm({ name: s.name, category: s.category, phone: s.phone ?? "", email: s.email ?? "", address: s.address ?? "", taxNumber: s.taxNumber ?? "" });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(editingId ? `/api/suppliers/${editingId}` : "/api/suppliers", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError("تعذر حفظ المورد");
    setForm({ name: "", category: "MATERIALS", phone: "", email: "", address: "", taxNumber: "" });
    setEditingId(null);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("تأكيد حذف المورد؟")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر الحذف");
    load();
  }

  return (
    <AppShell
      title="الموردون"
      action={
        <button
          onClick={() => { setEditingId(null); setForm({ name: "", category: "MATERIALS", phone: "", email: "", address: "", taxNumber: "" }); setShowForm((v) => !v); }}
          className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
          {showForm && !editingId ? "إلغاء" : "مورد جديد"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <p className="lg:col-span-3 font-semibold text-sm text-neutral-600">{editingId ? "تعديل بيانات المورد" : "مورد جديد"}</p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">اسم المورد *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">التصنيف</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">رقم الهاتف</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">الرقم الضريبي</label>
            <input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">العنوان</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "حفظ المورد"}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">اسم المورد</th>
              <th className="p-3 font-medium">التصنيف</th>
              <th className="p-3 font-medium">الهاتف</th>
              <th className="p-3 font-medium">عدد أوامر الشراء</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>جارٍ التحميل...</td></tr>}
            {!loading && suppliers.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>لا يوجد موردون بعد.</td></tr>}
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{categoryLabels[s.category]}</td>
                <td className="p-3">{s.phone || "—"}</td>
                <td className="p-3">{s.purchaseOrders.length}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(s)} className="text-primary hover:opacity-70"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-danger hover:opacity-70"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
