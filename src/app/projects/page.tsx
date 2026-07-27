"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { ExpensesByCategoryChart } from "@/components/dashboard-charts";
import { Plus, X, Coins, TrendingDown, TrendingUp, Briefcase, TrendingUp as CashUp, TrendingDown as CashDown } from "lucide-react";

type Certificate = { status: string; netPayable: string };
type Project = {
  id: string;
  code: string;
  name: string;
  status: string;
  contractValue: string;
  client: { name: string };
  expenses: { amount: string; category: string }[];
  contract: { certificates: Certificate[] } | null;
};
type Client = { id: string; name: string };

const categoryLabels: Record<string, string> = {
  MATERIALS: "مواد",
  LABOR: "عمالة",
  SUBCONTRACTOR: "مقاولي باطن",
  EQUIPMENT: "معدات",
  ADMINISTRATIVE: "مصروفات إدارية",
  OTHER: "أخرى",
};

const statusOptions = [
  { value: "", label: "كل الحالات" },
  { value: "ONGOING", label: "جارية" },
  { value: "READY_TO_CLOSE", label: "جاهزة للإغلاق" },
  { value: "CLOSED", label: "مغلقة" },
  { value: "DELAYED", label: "متأخرة" },
];

export default function ProjectsPage() {
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
    if (!res.ok) return setError("تعذر حفظ المشروع — تأكد من البيانات");
    setForm({ code: "", name: "", clientId: "", contractValue: 0, startDate: "", status: "ONGOING" });
    setShowForm(false);
    load();
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesClient = searchClient.trim() === "" || p.client.name.toLowerCase().includes(searchClient.trim().toLowerCase());
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
      const cashFlow = totalCollected - totalExpenses;
      return { ...p, totalExpenses, netProfit, totalCollected, cashFlow };
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
    return Object.entries(byCat).map(([k, v]) => ({ name: categoryLabels[k] ?? k, value: v }));
  }, [filteredProjects]);

  return (
    <AppShell
      title="المشاريع"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "إلغاء" : "مشروع جديد"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">كود المشروع *</label>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="PRJ-005" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">اسم المشروع *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">العميل *</label>
            <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">اختر العميل</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">قيمة العقد *</label>
            <input required type="number" step="0.01" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">تاريخ البدء *</label>
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">الحالة</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="ONGOING">جارية</option>
              <option value="READY_TO_CLOSE">جاهزة للإغلاق</option>
              <option value="CLOSED">مغلقة</option>
              <option value="DELAYED">متأخرة</option>
            </select>
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحفظ..." : "حفظ المشروع"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="إجمالي قيمة العقود (المفلترة)" value={`${kpis.totalContracts.toLocaleString("ar-EG")} ج.م`} icon={Coins} tone="primary" />
        <KpiCard label="إجمالي المصروفات" value={`${kpis.totalExpenses.toLocaleString("ar-EG")} ج.م`} icon={TrendingDown} tone="danger" />
        <KpiCard label="إجمالي الأرباح" value={`${kpis.totalProfit.toLocaleString("ar-EG")} ج.م`} icon={TrendingUp} tone="success" />
        <KpiCard label="عدد المشاريع" value={String(kpis.count)} icon={Briefcase} tone="primary" />
      </div>

      <ExpensesByCategoryChart data={expensesByCategory} />

      <div className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-sm text-neutral-600 block mb-1">فلترة باسم العميل</label>
          <input
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            placeholder="اكتب اسم العميل..."
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="sm:w-56">
          <label className="text-sm text-neutral-600 block mb-1">فلترة بحالة المشروع</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b">
          <p className="font-semibold">جدول المشاريع والتدفق النقدي</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">كود المشروع</th>
              <th className="p-3 font-medium">اسم المشروع</th>
              <th className="p-3 font-medium">العميل</th>
              <th className="p-3 font-medium">قيمة العقد</th>
              <th className="p-3 font-medium">المصروفات</th>
              <th className="p-3 font-medium">الربح</th>
              <th className="p-3 font-medium">المحصّل (مستخلصات مصروفة)</th>
              <th className="p-3 font-medium">التدفق النقدي</th>
              <th className="p-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={9}>جارٍ التحميل...</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={9}>لا يوجد مشاريع مطابقة.</td></tr>
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
                <td className="p-3">{Number(p.contractValue).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3 text-danger">{p.totalExpenses.toLocaleString("ar-EG")} ج.م</td>
                <td className={`p-3 font-medium ${p.netProfit >= 0 ? "text-success" : "text-danger"}`}>{p.netProfit.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{p.totalCollected.toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${p.cashFlow >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {p.cashFlow >= 0 ? <CashUp size={12} /> : <CashDown size={12} />}
                    {p.cashFlow.toLocaleString("ar-EG")} ج.م
                  </span>
                </td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-neutral-50 font-semibold">
                <td className="p-3" colSpan={3}>الإجمالي</td>
                <td className="p-3">{rows.reduce((s, p) => s + Number(p.contractValue), 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3 text-danger">{rows.reduce((s, p) => s + p.totalExpenses, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3 text-success">{rows.reduce((s, p) => s + p.netProfit, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{rows.reduce((s, p) => s + p.totalCollected, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3">{rows.reduce((s, p) => s + p.cashFlow, 0).toLocaleString("ar-EG")} ج.م</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </AppShell>
  );
}
