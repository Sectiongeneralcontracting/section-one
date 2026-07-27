"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Star } from "lucide-react";

const contractStatusLabels: Record<string, { ar: string; en: string }> = {
  ACTIVE: { ar: "ساري", en: "Active" },
  COMPLETED: { ar: "مكتمل", en: "Completed" },
  TERMINATED: { ar: "منتهي", en: "Terminated" },
};

const dict = {
  ar: {
    loading: "جارٍ التحميل...", contractsTitle: "العقود", newContract: "عقد جديد على مشروع", cancel: "إلغاء",
    project: "المشروع *", chooseProject: "اختر المشروع", contractNumber: "رقم العقد *",
    scopeOfWork: "نطاق العمل", contractValue: "قيمة العقد *", signedDate: "تاريخ التوقيع *",
    save: "حفظ العقد", saving: "جارٍ الحفظ...", err: "تعذر حفظ العقد",
    thProject: "المشروع", thNumber: "رقم العقد", thValue: "القيمة", thPaid: "المدفوع", thStatus: "الحالة",
    noContracts: "لا يوجد عقود بعد.",
    evalTitle: "تقييم الأداء", newEval: "تقييم جديد",
    quality: "الجودة (1-5)", timeliness: "الالتزام بالمواعيد (1-5)", safety: "السلامة (1-5)",
    notes: "ملاحظات", saveEval: "حفظ التقييم", errEval: "تعذر حفظ التقييم", noEvals: "لا يوجد تقييمات بعد.",
    thDate: "التاريخ", thQuality: "الجودة", thTimeliness: "الالتزام", thSafety: "السلامة", thAvg: "المتوسط",
  },
  en: {
    loading: "Loading...", contractsTitle: "Contracts", newContract: "New Contract on Project", cancel: "Cancel",
    project: "Project *", chooseProject: "Choose project", contractNumber: "Contract Number *",
    scopeOfWork: "Scope of Work", contractValue: "Contract Value *", signedDate: "Signed Date *",
    save: "Save Contract", saving: "Saving...", err: "Failed to save contract",
    thProject: "Project", thNumber: "Contract No.", thValue: "Value", thPaid: "Paid", thStatus: "Status",
    noContracts: "No contracts yet.",
    evalTitle: "Performance Evaluation", newEval: "New Evaluation",
    quality: "Quality (1-5)", timeliness: "Timeliness (1-5)", safety: "Safety (1-5)",
    notes: "Notes", saveEval: "Save Evaluation", errEval: "Failed to save evaluation", noEvals: "No evaluations yet.",
    thDate: "Date", thQuality: "Quality", thTimeliness: "Timeliness", thSafety: "Safety", thAvg: "Average",
  },
};

