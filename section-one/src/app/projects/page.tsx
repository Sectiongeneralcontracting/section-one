"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, X } from "lucide-react";

type Project = {
  id: string;
  code: string;
  name: string;
  status: string;
  contractValue: string;
  client: { name: string };
  expenses: { amount: string }[];
};
type Client = { id: string; name: string };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    name: "",
    clientId: "",
    contractValue: 0,
    startDate: "",
    status: "ONGOING",
  });

  async function load() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([fetch("/api/projects"), fetch("/api/clients")]);
    if (pRes.ok) setProjects(await pRes.json());
    if (cRes.ok) setClients(await cRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contractValue: Number(form.contractValue) }),
    });
    setSaving(false);
    if (!res.ok) return setError("تعذر حفظ المشروع — تأكد من البيانات");
    setForm({ code: "", name: "", clientId: "", contractValue: 0, startDate: "", status: "ONGOING" });
    setShowForm(false);
    load();
  }

  return (
    <AppShell
      title="المشاريع"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "إلغاء" : "مشروع جديد"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">كود المشروع *</label>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="PRJ-005" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">اسم المشروع *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">العميل *</label>
            <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">اختر العميل</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">قيمة العقد *</label>
            <input required type="number" step="0.01" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">تاريخ البدء *</label>
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">الحالة</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="ONGOING">جارية</option>
              <option value="READY_TO_CLOSE">جاهزة للإغلاق</option>
              <option value="CLOSED">مغلقة</option>
              <option value="DELAYED">متأخرة</option>
            </select>
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحفظ..." : "حفظ المشروع"}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">كود المشروع</th>
              <th className="p-3 font-medium">اسم المشروع</th>
              <th className="p-3 font-medium">العميل</th>
              <th className="p-3 font-medium">قيمة العقد</th>
              <th className="p-3 font-medium">المصروفات</th>
              <th className="p-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>جارٍ التحميل...</td></tr>}
            {!loading && projects.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={6}>لا يوجد مشاريع بعد — ابدأ بإضافة أول مشروع.</td></tr>
            )}
            {projects.map((p) => (
              <tr key={p.id} className="border-t hover:bg-neutral-50">
                <td className="p-3">
                  <Link href={`/projects/${p.id}`} className="text-primary hover:underline">{p.code}</Link>
                </td>
                <td className="p-3 font-medium">
                  <Link href={`/projects/${p.id}`} className="hover:underline">{p.name}</Link>
                </td>
                <td className="p-3">{p.client.name}</td>
                <td className="p-3">{Number(p.contractValue).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{p.expenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
