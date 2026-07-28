"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const dict = {
  ar: {
    title: "العقود", newContract: "عقد جديد", cancel: "إلغاء",
    project: "المشروع *", chooseProject: "اختر المشروع", contractNumber: "رقم العقد *",
    signedDate: "تاريخ التوقيع *", duration: "مدة التنفيذ (يوم)", retention: "نسبة ضمان حسن التنفيذ %",
    advancePct: "نسبة الدفعة المقدمة %", advanceAmount: "قيمة الدفعة المقدمة",
    save: "حفظ العقد", saving: "جارٍ الحفظ...", err: "تعذر حفظ العقد — تأكد من البيانات",
    thNumber: "رقم العقد", thProject: "المشروع", thDate: "تاريخ التوقيع", thRetention: "ضمان حسن التنفيذ", thCerts: "عدد المستخلصات",
    loading: "جارٍ التحميل...", empty: "لا يوجد عقود بعد.",
    confirmDelete: "تأكيد حذف العقد نهائيًا؟ ده هيمسح جدول الكميات معاه، ومش هيتم لو فيه مستخلصات مسجلة.",
    errDelete: "تعذر الحذف",
  },
  en: {
    title: "Contracts", newContract: "New Contract", cancel: "Cancel",
    project: "Project *", chooseProject: "Choose project", contractNumber: "Contract Number *",
    signedDate: "Signed Date *", duration: "Duration (days)", retention: "Retention %",
    advancePct: "Advance Payment %", advanceAmount: "Advance Payment Amount",
    save: "Save Contract", saving: "Saving...", err: "Failed to save contract — check the data",
    thNumber: "Contract No.", thProject: "Project", thDate: "Signed Date", thRetention: "Retention", thCerts: "Certificates",
    loading: "Loading...", empty: "No contracts yet.",
    confirmDelete: "Confirm permanently deleting this contract? This will also remove its BOQ, and won't proceed if certificates exist.",
    errDelete: "Failed to delete",
  },
};

export default function ContractsPage() {
  const locale = useLocale();
  const t = dict[locale];
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
    if (!res.ok) return setError(t.err);
    setForm({ projectId: "", contractNumber: "", signedDate: "", durationDays: 0, retentionPct: 5, advancePaymentPct: 0, advancePaymentAmount: 0 });
    setShowForm(false);
    load();
  }

  async function removeContract(contractId: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/contracts/${contractId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newContract}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.project}</label>
            <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseProject}</option>
              {projectsWithoutContract.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.contractNumber}</label>
            <input required value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="CTR-2026-001" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.signedDate}</label>
            <input required type="date" value={form.signedDate} onChange={(e) => setForm({ ...form, signedDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.duration}</label>
            <input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.retention}</label>
            <input type="number" step="0.01" value={form.retentionPct} onChange={(e) => setForm({ ...form, retentionPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.advancePct}</label>
            <input type="number" step="0.01" value={form.advancePaymentPct} onChange={(e) => setForm({ ...form, advancePaymentPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.advanceAmount}</label>
            <input type="number" step="0.01" value={form.advancePaymentAmount} onChange={(e) => setForm({ ...form, advancePaymentAmount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thNumber}</th>
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thRetention}</th>
              <th className="p-3 font-medium">{t.thCerts}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.loading}</td></tr>}
            {!loading && contracts.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.empty}</td></tr>
            )}
            {contracts.map((c) => (
              <tr key={c.id} className="border-t hover:bg-neutral-50">
                <td className="p-3"><Link href={`/contracts/${c.id}`} className="text-primary hover:underline">{c.contractNumber}</Link></td>
                <td className="p-3 font-medium">{c.project.name}</td>
                <td className="p-3">{new Date(c.signedDate).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3">{Number(c.retentionPct)}%</td>
                <td className="p-3">{c.certificates.length}</td>
                <td className="p-3 flex gap-2">
                  <Link href={`/contracts/${c.id}`} className="text-primary hover:opacity-70"><Pencil size={14} /></Link>
                  {c.certificates.length === 0 && (
                    <button onClick={() => removeContract(c.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
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
