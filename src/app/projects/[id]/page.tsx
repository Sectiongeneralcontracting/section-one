"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Lock, RotateCcw } from "lucide-react";

const categoryLabels: Record<string, { ar: string; en: string }> = {
  MATERIALS: { ar: "مواد", en: "Materials" },
  LABOR: { ar: "عمالة", en: "Labor" },
  SUBCONTRACTOR: { ar: "مقاولي باطن", en: "Subcontractors" },
  EQUIPMENT: { ar: "معدات", en: "Equipment" },
  ADMINISTRATIVE: { ar: "مصروفات إدارية", en: "Administrative" },
  OTHER: { ar: "أخرى", en: "Other" },
};

const dict = {
  ar: {
    loading: "جارٍ التحميل...", edit: "تعديل", cancelEdit: "إلغاء التعديل",
    close: "إغلاق المشروع", reopen: "إعادة فتح", backToProjects: "رجوع للمشاريع",
    client: "العميل", value: "قيمة العقد", totalExpenses: "إجمالي المصروفات", netProfit: "صافي الربح",
    editTitle: "تعديل بيانات المشروع", name: "اسم المشروع", description: "وصف المشروع",
    save: "حفظ التعديلات", saving: "جارٍ الحفظ...", errSave: "تعذر حفظ التعديلات",
    projectCode: "كود المشروع", expenses: "المصروفات", newExpense: "مصروف جديد",
    category: "البند", amount: "القيمة *", desc: "وصف", saveExpense: "حفظ المصروف", errExpense: "تعذر إضافة المصروف",
    thDate: "التاريخ", thCategory: "البند", thDesc: "الوصف", thAmount: "القيمة", noExpenses: "لا يوجد مصروفات مسجلة بعد.",
    partnersTitle: "مساهمة الشركاء في هذا المشروع",
    partnersDesc: "اختار الشركاء المشاركين في المشروع ده وحط قيمة مساهمة كل واحد فيهم — النسبة % بتتحسب تلقائيًا من نسبة كل شريك لإجمالي المساهمات",
    contributionPh: "قيمة المساهمة", noPartners: "لا يوجد شركاء مسجلين في النظام بعد.",
    totalContributions: "إجمالي المساهمات", saveAllocations: "حفظ مساهمات الشركاء", errAllocations: "تعذر الحفظ",
    closingReportTitle: "تقرير الإغلاق", closedOn: "أُغلق بتاريخ", confirmClose: "تأكيد إغلاق المشروع وإنشاء تقرير الإغلاق؟",
    errClose: "تعذر الإغلاق", confirmReopen: "تأكيد إعادة فتح المشروع؟", errReopen: "تعذر إعادة الفتح",
    clientPaymentsTitle: "مدفوعات العميل الفعلية", newPayment: "دفعة جديدة",
    paymentAmount: "قيمة الدفعة *", paymentDate: "تاريخ الدفعة", paymentNotes: "ملاحظات",
    savePayment: "حفظ الدفعة", errPayment: "تعذر تسجيل الدفعة", noPayments: "لا يوجد دفعات مسجلة بعد.",
    thPaymentDate: "التاريخ", thPaymentAmount: "القيمة", thPaymentNotes: "ملاحظات",
    totalClientPaid: "إجمالي المدفوع من العميل",
  },
  en: {
    loading: "Loading...", edit: "Edit", cancelEdit: "Cancel Edit",
    close: "Close Project", reopen: "Reopen", backToProjects: "Back to Projects",
    client: "Client", value: "Contract Value", totalExpenses: "Total Expenses", netProfit: "Net Profit",
    editTitle: "Edit Project Info", name: "Project Name", description: "Project Description",
    save: "Save Changes", saving: "Saving...", errSave: "Failed to save changes",
    projectCode: "Project Code", expenses: "Expenses", newExpense: "New Expense",
    category: "Category", amount: "Amount *", desc: "Description", saveExpense: "Save Expense", errExpense: "Failed to add expense",
    thDate: "Date", thCategory: "Category", thDesc: "Description", thAmount: "Amount", noExpenses: "No expenses recorded yet.",
    partnersTitle: "Partner Contributions in this Project",
    partnersDesc: "Select the partners involved in this project and set each one's contribution — their profit % is calculated automatically from their share of total contributions.",
    contributionPh: "Contribution Amount", noPartners: "No partners registered in the system yet.",
    totalContributions: "Total Contributions", saveAllocations: "Save Partner Contributions", errAllocations: "Failed to save",
    closingReportTitle: "Closing Report", closedOn: "Closed on", confirmClose: "Confirm closing the project and generating the closing report?",
    errClose: "Failed to close", confirmReopen: "Confirm reopening the project?", errReopen: "Failed to reopen",
    clientPaymentsTitle: "Actual Client Payments", newPayment: "New Payment",
    paymentAmount: "Payment Amount *", paymentDate: "Payment Date", paymentNotes: "Notes",
    savePayment: "Save Payment", errPayment: "Failed to record payment", noPayments: "No payments recorded yet.",
    thPaymentDate: "Date", thPaymentAmount: "Amount", thPaymentNotes: "Notes",
    totalClientPaid: "Total Paid by Client",
  },
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const [project, setProject] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "MATERIALS", amount: 0, description: "" });

  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<{ partnerId: string; contributionAmount: number }[]>([]);
  const [allocError, setAllocError] = useState("");
  const [allocSaving, setAllocSaving] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", contractValue: 0, description: "" });
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentForm, setPaymentForm] = useState({ amount: 0, date: "", notes: "" });

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setAllocations(data.partnerAllocations.map((a: any) => ({ partnerId: a.partnerId, contributionAmount: Number(a.contributionAmount) })));
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
    if (!res.ok) return setProjectError(t.errSave);
    setEditingProject(false);
    load();
  }

  function toggleAllocPartner(partnerId: string) {
    setAllocations((prev) =>
      prev.some((a) => a.partnerId === partnerId)
        ? prev.filter((a) => a.partnerId !== partnerId)
        : [...prev, { partnerId, contributionAmount: 0 }]
    );
  }

  function updateAllocAmount(partnerId: string, amount: number) {
    setAllocations((prev) => prev.map((a) => (a.partnerId === partnerId ? { ...a, contributionAmount: amount } : a)));
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
    if (!res.ok) return setAllocError((await res.json()).error ?? t.errAllocations);
    load();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentSaving(true);
    setPaymentError("");
    const res = await fetch(`/api/projects/${id}/client-payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    });
    setPaymentSaving(false);
    if (!res.ok) return setPaymentError(t.errPayment);
    setPaymentForm({ amount: 0, date: "", notes: "" });
    setShowPaymentForm(false);
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
    if (!res.ok) return setError(t.errExpense);
    setForm({ category: "MATERIALS", amount: 0, description: "" });
    setShowForm(false);
    load();
  }

  async function closeProject() {
    if (!confirm(t.confirmClose)) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errClose);
    load();
  }

  async function reopenProject() {
    if (!confirm(t.confirmReopen)) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errReopen);
    load();
  }

  if (!project) {
    return <AppShell title={t.loading}><></></AppShell>;
  }

  const totalExpenses = project.expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalClientPaid = (project.clientPayments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const netProfit = Number(project.contractValue) - totalExpenses;

  return (
    <AppShell
      title={project.name}
      action={
        <div className="flex gap-2">
          {project.status !== "CLOSED" && (
            <button onClick={() => setEditingProject((v) => !v)} className="border text-sm px-4 py-2 rounded-xl">
              {editingProject ? t.cancelEdit : t.edit}
            </button>
          )}
          {project.status !== "CLOSED" ? (
            <button onClick={closeProject} className="bg-danger text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
              <Lock size={16} /> {t.close}
            </button>
          ) : (
            <button onClick={reopenProject} className="bg-neutral-700 text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
              <RotateCcw size={16} /> {t.reopen}
            </button>
          )}
          <button onClick={() => router.push("/projects")} className="text-sm px-4 py-2 rounded-xl border">
            {t.backToProjects}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">{t.client}</p><p className="font-bold">{project.client.name}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.value}</p><p className="font-bold">{Number(project.contractValue).toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.totalExpenses}</p><p className="font-bold text-danger">{totalExpenses.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.totalClientPaid}</p><p className="font-bold text-success">{totalClientPaid.toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.netProfit}</p><p className="font-bold text-success">{netProfit.toLocaleString(localeCode)} {currency}</p></div>
      </div>

      {editingProject && (
        <form onSubmit={saveProjectInfo} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p className="sm:col-span-2 font-semibold text-sm text-neutral-600">{t.editTitle}</p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.name}</label>
            <input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.value}</label>
            <input type="number" step="0.01" value={projectForm.contractValue} onChange={(e) => setProjectForm({ ...projectForm, contractValue: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.description}</label>
            <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full border rounded-xl px-3 py-2" rows={2} />
          </div>
          {projectError && <p className="text-danger text-sm sm:col-span-2">{projectError}</p>}
          <div className="sm:col-span-2">
            <button disabled={projectSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {projectSaving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3">
        <StatusBadge status={project.status} />
        <span className="text-sm text-neutral-500">{t.projectCode}: {project.code}</span>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.expenses}</h2>
        {project.status !== "CLOSED" && (
          <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            {showForm ? <X size={14} /> : <Plus size={14} />} {t.newExpense}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={addExpense} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.category}</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.amount}</label>
            <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.desc}</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.saveExpense}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thCategory}</th>
              <th className="p-3 font-medium">{t.thDesc}</th>
              <th className="p-3 font-medium">{t.thAmount}</th>
            </tr>
          </thead>
          <tbody>
            {project.expenses.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={4}>{t.noExpenses}</td></tr>
            )}
            {project.expenses.map((e: any) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{new Date(e.date).toLocaleDateString(localeCode)}</td>
                <td className="p-3">{categoryLabels[e.category]?.[locale]}</td>
                <td className="p-3">{e.description || "—"}</td>
                <td className="p-3">{Number(e.amount).toLocaleString(localeCode)} {currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.clientPaymentsTitle}</h2>
        {project.status !== "CLOSED" && (
          <button onClick={() => setShowPaymentForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            {showPaymentForm ? <X size={14} /> : <Plus size={14} />} {t.newPayment}
          </button>
        )}
      </div>

      {showPaymentForm && (
        <form onSubmit={addPayment} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.paymentAmount}</label>
            <input required type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.paymentDate}</label>
            <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.paymentNotes}</label>
            <input value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {paymentError && <p className="text-danger text-sm sm:col-span-3">{paymentError}</p>}
          <div className="sm:col-span-3">
            <button disabled={paymentSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {paymentSaving ? t.saving : t.savePayment}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thPaymentDate}</th>
              <th className="p-3 font-medium">{t.thPaymentAmount}</th>
              <th className="p-3 font-medium">{t.thPaymentNotes}</th>
            </tr>
          </thead>
          <tbody>
            {(project.clientPayments ?? []).length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={3}>{t.noPayments}</td></tr>
            )}
            {(project.clientPayments ?? []).map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{new Date(p.date).toLocaleDateString(localeCode)}</td>
                <td className="p-3 font-semibold text-success">{Number(p.amount).toLocaleString(localeCode)} {currency}</td>
                <td className="p-3">{p.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
          {(project.clientPayments ?? []).length > 0 && (
            <tfoot>
              <tr className="border-t bg-neutral-50 font-semibold">
                <td className="p-3">{t.totalClientPaid}</td>
                <td className="p-3 text-success">{totalClientPaid.toLocaleString(localeCode)} {currency}</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">{t.partnersTitle}</h2>
        <p className="text-xs text-neutral-400">{t.partnersDesc}</p>
        <div className="space-y-2">
          {allPartners.map((p) => {
            const alloc = allocations.find((a) => a.partnerId === p.id);
            const totalContrib = allocations.reduce((s, a) => s + Number(a.contributionAmount || 0), 0);
            const pct = alloc && totalContrib > 0 ? Math.round((Number(alloc.contributionAmount) / totalContrib) * 1000) / 10 : 0;
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
                  <>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={t.contributionPh}
                      value={alloc.contributionAmount}
                      onChange={(e) => updateAllocAmount(p.id, Number(e.target.value))}
                      disabled={project.status === "CLOSED"}
                      className="w-32 border rounded-lg px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-neutral-400">{currency}</span>
                    <span className="text-xs text-primary font-medium w-14">{alloc.contributionAmount > 0 ? `${pct}%` : "—"}</span>
                  </>
                )}
              </div>
            );
          })}
          {allPartners.length === 0 && <p className="text-sm text-neutral-400">{t.noPartners}</p>}
        </div>
        <p className="text-sm text-neutral-500">
          {t.totalContributions}: {allocations.reduce((s, a) => s + Number(a.contributionAmount || 0), 0).toLocaleString(localeCode)} {currency}
        </p>
        {allocError && <p className="text-danger text-sm">{allocError}</p>}
        {project.status !== "CLOSED" && (
          <button onClick={saveAllocations} disabled={allocSaving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60">
            {allocSaving ? t.saving : t.saveAllocations}
          </button>
        )}
      </div>

      {project.closingReports?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-2">{t.closingReportTitle}</h2>
          {project.closingReports.map((r: any) => (
            <p key={r.id} className="text-sm text-neutral-600">
              {t.closedOn} {new Date(r.closedAt).toLocaleDateString(localeCode)} — {t.netProfit}:{" "}
              <span className="font-bold text-success">{Number(r.netProfit).toLocaleString(localeCode)} {currency}</span>
            </p>
          ))}
        </div>
      )}
    </AppShell>
  );
}
