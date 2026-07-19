"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X, Wrench } from "lucide-react";

const statusLabels: Record<string, string> = {
  AVAILABLE: "متاحة",
  IN_USE: "بمشروع",
  MAINTENANCE: "بالصيانة",
  OUT_OF_SERVICE: "خارج الخدمة",
};
const statusStyles: Record<string, string> = {
  AVAILABLE: "bg-success/10 text-success",
  IN_USE: "bg-primary/10 text-primary",
  MAINTENANCE: "bg-secondary/10 text-secondary",
  OUT_OF_SERVICE: "bg-danger/10 text-danger",
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeAction, setActiveAction] = useState<{ id: string; type: "assign" | "maintenance" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", type: "", serialNumber: "" });
  const [assignProjectId, setAssignProjectId] = useState("");
  const [maintForm, setMaintForm] = useState({ description: "", cost: 0, markOutOfService: false });

  async function load() {
    setLoading(true);
    const [eRes, pRes] = await Promise.all([fetch("/api/equipment"), fetch("/api/projects")]);
    if (eRes.ok) setEquipment(await eRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEquipment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return setError("تعذر إضافة المعدة");
    setForm({ name: "", type: "", serialNumber: "" });
    setShowForm(false);
    load();
  }

  async function assign(id: string) {
    if (!assignProjectId) return;
    const res = await fetch(`/api/equipment/${id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: assignProjectId }),
    });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر التخصيص");
    setActiveAction(null);
    setAssignProjectId("");
    load();
  }

  async function unassign(id: string) {
    if (!confirm("تأكيد إنهاء تخصيص المعدة؟")) return;
    const needsMaintenance = confirm("هل تحتاج المعدة لصيانة؟ (موافق = نعم، إلغاء = لا)");
    const res = await fetch(`/api/equipment/${id}/unassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsMaintenance }),
    });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر الإنهاء");
    load();
  }

  async function logMaintenance(id: string) {
    const res = await fetch(`/api/equipment/${id}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maintForm),
    });
    if (!res.ok) return alert((await res.json()).error ?? "تعذر التسجيل");
    setActiveAction(null);
    setMaintForm({ description: "", cost: 0, markOutOfService: false });
    load();
  }

  async function markAvailable(id: string) {
    await fetch(`/api/equipment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "AVAILABLE" }),
    });
    load();
  }

  return (
    <AppShell
      title="المعدات"
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "إلغاء" : "معدة جديدة"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={addEquipment} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required placeholder="اسم المعدة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder="النوع (رافعة، خلاطة...)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder="الرقم التسلسلي" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="border rounded-xl px-3 py-2" />
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-3">حفظ المعدة</button>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">اسم المعدة</th>
              <th className="p-3 font-medium">النوع</th>
              <th className="p-3 font-medium">الحالة</th>
              <th className="p-3 font-medium">المشروع الحالي</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>جارٍ التحميل...</td></tr>}
            {!loading && equipment.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>لا يوجد معدات بعد.</td></tr>}
            {equipment.map((eq) => (
              <tr key={eq.id} className="border-t">
                <td className="p-3 font-medium">{eq.name}</td>
                <td className="p-3">{eq.type}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[eq.status]}`}>{statusLabels[eq.status]}</span></td>
                <td className="p-3">{eq.assignments[0]?.project?.name ?? "—"}</td>
                <td className="p-3 flex gap-2 flex-wrap">
                  {eq.status === "AVAILABLE" && (
                    activeAction?.id === eq.id && activeAction.type === "assign" ? (
                      <div className="flex gap-1">
                        <select value={assignProjectId} onChange={(e) => setAssignProjectId(e.target.value)} className="border rounded-lg px-2 py-1 text-xs">
                          <option value="">اختر مشروع</option>
                          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={() => assign(eq.id)} className="text-primary text-xs">تأكيد</button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveAction({ id: eq.id, type: "assign" })} className="text-primary text-xs">تخصيص لمشروع</button>
                    )
                  )}
                  {eq.status === "IN_USE" && (
                    <button onClick={() => unassign(eq.id)} className="text-secondary text-xs">إنهاء التخصيص</button>
                  )}
                  {eq.status !== "OUT_OF_SERVICE" && (
                    activeAction?.id === eq.id && activeAction.type === "maintenance" ? (
                      <div className="flex gap-1 items-center">
                        <input placeholder="الوصف" value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} className="border rounded-lg px-2 py-1 text-xs w-28" />
                        <button onClick={() => logMaintenance(eq.id)} className="text-primary text-xs">تسجيل</button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveAction({ id: eq.id, type: "maintenance" })} className="text-danger text-xs flex items-center gap-1"><Wrench size={12} /> صيانة</button>
                    )
                  )}
                  {eq.status === "MAINTENANCE" && (
                    <button onClick={() => markAvailable(eq.id)} className="text-success text-xs">إنهاء الصيانة</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
