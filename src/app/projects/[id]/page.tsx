"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Lock, RotateCcw, Pencil, Trash2 } from "lucide-react";

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
    savePaymentEdit: "حفظ", cancelPaymentEdit: "إلغاء", confirmDeletePayment: "تأكيد حذف الدفعة؟ العملية لا يمكن التراجع عنها.",
    thPaymentDate: "التاريخ", thPaymentAmount: "القيمة", thPaymentNotes: "ملاحظات",
    totalClientPaid: "إجمالي المدفوع من العميل",
    // نسبة الإنجاز
    progressTitle: "نسبة الإنجاز", saveProgress: "حفظ النسبة", errProgress: "تعذر حفظ النسبة",
    // الموقع على الخريطة
    locationTitle: "موقع المشروع على الخريطة", latitude: "خط العرض (Latitude)", longitude: "خط الطول (Longitude)",
    saveLocation: "حفظ الموقع", errLocation: "تعذر حفظ الموقع", noLocation: "لسه محددتش موقع المشروع على الخريطة.",
    howToGetCoords: "افتح خرائط جوجل، دوس كليك يمين على مكان المشروع، وانسخ الإحداثيات اللي بتظهر.",
    openInMaps: "افتح في خرائط جوجل",
    // البرنامج الزمني (Gantt)
    ganttTitle: "البرنامج الزمني (Gantt)", newTask: "بند جديد", taskName: "اسم البند *",
    startDate: "تاريخ البداية *", endDate: "تاريخ النهاية *", progress: "نسبة الإنجاز %",
    saveTask: "حفظ البند", errTask: "تعذر حفظ البند", noTasks: "لا يوجد بنود بالبرنامج الزمني بعد.",
    deleteTask: "حذف", confirmDeleteTask: "تأكيد حذف البند؟",
    // المراحل
    milestonesTitle: "المراحل (Milestones)", newMilestone: "مرحلة جديدة", milestoneName: "اسم المرحلة *",
    dueDate: "تاريخ الاستحقاق *", saveMilestone: "حفظ المرحلة", errMilestone: "تعذر حفظ المرحلة",
    noMilestones: "لا يوجد مراحل مسجلة بعد.", markComplete: "تعليم كمكتملة", markIncomplete: "إلغاء الإكمال",
    completedOn: "اكتملت في",
    // أوامر التغيير
    variationOrdersTitle: "أوامر التغيير (Variation Orders)", newVariationOrder: "أمر تغيير جديد",
    voNumber: "رقم الأمر *", voDescription: "الوصف *", voAmount: "القيمة (+/-) *",
    saveVariationOrder: "حفظ أمر التغيير", errVariationOrder: "تعذر حفظ أمر التغيير",
    noVariationOrders: "لا يوجد أوامر تغيير مسجلة بعد.", approve: "اعتماد", reject: "رفض",
    thVoNumber: "الرقم", thVoDescription: "الوصف", thVoAmount: "القيمة", thVoStatus: "الحالة",
    voStatusDraft: "مسودة", voStatusApproved: "معتمد", voStatusRejected: "مرفوض",
    effectiveValue: "قيمة العقد الفعلية (بعد أوامر التغيير)",
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
    savePaymentEdit: "Save", cancelPaymentEdit: "Cancel", confirmDeletePayment: "Confirm deleting this payment? This cannot be undone.",
    thPaymentDate: "Date", thPaymentAmount: "Amount", thPaymentNotes: "Notes",
    totalClientPaid: "Total Paid by Client",
    progressTitle: "Progress", saveProgress: "Save Progress", errProgress: "Failed to save progress",
    locationTitle: "Project Location on Map", latitude: "Latitude", longitude: "Longitude",
    saveLocation: "Save Location", errLocation: "Failed to save location", noLocation: "Project location not set yet.",
    howToGetCoords: "Open Google Maps, right-click the project location, and copy the coordinates shown.",
    openInMaps: "Open in Google Maps",
    ganttTitle: "Schedule (Gantt)", newTask: "New Task", taskName: "Task Name *",
    startDate: "Start Date *", endDate: "End Date *", progress: "Progress %",
    saveTask: "Save Task", errTask: "Failed to save task", noTasks: "No schedule tasks yet.",
    deleteTask: "Delete", confirmDeleteTask: "Confirm deleting this task?",
    milestonesTitle: "Milestones", newMilestone: "New Milestone", milestoneName: "Milestone Name *",
    dueDate: "Due Date *", saveMilestone: "Save Milestone", errMilestone: "Failed to save milestone",
    noMilestones: "No milestones recorded yet.", markComplete: "Mark Complete", markIncomplete: "Undo Complete",
    completedOn: "Completed on",
    variationOrdersTitle: "Variation Orders", newVariationOrder: "New Variation Order",
    voNumber: "Order Number *", voDescription: "Description *", voAmount: "Amount (+/-) *",
    saveVariationOrder: "Save Variation Order", errVariationOrder: "Failed to save variation order",
    noVariationOrders: "No variation orders recorded yet.", approve: "Approve", reject: "Reject",
    thVoNumber: "Number", thVoDescription: "Description", thVoAmount: "Amount", thVoStatus: "Status",
    voStatusDraft: "Draft", voStatusApproved: "Approved", voStatusRejected: "Rejected",
    effectiveValue: "Effective Contract Value (after variation orders)",
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
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: 0, date: "", notes: "" });

  // نسبة الإنجاز
  const [progressValue, setProgressValue] = useState(0);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressError, setProgressError] = useState("");

  // الموقع على الخريطة
  const [locationForm, setLocationForm] = useState({ latitude: "", longitude: "" });
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");

  // البرنامج الزمني (Gantt)
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [taskForm, setTaskForm] = useState({ name: "", startDate: "", endDate: "", progress: 0 });

  // المراحل
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneSaving, setMilestoneSaving] = useState(false);
  const [milestoneError, setMilestoneError] = useState("");
  const [milestoneForm, setMilestoneForm] = useState({ name: "", dueDate: "" });

  // أوامر التغيير
  const [showVoForm, setShowVoForm] = useState(false);
  const [voSaving, setVoSaving] = useState(false);
  const [voError, setVoError] = useState("");
  const [voForm, setVoForm] = useState({ orderNumber: "", description: "", amount: 0 });

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setAllocations(data.partnerAllocations.map((a: any) => ({ partnerId: a.partnerId, contributionAmount: Number(a.contributionAmount) })));
      setProjectForm({ name: data.name, contractValue: Number(data.contractValue), description: data.description ?? "" });
      setProgressValue(data.completionPct ?? 0);
      setLocationForm({ latitude: data.latitude != null ? String(data.latitude) : "", longitude: data.longitude != null ? String(data.longitude) : "" });
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

  function startEditPayment(p: any) {
    setEditingPaymentId(p.id);
    setEditPaymentForm({ amount: Number(p.amount), date: new Date(p.date).toISOString().slice(0, 10), notes: p.notes ?? "" });
  }

  async function saveEditedPayment(paymentId: string) {
    const res = await fetch(`/api/client-payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editPaymentForm),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errPayment);
    setEditingPaymentId(null);
    load();
  }

  async function deletePayment(paymentId: string) {
    if (!confirm(t.confirmDeletePayment)) return;
    const res = await fetch(`/api/client-payments/${paymentId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errPayment);
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

  async function saveProgress() {
    setProgressSaving(true);
    setProgressError("");
    const res = await fetch(`/api/projects/${id}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completionPct: progressValue }),
    });
    setProgressSaving(false);
    if (!res.ok) return setProgressError((await res.json()).error ?? t.errProgress);
    load();
  }

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();
    setLocationSaving(true);
    setLocationError("");
    const res = await fetch(`/api/projects/${id}/location`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: locationForm.latitude === "" ? null : Number(locationForm.latitude),
        longitude: locationForm.longitude === "" ? null : Number(locationForm.longitude),
      }),
    });
    setLocationSaving(false);
    if (!res.ok) return setLocationError((await res.json()).error ?? t.errLocation);
    load();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setTaskSaving(true);
    setTaskError("");
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskForm),
    });
    setTaskSaving(false);
    if (!res.ok) return setTaskError((await res.json()).error ?? t.errTask);
    setTaskForm({ name: "", startDate: "", endDate: "", progress: 0 });
    setShowTaskForm(false);
    load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm(t.confirmDeleteTask)) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    load();
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    setMilestoneSaving(true);
    setMilestoneError("");
    const res = await fetch(`/api/projects/${id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(milestoneForm),
    });
    setMilestoneSaving(false);
    if (!res.ok) return setMilestoneError((await res.json()).error ?? t.errMilestone);
    setMilestoneForm({ name: "", dueDate: "" });
    setShowMilestoneForm(false);
    load();
  }

  async function toggleMilestone(milestoneId: string, completed: boolean) {
    await fetch(`/api/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    load();
  }

  async function addVariationOrder(e: React.FormEvent) {
    e.preventDefault();
    setVoSaving(true);
    setVoError("");
    const res = await fetch(`/api/projects/${id}/variation-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voForm),
    });
    setVoSaving(false);
    if (!res.ok) return setVoError((await res.json()).error ?? t.errVariationOrder);
    setVoForm({ orderNumber: "", description: "", amount: 0 });
    setShowVoForm(false);
    load();
  }

  async function transitionVo(voId: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/variation-orders/${voId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errVariationOrder);
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
  const approvedVariations = (project.variationOrders ?? []).filter((v: any) => v.status === "APPROVED").reduce((s: number, v: any) => s + Number(v.amount), 0);
  const effectiveContractValue = Number(project.contractValue) + approvedVariations;
  const netProfit = effectiveContractValue - totalExpenses;

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
      {approvedVariations !== 0 && (
        <p className="text-xs text-neutral-500">
          {t.effectiveValue}: <span className="font-semibold">{effectiveContractValue.toLocaleString(localeCode)} {currency}</span>
        </p>
      )}

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

      {/* نسبة الإنجاز */}
      <div className="card space-y-3">
        <h2 className="font-semibold">{t.progressTitle}</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressValue}%` }} />
          </div>
          <span className="text-sm font-bold w-12 text-left">{progressValue}%</span>
        </div>
        {project.status !== "CLOSED" && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              className="flex-1"
            />
            <button onClick={saveProgress} disabled={progressSaving} className="bg-primary text-white rounded-xl px-4 py-1.5 text-sm font-medium disabled:opacity-60">
              {progressSaving ? t.saving : t.saveProgress}
            </button>
          </div>
        )}
        {progressError && <p className="text-danger text-sm">{progressError}</p>}
      </div>

      {/* الموقع على الخريطة */}
      <div className="card space-y-3">
        <h2 className="font-semibold">{t.locationTitle}</h2>
        {project.latitude != null && project.longitude != null ? (
          <div className="rounded-xl overflow-hidden border" style={{ height: 300 }}>
            <iframe
              title="project-location"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${project.latitude},${project.longitude}&z=15&output=embed`}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-400">{t.noLocation}</p>
        )}
        {project.status !== "CLOSED" && (
          <form onSubmit={saveLocation} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm text-neutral-600 block mb-1">{t.latitude}</label>
              <input type="number" step="0.000001" value={locationForm.latitude} onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="30.123456" />
            </div>
            <div>
              <label className="text-sm text-neutral-600 block mb-1">{t.longitude}</label>
              <input type="number" step="0.000001" value={locationForm.longitude} onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="31.123456" />
            </div>
            <button disabled={locationSaving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60">
              {locationSaving ? t.saving : t.saveLocation}
            </button>
          </form>
        )}
        {locationError && <p className="text-danger text-sm">{locationError}</p>}
        <p className="text-xs text-neutral-400">
          {t.howToGetCoords}{" "}
          <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {t.openInMaps}
          </a>
        </p>
      </div>

      {/* البرنامج الزمني (Gantt) */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.ganttTitle}</h2>
        {project.status !== "CLOSED" && (
          <button onClick={() => setShowTaskForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            {showTaskForm ? <X size={14} /> : <Plus size={14} />} {t.newTask}
          </button>
        )}
      </div>
      {showTaskForm && (
        <form onSubmit={addTask} className="card grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.taskName}</label>
            <input required value={taskForm.name} onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.startDate}</label>
            <input required type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.endDate}</label>
            <input required type="date" value={taskForm.endDate} onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {taskError && <p className="text-danger text-sm sm:col-span-4">{taskError}</p>}
          <div className="sm:col-span-4">
            <button disabled={taskSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {taskSaving ? t.saving : t.saveTask}
            </button>
          </div>
        </form>
      )}
      <div className="card space-y-3">
        {(project.tasks ?? []).length === 0 && <p className="text-sm text-neutral-400">{t.noTasks}</p>}
        {(project.tasks ?? []).length > 0 && (() => {
          const tasks = project.tasks;
          const allDates = tasks.flatMap((tk: any) => [new Date(tk.startDate).getTime(), new Date(tk.endDate).getTime()]);
          const minDate = Math.min(...allDates);
          const maxDate = Math.max(...allDates);
          const span = Math.max(maxDate - minDate, 1);
          return (
            <div className="space-y-2">
              {tasks.map((tk: any) => {
                const left = ((new Date(tk.startDate).getTime() - minDate) / span) * 100;
                const width = Math.max(((new Date(tk.endDate).getTime() - new Date(tk.startDate).getTime()) / span) * 100, 2);
                return (
                  <div key={tk.id} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate shrink-0" title={tk.name}>{tk.name}</span>
                    <div className="flex-1 relative h-6 bg-neutral-50 rounded-lg">
                      <div
                        className="absolute h-full rounded-lg bg-primary/20 border border-primary/40 flex items-center overflow-hidden"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <div className="h-full bg-primary" style={{ width: `${tk.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 w-10 shrink-0">{tk.progress}%</span>
                    {project.status !== "CLOSED" && (
                      <button onClick={() => deleteTask(tk.id)} className="text-danger text-xs shrink-0">{t.deleteTask}</button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* المراحل (Milestones) */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.milestonesTitle}</h2>
        {project.status !== "CLOSED" && (
          <button onClick={() => setShowMilestoneForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            {showMilestoneForm ? <X size={14} /> : <Plus size={14} />} {t.newMilestone}
          </button>
        )}
      </div>
      {showMilestoneForm && (
        <form onSubmit={addMilestone} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.milestoneName}</label>
            <input required value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.dueDate}</label>
            <input required type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {milestoneError && <p className="text-danger text-sm sm:col-span-3">{milestoneError}</p>}
          <div className="sm:col-span-3">
            <button disabled={milestoneSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {milestoneSaving ? t.saving : t.saveMilestone}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        {(project.milestones ?? []).length === 0 ? (
          <p className="p-4 text-sm text-neutral-400">{t.noMilestones}</p>
        ) : (
          <ul className="divide-y">
            {project.milestones.map((m: any) => (
              <li key={m.id} className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={m.completed}
                    disabled={project.status === "CLOSED"}
                    onChange={(e) => toggleMilestone(m.id, e.target.checked)}
                  />
                  <div>
                    <p className={`text-sm font-medium ${m.completed ? "line-through text-neutral-400" : ""}`}>{m.name}</p>
                    <p className="text-xs text-neutral-400">
                      {t.dueDate.replace(" *", "")}: {new Date(m.dueDate).toLocaleDateString(localeCode)}
                      {m.completed && m.completedAt && ` — ${t.completedOn} ${new Date(m.completedAt).toLocaleDateString(localeCode)}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* أوامر التغيير (Variation Orders) */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.variationOrdersTitle}</h2>
        {project.status !== "CLOSED" && (
          <button onClick={() => setShowVoForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            {showVoForm ? <X size={14} /> : <Plus size={14} />} {t.newVariationOrder}
          </button>
        )}
      </div>
      {showVoForm && (
        <form onSubmit={addVariationOrder} className="card grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.voNumber}</label>
            <input required value={voForm.orderNumber} onChange={(e) => setVoForm({ ...voForm, orderNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="VO-001" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.voDescription}</label>
            <input required value={voForm.description} onChange={(e) => setVoForm({ ...voForm, description: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.voAmount}</label>
            <input required type="number" step="0.01" value={voForm.amount} onChange={(e) => setVoForm({ ...voForm, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {voError && <p className="text-danger text-sm sm:col-span-4">{voError}</p>}
          <div className="sm:col-span-4">
            <button disabled={voSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {voSaving ? t.saving : t.saveVariationOrder}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thVoNumber}</th>
              <th className="p-3 font-medium">{t.thVoDescription}</th>
              <th className="p-3 font-medium">{t.thVoAmount}</th>
              <th className="p-3 font-medium">{t.thVoStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(project.variationOrders ?? []).length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.noVariationOrders}</td></tr>
            )}
            {(project.variationOrders ?? []).map((v: any) => (
              <tr key={v.id} className="border-t">
                <td className="p-3">{v.orderNumber}</td>
                <td className="p-3">{v.description}</td>
                <td className={`p-3 font-semibold ${Number(v.amount) >= 0 ? "text-success" : "text-danger"}`}>{Number(v.amount).toLocaleString(localeCode)} {currency}</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${v.status === "APPROVED" ? "bg-success/10 text-success" : v.status === "REJECTED" ? "bg-danger/10 text-danger" : "bg-neutral-100 text-neutral-500"}`}>
                    {v.status === "APPROVED" ? t.voStatusApproved : v.status === "REJECTED" ? t.voStatusRejected : t.voStatusDraft}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  {v.status === "DRAFT" && (
                    <>
                      <button onClick={() => transitionVo(v.id, "APPROVED")} className="text-success text-xs">{t.approve}</button>
                      <button onClick={() => transitionVo(v.id, "REJECTED")} className="text-danger text-xs">{t.reject}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(project.clientPayments ?? []).length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={4}>{t.noPayments}</td></tr>
            )}
            {(project.clientPayments ?? []).map((p: any) =>
              editingPaymentId === p.id ? (
                <tr key={p.id} className="border-t bg-neutral-50">
                  <td className="p-2">
                    <input type="date" value={editPaymentForm.date} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, date: e.target.value })} className="w-full border rounded-lg px-2 py-1" />
                  </td>
                  <td className="p-2">
                    <input type="number" step="0.01" value={editPaymentForm.amount} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" />
                  </td>
                  <td className="p-2">
                    <input value={editPaymentForm.notes} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })} className="w-full border rounded-lg px-2 py-1" />
                  </td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEditedPayment(p.id)} className="text-success text-xs font-medium">{t.savePaymentEdit}</button>
                    <button onClick={() => setEditingPaymentId(null)} className="text-neutral-500 text-xs">{t.cancelPaymentEdit}</button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{new Date(p.date).toLocaleDateString(localeCode)}</td>
                  <td className="p-3 font-semibold text-success">{Number(p.amount).toLocaleString(localeCode)} {currency}</td>
                  <td className="p-3">{p.notes || "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEditPayment(p)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => deletePayment(p.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            )}
          </tbody>
          {(project.clientPayments ?? []).length > 0 && (
            <tfoot>
              <tr className="border-t bg-neutral-50 font-semibold">
                <td className="p-3">{t.totalClientPaid}</td>
                <td className="p-3 text-success">{totalClientPaid.toLocaleString(localeCode)} {currency}</td>
                <td className="p-3" colSpan={2}></td>
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
