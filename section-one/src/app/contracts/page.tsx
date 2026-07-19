"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X } from "lucide-react";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    contractNumber: "",
    signedDate: "",
    durationDays: 0,
    retentionPct: 5,
    advancePaymentPct: 0,
    advancePaymentAmount: 0,
  });

  async function load() {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([fetch("/api/contracts"), fetch("/api/projects")]);
    if (cRes.ok) setContracts(await cRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const projectsWithoutContract = projects.filter((p) => !contracts.some((c) => c.projectId === p.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError("تعذر حفظ العقد — تأكد من البيانات");
    setForm({ projectId: "", contractNumber: "", signedDate: "", durationDays: 0, retentionPct: 5, advancePaymentPct: 0, advancePaymentAmount: 0 });
    setShowForm(false);
    load();
  }

  return (
    <AppShell
      title="العقود"
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "إلغاء" : "عقد جديد"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">المشروع *</label>
            <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">اختر المشروع</option>
              {projectsWithoutContract.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">رقم العقد *</label>
            <input required value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="CTR-2026-001" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">تاريخ التوقيع *</label>
            <input required type="date" value={form.signedDate} onChange={(e) => setForm({ ...form, signedDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">مدة التنفيذ (يوم)</label>
            <input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">نسبة ضمان حسن التنفيذ %</label>
            <input type="number" step="0.01" value={form.retentionPct} onChange={(e) => setForm({ ...form, retentionPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">نسبة الدفعة المقدمة %</label>
            <input type="number" step="0.01" value={form.advancePaymentPct} onChange={(e) => setForm({ ...form, advancePaymentPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">قيمة الدفعة المقدمة</label>
            <input type="number" step="0.01" value={form.advancePaymentAmount} onChange={(e) => setForm({ ...form, advancePaymentAmount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحفظ..." : "حفظ العقد"}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">رقم العقد</th>
              <th className="p-3 font-medium">المشروع</th>
              <th className="p-3 font-medium">تاريخ التوقيع</th>
              <th className="p-3 font-medium">ضمان حسن التنفيذ</th>
              <th className="p-3 font-medium">عدد المستخلصات</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>جارٍ التحميل...</td></tr>}
            {!loading && contracts.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={5}>لا يوجد عقود بعد.</td></tr>
            )}
            {contracts.map((c) => (
              <tr key={c.id} className="border-t hover:bg-neutral-50">
                <td className="p-3"><Link href={`/contracts/${c.id}`} className="text-primary hover:underline">{c.contractNumber}</Link></td>
                <td className="p-3 font-medium">{c.project.name}</td>
                <td className="p-3">{new Date(c.signedDate).toLocaleDateString("ar-EG")}</td>
                <td className="p-3">{Number(c.retentionPct)}%</td>
                <td className="p-3">{c.certificates.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
