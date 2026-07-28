"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Wrench, Trash2 } from "lucide-react";

const statusLabels: Record<string, { ar: string; en: string }> = {
  AVAILABLE: { ar: "متاحة", en: "Available" },
  IN_USE: { ar: "بمشروع", en: "In Use" },
  MAINTENANCE: { ar: "بالصيانة", en: "Maintenance" },
  OUT_OF_SERVICE: { ar: "خارج الخدمة", en: "Out of Service" },
};
const statusStyles: Record<string, string> = {
  AVAILABLE: "bg-success/10 text-success",
  IN_USE: "bg-primary/10 text-primary",
  MAINTENANCE: "bg-secondary/10 text-secondary",
  OUT_OF_SERVICE: "bg-danger/10 text-danger",
};

const dict = {
  ar: {
    title: "المعدات", newEquipment: "معدة جديدة", cancel: "إلغاء",
    name: "اسم المعدة", type: "النوع (رافعة، خلاطة...)", serial: "الرقم التسلسلي", save: "حفظ المعدة",
    err: "تعذر إضافة المعدة",
    thName: "اسم المعدة", thType: "النوع", thStatus: "الحالة", thProject: "المشروع الحالي",
    loading: "جارٍ التحميل...", empty: "لا يوجد معدات بعد.",
    chooseProject: "اختر مشروع", confirm: "تأكيد", assignToProject: "تخصيص لمشروع",
    endAssignment: "إنهاء التخصيص", descPh: "الوصف", log: "تسجيل", maintenance: "صيانة",
    endMaintenance: "إنهاء الصيانة",
    confirmUnassign: "تأكيد إنهاء تخصيص المعدة؟", confirmNeedsMaintenance: "هل تحتاج المعدة لصيانة؟ (موافق = نعم، إلغاء = لا)",
    errAssign: "تعذر التخصيص", errUnassign: "تعذر الإنهاء", errMaintLog: "تعذر التسجيل",
    confirmDeleteEquipment: "تأكيد حذف المعدة؟", errDelete: "تعذر الحذف",
  },
  en: {
    title: "Equipment", newEquipment: "New Equipment", cancel: "Cancel",
    name: "Equipment Name", type: "Type (crane, mixer...)", serial: "Serial Number", save: "Save Equipment",
    err: "Failed to add equipment",
    thName: "Equipment Name", thType: "Type", thStatus: "Status", thProject: "Current Project",
    loading: "Loading...", empty: "No equipment yet.",
    chooseProject: "Choose project", confirm: "Confirm", assignToProject: "Assign to Project",
    endAssignment: "End Assignment", descPh: "Description", log: "Log", maintenance: "Maintenance",
    endMaintenance: "End Maintenance",
    confirmUnassign: "Confirm ending equipment assignment?", confirmNeedsMaintenance: "Does it need maintenance? (OK = yes, Cancel = no)",
    errAssign: "Failed to assign", errUnassign: "Failed to end", errMaintLog: "Failed to log",
    confirmDeleteEquipment: "Confirm deleting this equipment?", errDelete: "Failed to delete",
  },
};

export default function EquipmentPage() {
  const locale = useLocale();
  const t = dict[locale];
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
    if (!res.ok) return setError(t.err);
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
    if (!res.ok) return alert((await res.json()).error ?? t.errAssign);
    setActiveAction(null);
    setAssignProjectId("");
    load();
  }

  async function unassign(id: string) {
    if (!confirm(t.confirmUnassign)) return;
    const needsMaintenance = confirm(t.confirmNeedsMaintenance);
    const res = await fetch(`/api/equipment/${id}/unassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsMaintenance }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errUnassign);
    load();
  }

  async function logMaintenance(id: string) {
    const res = await fetch(`/api/equipment/${id}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maintForm),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errMaintLog);
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

  async function removeEquipment(id: string) {
    if (!confirm(t.confirmDeleteEquipment)) return;
    const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newEquipment}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={addEquipment} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder={t.type} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.serial} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="border rounded-xl px-3 py-2" />
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-3">{t.save}</button>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thName}</th>
              <th className="p-3 font-medium">{t.thType}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.loading}</td></tr>}
            {!loading && equipment.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.empty}</td></tr>}
            {equipment.map((eq) => (
              <tr key={eq.id} className="border-t">
                <td className="p-3 font-medium">{eq.name}</td>
                <td className="p-3">{eq.type}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[eq.status]}`}>{statusLabels[eq.status][locale]}</span></td>
                <td className="p-3">{eq.assignments[0]?.project?.name ?? "—"}</td>
                <td className="p-3 flex gap-2 flex-wrap">
                  {eq.status === "AVAILABLE" && (
                    activeAction && activeAction.id === eq.id && activeAction.type === "assign" ? (
                      <div className="flex gap-1">
                        <select value={assignProjectId} onChange={(e) => setAssignProjectId(e.target.value)} className="border rounded-lg px-2 py-1 text-xs">
                          <option value="">{t.chooseProject}</option>
                          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={() => assign(eq.id)} className="text-primary text-xs">{t.confirm}</button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveAction({ id: eq.id, type: "assign" })} className="text-primary text-xs">{t.assignToProject}</button>
                    )
                  )}
                  {eq.status === "IN_USE" && (
                    <button onClick={() => unassign(eq.id)} className="text-secondary text-xs">{t.endAssignment}</button>
                  )}
                  {eq.status !== "OUT_OF_SERVICE" && (
                    activeAction && activeAction.id === eq.id && activeAction.type === "maintenance" ? (
                      <div className="flex gap-1 items-center">
                        <input placeholder={t.descPh} value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} className="border rounded-lg px-2 py-1 text-xs w-28" />
                        <button onClick={() => logMaintenance(eq.id)} className="text-primary text-xs">{t.log}</button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveAction({ id: eq.id, type: "maintenance" })} className="text-danger text-xs flex items-center gap-1"><Wrench size={12} /> {t.maintenance}</button>
                    )
                  )}
                  {eq.status === "MAINTENANCE" && (
                    <button onClick={() => markAvailable(eq.id)} className="text-success text-xs">{t.endMaintenance}</button>
                  )}
                  {eq.status === "AVAILABLE" && (
                    <button onClick={() => removeEquipment(eq.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
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
