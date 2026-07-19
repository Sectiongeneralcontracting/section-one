"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X, Trash2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  APPROVED: "معتمد",
  RECEIVED: "مُستلم",
  PAID: "مصروف",
  CANCELLED: "ملغي",
};
const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  APPROVED: "bg-primary/10 text-primary",
  RECEIVED: "bg-secondary/10 text-secondary",
  PAID: "bg-success/10 text-success",
  CANCELLED: "bg-danger/10 text-danger",
};
const nextAction: Record<string, { status: string; label: string }[]> = {
  DRAFT: [{ status: "APPROVED", label: "اعتماد" }, { status: "CANCELLED", label: "إلغاء" }],
  APPROVED: [{ status: "RECEIVED", label: "تسجيل استلام" }, { status: "CANCELLED", label: "إلغاء" }],
  RECEIVED: [{ status: "PAID", label: "تسجيل صرف" }],
  PAID: [],
  CANCELLED: [],
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ poNumber: "", supplierId: "", projectId: "", expectedDate: "" });
  const [items, setItems] = useState([{ description: "", unit: "", quantity: 0, unitPrice: 0 }]);

  async function load() {
    setLoading(true);
    const [oRes, sRes, pRes] = await Promise.all([
      fetch("/api/purchase-orders"),
      fetch("/api/suppliers"),
      fetch("/api/projects"),
    ]);
    if (oRes.ok) setOrders(await oRes.json());
    if (sRes.ok) setSuppliers(await sRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function updateItem(i: number, field: string, value: any) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: form.projectId || undefined, items }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error?.formErrors?.join(", ") ?? "تعذر حفظ أمر الشراء");
    setForm({ poNumber: "", supplierId: "", projectId: "", expectedDate: "" });
    setItems([{ description: "", unit: "", quantity: 0, unitPrice: 0 }]);
    setShowForm(false);
    load();
  }

  async function transition(id: string, status: string) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر تنفيذ الإجراء");
    load();
  }

  return (
    <AppShell
      title="أوامر الشراء"
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "إلغاء" : "أمر شراء جديد"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-neutral-600 block mb-1">رقم أمر الشراء *</label>
              <input required value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="PO-2026-001" />
            </div>
            <div>
              <label className="text-sm text-neutral-600 block mb-1">المورد *</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
                <option value="">اختر المورد</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-600 block mb-1">المشروع (اختياري)</label>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
                <option value="">بدون مشروع محدد</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-600 block mb-1">تاريخ التوريد المتوقع</label>
              <input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-neutral-600">البنود</p>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                <input required placeholder="الوصف" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="border rounded-xl px-3 py-2 sm:col-span-2" />
                <input required placeholder="الوحدة" value={it.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} className="border rounded-xl px-3 py-2" />
                <input required type="number" step="0.001" placeholder="الكمية" value={it.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className="border rounded-xl px-3 py-2" />
                <div className="flex gap-2">
                  <input required type="number" step="0.01" placeholder="سعر الوحدة" value={it.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className="border rounded-xl px-3 py-2 flex-1" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} className="text-danger">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setItems((prev) => [...prev, { description: "", unit: "", quantity: 0, unitPrice: 0 }])} className="text-primary text-sm flex items-center gap-1">
              <Plus size={14} /> إضافة بند
            </button>
          </div>

          <p className="text-sm font-semibold">الإجمالي: {total.toLocaleString("ar-EG")} ج.م</p>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
            {saving ? "جارٍ الحفظ..." : "حفظ أمر الشراء"}
          </button>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">رقم الأمر</th>
              <th className="p-3 font-medium">المورد</th>
              <th className="p-3 font-medium">المشروع</th>
              <th className="p-3 font-medium">الإجمالي</th>
              <th className="p-3 font-medium">الحالة</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>جارٍ التحميل...</td></tr>}
            {!loading && orders.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={6}>لا يوجد أوامر شراء بعد.</td></tr>}
            {orders.map((o) => {
              const orderTotal = o.items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0);
              return (
                <tr key={o.id} className="border-t">
                  <td className="p-3">{o.poNumber}</td>
                  <td className="p-3 font-medium">{o.supplier.name}</td>
                  <td className="p-3">{o.project?.name ?? "—"}</td>
                  <td className="p-3">{orderTotal.toLocaleString("ar-EG")} ج.م</td>
                  <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[o.status]}`}>{statusLabels[o.status]}</span></td>
                  <td className="p-3 flex gap-2">
                    {nextAction[o.status].map((a) => (
                      <button key={a.status} onClick={() => transition(o.id, a.status)} className="text-primary text-xs hover:underline">{a.label}</button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
