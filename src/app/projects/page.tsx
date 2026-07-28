"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { ExpensesByCategoryChart } from "@/components/dashboard-charts";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Coins, TrendingDown, TrendingUp, Briefcase, TrendingUp as CashUp, TrendingDown as CashDown, Pencil, Trash2 } from "lucide-react";

type Certificate = { status: string; netPayable: string };
type ClientPayment = { amount: string };
type Project = {
  id: string;
  code: string;
  name: string;
  status: string;
  contractValue: string;
  client: { name: string };
  expenses: { amount: string; category: string }[];
  contract: { certificates: Certificate[] } | null;
  clientPayments: ClientPayment[];
};
type Client = { id: string; name: string };

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
    title: "المشاريع",
    newProject: "مشروع جديد",
    cancel: "إلغاء",
    code: "كود المشروع *",
    name: "اسم المشروع *",
    client: "العميل *",
    chooseClient: "اختر العميل",
    value: "قيمة العقد *",
    startDate: "تاريخ البدء *",
    status: "الحالة",
    save: "حفظ المشروع",
    saving: "جارٍ الحفظ...",
    err: "تعذر حفظ المشروع — تأكد من البيانات",
    kpiValue: "إجمالي قيمة العقود (المفلترة)",
    kpiExpenses: "إجمالي المصروفات",
    kpiProfit: "إجمالي الأرباح",
    kpiCount: "عدد المشاريع",
    filterClient: "فلترة باسم العميل",
    filterClientPh: "اكتب اسم العميل...",
    allClients: "كل العملاء",
    filterStatus: "فلترة بحالة المشروع",
    allStatuses: "كل الحالات",
    tableTitle: "جدول المشاريع والتدفق النقدي",
    thCode: "كود المشروع",
    thName: "اسم المشروع",
    thClient: "العميل",
    thValue: "قيمة العقد",
    thExpenses: "المصروفات",
    thProfit: "الربح",
    thCollected: "المحصّل (مستخلصات مصروفة)",
    thClientPaid: "المدفوع من العميل",
    thCashFlow: "التدفق النقدي",
    thStatus: "الحالة",
    loading: "جارٍ التحميل...",
    noMatch: "لا يوجد مشاريع مطابقة.",
    total: "الإجمالي",
    statuses: { ONGOING: "جارية", READY_TO_CLOSE: "جاهزة للإغلاق", CLOSED: "مغلقة", DELAYED: "متأخرة" },
    confirmDelete: "تأكيد حذف المشروع نهائيًا؟ العملية لا يمكن التراجع عنها.", errDelete: "تعذر حذف المشروع — راجع صفحة تفاصيل المشروع لمعرفة السبب",
  },
  en: {
    title: "Projects",
    newProject: "New Project",
    cancel: "Cancel",
    code: "Project Code *",
    name: "Project Name *",
    client: "Client *",
    chooseClient: "Choose client",
    value: "Contract Value *",
    startDate: "Start Date *",
    status: "Status",
    save: "Save Project",
    saving: "Saving...",
    err: "Failed to save project — check the data",
    kpiValue: "Total Contract Value (filtered)",
    kpiExpenses: "Total Expenses",
    kpiProfit: "Total Profit",
    kpiCount: "Projects Count",
    filterClient: "Filter by client name",
    filterClientPh: "Type client name...",
    allClients: "All clients",
    filterStatus: "Filter by project status",
    allStatuses: "All statuses",
    tableTitle: "Projects & Cash Flow Table",
    thCode: "Code",
    thName: "Project Name",
    thClient: "Client",
    thValue: "Contract Value",
    thExpenses: "Expenses",
    thProfit: "Profit",
    thCollected: "Collected (paid certificates)",
    thClientPaid: "Paid by Client",
    thCashFlow: "Cash Flow",
    thStatus: "Status",
    loading: "Loading...",
    noMatch: "No matching projects.",
    total: "Total",
    statuses: { ONGOING: "Ongoing", READY_TO_CLOSE: "Ready to Close", CLOSED: "Closed", DELAYED: "Delayed" },
    confirmDelete: "Confirm permanently deleting this project? This cannot be undone.", errDelete: "Failed to delete project — check the project detail page for the reason",
  },
};

