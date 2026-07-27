"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Users, HardHat, Package, Camera } from "lucide-react";

const dict = {
  ar: {
    title: "إدارة الموقع — التقارير اليومية", newReport: "تقرير يومي جديد", cancel: "إلغاء",
    project: "المشروع *", chooseProject: "اختر المشروع", allProjects: "كل المشاريع",
    date: "التاريخ", weatherNotes: "ملاحظات الطقس", generalNotes: "ملاحظات عامة",
    save: "إنشاء التقرير", saving: "جارٍ الحفظ...", err: "تعذر إنشاء التقرير",
    filterProject: "فلترة بالمشروع",
    thDate: "التاريخ", thProject: "المشروع", thWorkers: "العمال", thEquipment: "المعدات", thMaterials: "المواد", thPhotos: "الصور",
    loading: "جارٍ التحميل...", empty: "لا يوجد تقارير يومية مسجلة بعد.",
  },
  en: {
    title: "Site Management — Daily Reports", newReport: "New Daily Report", cancel: "Cancel",
    project: "Project *", chooseProject: "Choose project", allProjects: "All Projects",
    date: "Date", weatherNotes: "Weather Notes", generalNotes: "General Notes",
    save: "Create Report", saving: "Saving...", err: "Failed to create report",
    filterProject: "Filter by project",
    thDate: "Date", thProject: "Project", thWorkers: "Workers", thEquipment: "Equipment", thMaterials: "Materials", thPhotos: "Photos",
    loading: "Loading...", empty: "No daily reports recorded yet.",
  },
};

export default function SiteReportsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [form, setForm] = useState({ projectId: "", date: "", weatherNotes: "", generalNotes: "" });

  async function load() {
    setLoading(true);
    const [rRes, pRes] = await Promise.all([fetch("/api/site-reports"), fetch("/api/projects")]);
    if (rRes.ok) setReports(await rRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/site-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? t.err);
    setForm({ projectId: "", date: "", weatherNotes: "", generalNotes: "" });
    setShowForm(false);
    window.location.href = `/site-reports/${data.id}`;
  }

  const filteredReports = useMemo(() => {
    return filterProject ? reports.filter((r) => r.projectId === filterProject) : reports;
  }, [reports, filterProject]);

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newReport}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.project}</label>
            <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseProject}</option>
              {projects.filter((p: any) => p.status !== "CLOSED").map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.date}</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.weatherNotes}</label>
            <input value={form.weatherNotes} onChange={(e) => setForm({ ...form, weatherNotes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.generalNotes}</label>
            <input value={form.generalNotes} onChange={(e) => setForm({ ...form, generalNotes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="card sm:w-72">
        <label className="text-sm text-neutral-600 block mb-1">{t.filterProject}</label>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full border rounded-xl px-3 py-2">
          <option value="">{t.allProjects}</option>
          {projects.filter((p: any) => p.status !== "CLOSED").map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium">{t.thWorkers}</th>
              <th className="p-3 font-medium">{t.thEquipment}</th>
              <th className="p-3 font-medium">{t.thMaterials}</th>
              <th className="p-3 font-medium">{t.thPhotos}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.loading}</td></tr>}
            {!loading && filteredReports.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.empty}</td></tr>}
            {filteredReports.map((r) => (
              <tr key={r.id} className="border-t hover:bg-neutral-50">
                <td className="p-3 font-medium"><Link href={`/site-reports/${r.id}`} className="text-primary hover:underline">{new Date(r.date).toLocaleDateString(localeCode)}</Link></td>
                <td className="p-3">{r.project.name}</td>
                <td className="p-3 flex items-center gap-1"><Users size={14} className="text-neutral-400" /> {r.workerAttendance.reduce((s: number, w: any) => s + w.count, 0)}</td>
                <td className="p-3 flex items-center gap-1"><HardHat size={14} className="text-neutral-400" /> {r.equipmentLogs.length}</td>
                <td className="p-3 flex items-center gap-1"><Package size={14} className="text-neutral-400" /> {r.materialLogs.length}</td>
                <td className="p-3 flex items-center gap-1"><Camera size={14} className="text-neutral-400" /> {r.photos.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