export default function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  const [sub, setSub] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractSaving, setContractSaving] = useState(false);
  const [contractError, setContractError] = useState("");
  const [contractForm, setContractForm] = useState({ projectId: "", contractNumber: "", scopeOfWork: "", contractValue: 0, signedDate: "" });

  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalSaving, setEvalSaving] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [evalForm, setEvalForm] = useState({ projectId: "", qualityScore: 5, timelinessScore: 5, safetyScore: 5, notes: "" });

  async function load() {
    const res = await fetch(`/api/subcontractors/${id}`);
    if (res.ok) setSub(await res.json());
    const pRes = await fetch("/api/projects");
    if (pRes.ok) setProjects(await pRes.json());
  }

  useEffect(() => { load(); }, [id]);

  async function addContract(e: React.FormEvent) {
    e.preventDefault();
    setContractSaving(true);
    setContractError("");
    const res = await fetch("/api/subcontractor-contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contractForm, subcontractorId: id }),
    });
    setContractSaving(false);
    if (!res.ok) return setContractError((await res.json()).error ?? t.err);
    setContractForm({ projectId: "", contractNumber: "", scopeOfWork: "", contractValue: 0, signedDate: "" });
    setShowContractForm(false);
    load();
  }

  async function addEvaluation(e: React.FormEvent) {
    e.preventDefault();
    setEvalSaving(true);
    setEvalError("");
    const res = await fetch("/api/subcontractor-evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...evalForm, subcontractorId: id, projectId: evalForm.projectId || undefined }),
    });
    setEvalSaving(false);
    if (!res.ok) return setEvalError((await res.json()).error ?? t.errEval);
    setEvalForm({ projectId: "", qualityScore: 5, timelinessScore: 5, safetyScore: 5, notes: "" });
    setShowEvalForm(false);
    load();
  }

  if (!sub) return <AppShell title={t.loading}><></></AppShell>;

  return (
    <AppShell title={sub.name}>
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <p><span className="text-neutral-500">{locale === "ar" ? "التخصص" : "Specialty"}: </span>{sub.specialty || "—"}</p>
          <p><span className="text-neutral-500">{locale === "ar" ? "الهاتف" : "Phone"}: </span>{sub.phone || "—"}</p>
          <p><span className="text-neutral-500">{locale === "ar" ? "البريد" : "Email"}: </span>{sub.email || "—"}</p>
        </div>
      </div>

      {/* العقود */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.contractsTitle}</h2>
        <button onClick={() => setShowContractForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showContractForm ? <X size={14} /> : <Plus size={14} />} {t.newContract}
        </button>
      </div>
      {showContractForm && (
        <form onSubmit={addContract} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.project}</label>
            <select required value={contractForm.projectId} onChange={(e) => setContractForm({ ...contractForm, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseProject}</option>
              {projects.filter((p: any) => p.status !== "CLOSED").map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.contractNumber}</label>
            <input required value={contractForm.contractNumber} onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.contractValue}</label>
            <input required type="number" step="0.01" value={contractForm.contractValue} onChange={(e) => setContractForm({ ...contractForm, contractValue: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.signedDate}</label>
            <input required type="date" value={contractForm.signedDate} onChange={(e) => setContractForm({ ...contractForm, signedDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.scopeOfWork}</label>
            <input value={contractForm.scopeOfWork} onChange={(e) => setContractForm({ ...contractForm, scopeOfWork: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {contractError && <p className="text-danger text-sm lg:col-span-3">{contractError}</p>}
          <div className="lg:col-span-3">
            <button disabled={contractSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {contractSaving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium">{t.thNumber}</th>
              <th className="p-3 font-medium">{t.thValue}</th>
              <th className="p-3 font-medium">{t.thPaid}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {sub.contracts.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.noContracts}</td></tr>}
            {sub.contracts.map((c: any) => {
              const paid = c.payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.project.name}</td>
                  <td className="p-3"><Link href={`/contractors/contracts/${c.id}`} className="text-primary hover:underline">{c.contractNumber}</Link></td>
                  <td className="p-3">{Number(c.contractValue).toLocaleString(localeCode)} {currency}</td>
                  <td className="p-3 text-success">{paid.toLocaleString(localeCode)} {currency}</td>
                  <td className="p-3">{contractStatusLabels[c.status]?.[locale]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* تقييم الأداء */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.evalTitle}</h2>
        <button onClick={() => setShowEvalForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showEvalForm ? <X size={14} /> : <Plus size={14} />} {t.newEval}
        </button>
      </div>
      {showEvalForm && (
        <form onSubmit={addEvaluation} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.quality}</label>
            <input required type="number" min={1} max={5} value={evalForm.qualityScore} onChange={(e) => setEvalForm({ ...evalForm, qualityScore: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.timeliness}</label>
            <input required type="number" min={1} max={5} value={evalForm.timelinessScore} onChange={(e) => setEvalForm({ ...evalForm, timelinessScore: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.safety}</label>
            <input required type="number" min={1} max={5} value={evalForm.safetyScore} onChange={(e) => setEvalForm({ ...evalForm, safetyScore: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="sm:col-span-3">
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={evalForm.notes} onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {evalError && <p className="text-danger text-sm sm:col-span-3">{evalError}</p>}
          <div className="sm:col-span-3">
            <button disabled={evalSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {evalSaving ? t.saving : t.saveEval}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thQuality}</th>
              <th className="p-3 font-medium">{t.thTimeliness}</th>
              <th className="p-3 font-medium">{t.thSafety}</th>
              <th className="p-3 font-medium">{t.thAvg}</th>
            </tr>
          </thead>
          <tbody>
            {sub.evaluations.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.noEvals}</td></tr>}
            {sub.evaluations.map((ev: any) => (
              <tr key={ev.id} className="border-t">
                <td className="p-3">{new Date(ev.evaluatedAt).toLocaleDateString(localeCode)}</td>
                <td className="p-3">{ev.qualityScore}/5</td>
                <td className="p-3">{ev.timelinessScore}/5</td>
                <td className="p-3">{ev.safetyScore}/5</td>
                <td className="p-3 font-semibold flex items-center gap-1">
                  <Star size={14} className="text-warning fill-warning" />
                  {((ev.qualityScore + ev.timelinessScore + ev.safetyScore) / 3).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