export default function ProjectsPage() {
  const locale = useLocale();
  const t = dict[locale];
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

  const [searchClient, setSearchClient] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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
    if (!res.ok) return setError(t.err);
    setForm({ code: "", name: "", clientId: "", contractValue: 0, startDate: "", status: "ONGOING" });
    setShowForm(false);
    load();
  }

  async function removeProject(projectId: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesClient = searchClient === "" || p.client.name === searchClient;
      const matchesStatus = filterStatus === "" || p.status === filterStatus;
      return matchesClient && matchesStatus;
    });
  }, [projects, searchClient, filterStatus]);

  const rows = useMemo(() => {
    return filteredProjects.map((p) => {
      const totalExpenses = p.expenses.reduce((s, e) => s + Number(e.amount), 0);
      const netProfit = Number(p.contractValue) - totalExpenses;
      const totalCollected = (p.contract?.certificates ?? [])
        .filter((c) => c.status === "PAID")
        .reduce((s, c) => s + Number(c.netPayable), 0);
      const totalClientPaid = p.clientPayments.reduce((s, cp) => s + Number(cp.amount), 0);
      const cashFlow = totalClientPaid - totalExpenses;
      return { ...p, totalExpenses, netProfit, totalCollected, totalClientPaid, cashFlow };
    });
  }, [filteredProjects]);

  const kpis = useMemo(() => {
    const totalContracts = rows.reduce((s, p) => s + Number(p.contractValue), 0);
    const totalExpenses = rows.reduce((s, p) => s + p.totalExpenses, 0);
    return { totalContracts, totalExpenses, totalProfit: totalContracts - totalExpenses, count: rows.length };
  }, [rows]);

  const expensesByCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    for (const p of filteredProjects) {
      for (const e of p.expenses) {
        byCat[e.category] = (byCat[e.category] ?? 0) + Number(e.amount);
      }
    }
    return Object.entries(byCat).map(([k, v]) => ({ name: categoryLabels[k]?.[locale] ?? k, value: v }));
  }, [filteredProjects, locale]);

  const statusOptions = [
    { value: "", label: t.allStatuses },
    { value: "ONGOING", label: t.statuses.ONGOING },
    { value: "READY_TO_CLOSE", label: t.statuses.READY_TO_CLOSE },
    { value: "CLOSED", label: t.statuses.CLOSED },
    { value: "DELAYED", label: t.statuses.DELAYED },
  ];

  return (
    <AppShell
      title={t.title}
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newProject}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.code}</label>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="PRJ-005" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.name}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.client}</label>
            <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseClient}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.value}</label>
            <input required type="number" step="0.01" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.startDate}</label>
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.status}</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="ONGOING">{t.statuses.ONGOING}</option>
              <option value="READY_TO_CLOSE">{t.statuses.READY_TO_CLOSE}</option>
              <option value="CLOSED">{t.statuses.CLOSED}</option>
              <option value="DELAYED">{t.statuses.DELAYED}</option>
            </select>
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t.kpiValue} value={`${kpis.totalContracts.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")} ${locale === "ar" ? "ج.م" : "EGP"}`} icon={Coins} tone="primary" />
        <KpiCard label={t.kpiExpenses} value={`${kpis.totalExpenses.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")} ${locale === "ar" ? "ج.م" : "EGP"}`} icon={TrendingDown} tone="danger" />
        <KpiCard label={t.kpiProfit} value={`${kpis.totalProfit.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")} ${locale === "ar" ? "ج.م" : "EGP"}`} icon={TrendingUp} tone="success" />
        <KpiCard label={t.kpiCount} value={String(kpis.count)} icon={Briefcase} tone="primary" />
      </div>

      <ExpensesByCategoryChart data={expensesByCategory} />

      <div className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterClient}</label>
          <select value={searchClient} onChange={(e) => setSearchClient(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            <option value="">{t.allClients}</option>
            {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="sm:w-56">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterStatus}</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b">
          <p className="font-semibold">{t.tableTitle}</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thCode}</th>
              <th className="p-3 font-medium">{t.thName}</th>
              <th className="p-3 font-medium">{t.thClient}</th>
              <th className="p-3 font-medium">{t.thValue}</th>
              <th className="p-3 font-medium">{t.thExpenses}</th>
              <th className="p-3 font-medium">{t.thProfit}</th>
              <th className="p-3 font-medium">{t.thCollected}</th>
              <th className="p-3 font-medium">{t.thClientPaid}</th>
              <th className="p-3 font-medium">{t.thCashFlow}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={11}>{t.loading}</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={11}>{t.noMatch}</td></tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t hover:bg-neutral-50">
                <td className="p-3">
                  <Link href={`/projects/${p.id}`} className="text-primary hover:underline">{p.code}</Link>
                </td>
                <td className="p-3 font-medium">
                  <Link href={`/projects/${p.id}`} className="hover:underline">{p.name}</Link>
                </td>
                <td className="p-3">{p.client.name}</td>
                <td className="p-3">{Number(p.contractValue).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3 text-danger">{p.totalExpenses.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className={`p-3 font-medium ${p.netProfit >= 0 ? "text-success" : "text-danger"}`}>{p.netProfit.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3">{p.totalCollected.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3 font-medium">{p.totalClientPaid.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${p.cashFlow >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {p.cashFlow >= 0 ? <CashUp size={12} /> : <CashDown size={12} />}
                    {p.cashFlow.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}
                  </span>
                </td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3 flex gap-2">
                  <Link href={`/projects/${p.id}`} className="text-primary hover:opacity-70"><Pencil size={14} /></Link>
                  {p.status !== "CLOSED" && (
                    <button onClick={() => removeProject(p.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-neutral-50 font-semibold">
                <td className="p-3" colSpan={3}>{t.total}</td>
                <td className="p-3">{rows.reduce((s, p) => s + Number(p.contractValue), 0).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3 text-danger">{rows.reduce((s, p) => s + p.totalExpenses, 0).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3 text-success">{rows.reduce((s, p) => s + p.netProfit, 0).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3">{rows.reduce((s, p) => s + p.totalCollected, 0).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3">{rows.reduce((s, p) => s + p.totalClientPaid, 0).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3">{rows.reduce((s, p) => s + p.cashFlow, 0).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}</td>
                <td className="p-3" colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </AppShell>
  );
}
