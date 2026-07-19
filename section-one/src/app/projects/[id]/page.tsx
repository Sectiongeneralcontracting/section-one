"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, X, Lock, RotateCcw } from "lucide-react";

const categoryLabels: Record<string, string> = {
  MATERIALS: "مواد",
  LABOR: "عمالة",
  SUBCONTRACTOR: "مقاولي باطن",
  EQUIPMENT: "معدات",
  ADMINISTRATIVE: "مصروفات إدارية",
  OTHER: "أخرى",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "MATERIALS", amount: 0, description: "" });

  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<{ partnerId: string; sharePct: number }[]>([]);
  const [allocError, setAllocError] = useState("");
  const [allocSaving, setAllocSaving] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", contractValue: 0, description: "" });
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState("");

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setAllocations(data.partnerAllocations.map((a: any) => ({ partnerId: a.partnerId, sharePct: Number(a.sharePct) })));
      setProjectForm({ name: data.name, contractValue: Number(data.contractValue), description: data.description ?? "" });
    }
    const pRes = await fetch("/api/partners");
    if (pRes.ok) setAllPartners(await pRes.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveProjectInfo(e: React.FormEvent) {
    e.preventDefault();
    setProjectSaving(true);
    setProjectError("");
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectForm),
    });
    setProjectSaving(false);
    if (!res.ok) return setProjectError("تعذر حفظ التعديلات");
    setEditingProject(false);
    load();
  }

  function toggleAllocPartner(partnerId: string) {
    setAllocations((prev) =>
      prev.some((a) => a.partnerId === partnerId)
        ? prev.filter((a) => a.partnerId !== partnerId)
        : [...prev, { partnerId, sharePct: 0 }]
    );
  }

  function updateAllocPct(partnerId: string, pct: number) {
    setAllocations((prev) => prev.map((a) => (a.partnerId === partnerId ? { ...a, sharePct: pct } : a)));
  }

  async function saveAllocations() {
    setAllocSaving(true);
    setAllocError("");
    const res = await fetch(`/api/projects/${id}/allocations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocations }),
    });
    setAllocSaving(false);
    if (!res.ok) return setAllocError((await res.json()).error ?? "تعذر الحفظ");
    load();
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: id, amount: Number(form.amount) }),
    });
    setSaving(false);
    if (!res.ok) return setError("تعذر إضافة المصروف");
    setForm({ category: "MATERIALS", amount: 0, description: "" });
    setShowForm(false);
    load();
  }

  async function closeProject() {
    if (!confirm("تأكيد إغلاق المشروع وإنشاء تقرير الإغلاق؟")) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر الإغلاق");
    load();
  }

  async function reopenProject() {
    if (!confirm("تأكيد إعادة فتح المشروع؟")) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر إعادة الفتح");
    load();
  }

  if (!project) {
    return <AppShell title="جارٍ التحميل..."><></></AppShell>;
  }

  const totalExpenses = project.expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netProfit = Number(project.contractValue) - totalExpenses;

  return (
    <AppShell
      title={project.name}
      action={
        <div className="flex gap-2">
          {project.status !== "CLOSED" && (
            <button onClick={() => setEditingProject((v) => !v)} className="border text-sm px-4 py-2 rounded-xl">
              {editingProject ? "إلغاء التعديل" : "تعديل"}
            </button>
          )}
          {project.status !== "CLOSED" ? (
            <button onClick={closeProject} className="bg-danger text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
              <Lock size={16} /> إغلاق المشروع
            </button>
          ) : (
            <button onClick={reopenProject} className="bg-neutral-700 text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
              <RotateCcw size={16} /> إعادة فتح
            </button>
          )}
          <button onClick={() => router.push("/projects")} className="text-sm px-4 py-2 rounded-xl border">
            رجوع للمشاريع
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">العميل</p><p className="font-bold">{project.client.name}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">قيمة العقد</p><p className="font-bold">{Number(project.contractValue).toLocaleString("ar-EG")} ج.م</p></div>
        <div className="card"><p className="text-sm text-neutral-500">إجمالي المصروفات</p><p className="font-bold text-danger">{totalExpenses.toLocaleString("ar-EG")} ج.م</p></div>
        <div className="card"><p className="text-sm text-neutral-500">صافي الربح</p><p className="font-bold text-success">{netProfit.toLocaleString("ar-EG")} ج.م</p></div>
      </div>

      {editingProject && (
        <form onSubmit={saveProjectInfo} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p className="sm:col-span-2 font-semibold text-sm text-neutral-600">تعديل بيانات المشروع</p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">اسم المشروع</label>
            <input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">قيمة العقد</label>
            <input type="number" step="0.01" value={projectForm.contractValue} onChange={(e) => setProjectForm({ ...projectForm, contractValue: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">وصف المشروع</label>
            <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full border rounded-xl px-3 py-2" rows={2} />
          </div>
          {projectError && <p className="text-danger text-sm sm:col-span-2">{projectError}</p>}
          <div className="sm:col-span-2">
            <button disabled={projectSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {projectSaving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3">
        <StatusBadge status={project.status} />
        <span className="text-sm text-neutral-500">كود المشروع: {project.code}</span>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">المصروفات</h2>
        {project.status !== "CLOSED" && (
          <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            {showForm ? <X size={14} /> : <Plus size={14} />} مصروف جديد
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={addExpense} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">البند</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">القيمة *</label>
            <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">وصف</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحفظ..." : "حفظ المصروف"}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">التاريخ</th>
              <th className="p-3 font-medium">البند</th>
              <th className="p-3 font-medium">الوصف</th>
              <th className="p-3 font-medium">القيمة</th>
            </tr>
          </thead>
          <tbody>
            {project.expenses.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={4}>لا يوجد مصروفات مسجلة بعد.</td></tr>
            )}
            {project.expenses.map((e: any) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{new Date(e.date).toLocaleDateString("ar-EG")}</td>
                <td className="p-3">{categoryLabels[e.category]}</td>
                <td className="p-3">{e.description || "—"}</td>
                <td className="p-3">{Number(e.amount).toLocaleString("ar-EG")} ج.م</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">نسب مساهمة الشركاء في هذا المشروع</h2>
        <p className="text-xs text-neutral-400">مجموع النسب لازم يساوي 100%</p>
        <div className="space-y-2">
          {allPartners.map((p) => {
            const alloc = allocations.find((a) => a.partnerId === p.id);
            return (
              <div key={p.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!alloc}
                  onChange={() => toggleAllocPartner(p.id)}
                  disabled={project.status === "CLOSED"}
                />
                <span className="text-sm w-40">{p.name}</span>
                {alloc && (
                  <input
                    type="number"
                    step="0.01"
                    value={alloc.sharePct}
                    onChange={(e) => updateAllocPct(p.id, Number(e.target.value))}
                    disabled={project.status === "CLOSED"}
                    className="w-24 border rounded-lg px-2 py-1 text-sm"
                  />
                )}
                {alloc && <span className="text-xs text-neutral-400">%</span>}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-neutral-500">
          الإجمالي الحالي: {allocations.reduce((s, a) => s + Number(a.sharePct || 0), 0)}%
        </p>
        {allocError && <p className="text-danger text-sm">{allocError}</p>}
        {project.status !== "CLOSED" && (
          <button onClick={saveAllocations} disabled={allocSaving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60">
            {allocSaving ? "جارٍ الحفظ..." : "حفظ نسب الشركاء"}
          </button>
        )}
      </div>

      {project.closingReports?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-2">تقرير الإغلاق</h2>
          {project.closingReports.map((r: any) => (
            <p key={r.id} className="text-sm text-neutral-600">
              أُغلق بتاريخ {new Date(r.closedAt).toLocaleDateString("ar-EG")} — صافي الربح:{" "}
              <span className="font-bold text-success">{Number(r.netProfit).toLocaleString("ar-EG")} ج.م</span>
            </p>
          ))}
        </div>
      )}
    </AppShell>
  );
}
