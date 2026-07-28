"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Check, Ban, Trash2 } from "lucide-react";

const typeLabels: Record<string, { ar: string; en: string }> = {
  PURCHASE: { ar: "شراء من مورد", en: "Purchase from Supplier" },
  LABOR: { ar: "طلب عمالة", en: "Labor Request" },
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  PENDING_FINANCE: { ar: "بانتظار المدير المالي", en: "Pending Finance" },
  PENDING_ADMIN: { ar: "بانتظار الأدمن", en: "Pending Admin" },
  APPROVED: { ar: "معتمد نهائيًا", en: "Approved" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
};
const statusStyles: Record<string, string> = {
  PENDING_FINANCE: "bg-secondary/10 text-secondary",
  PENDING_ADMIN: "bg-primary/10 text-primary",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
};

const dict = {
  ar: {
    title: "طلبات الموقع (شراء / عمالة)", newRequest: "طلب جديد", cancel: "إلغاء",
    project: "المشروع *", chooseProject: "اختر المشروع", type: "نوع الطلب",
    supplier: "المورد", chooseSupplier: "اختر المورد (اختياري)", itemDescription: "وصف المطلوب شراؤه *",
    estimatedAmount: "القيمة التقديرية", trade: "الحرفة المطلوبة *", workersCount: "عدد العمالة *", neededDate: "التاريخ المطلوب",
    notes: "ملاحظات", save: "إرسال الطلب", saving: "جارٍ الإرسال...", err: "تعذر إرسال الطلب",
    filterProject: "فلترة بالمشروع", allProjects: "كل المشاريع", filterStatus: "فلترة بالحالة", allStatuses: "كل الحالات",
    thProject: "المشروع", thType: "النوع", thDetails: "التفاصيل", thStatus: "الحالة", thDate: "التاريخ",
    thSerial: "الرقم المسلسل", thCode: "الكود",
    loading: "جارٍ التحميل...", empty: "لا يوجد طلبات مسجلة بعد.",
    approve: "اعتماد", reject: "رفض", confirmReject: "تأكيد رفض الطلب؟",
    workersUnit: "عامل", delete: "حذف", confirmDelete: "تأكيد حذف الطلب نهائيًا؟ العملية لا يمكن التراجع عنها.",
    errDelete: "تعذر حذف الطلب",
  },
  en: {
    title: "Site Requests (Purchase / Labor)", newRequest: "New Request", cancel: "Cancel",
    project: "Project *", chooseProject: "Choose project", type: "Request Type",
    supplier: "Supplier", chooseSupplier: "Choose supplier (optional)", itemDescription: "Item Description *",
    estimatedAmount: "Estimated Amount", trade: "Required Trade *", workersCount: "Workers Count *", neededDate: "Needed Date",
    notes: "Notes", save: "Submit Request", saving: "Submitting...", err: "Failed to submit request",
    filterProject: "Filter by project", allProjects: "All Projects", filterStatus: "Filter by status", allStatuses: "All Statuses",
    thProject: "Project", thType: "Type", thDetails: "Details", thStatus: "Status", thDate: "Date",
    thSerial: "Serial No.", thCode: "Code",
    loading: "Loading...", empty: "No requests recorded yet.",
    approve: "Approve", reject: "Reject", confirmReject: "Confirm rejecting this request?",
    workersUnit: "worker(s)", delete: "Delete", confirmDelete: "Confirm permanently deleting this request? This cannot be undone.",
    errDelete: "Failed to delete request",
  },
};

export default function SiteRequestsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  const [requests, setRequests] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    projectId: "", type: "PURCHASE", supplierId: "", itemDescription: "", estimatedAmount: "",
    trade: "", workersCount: "", neededDate: "", notes: "",
  });

  async function load() {
    setLoading(true);
    const [rRes, pRes, sRes] = await Promise.all([
      fetch("/api/site-requests"),
      fetch("/api/projects"),
      fetch("/api/suppliers"),
    ]);
    if (rRes.ok) setRequests(await rRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    if (sRes.ok) setSuppliers(await sRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/site-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        supplierId: form.supplierId || undefined,
        estimatedAmount: form.estimatedAmount ? Number(form.estimatedAmount) : undefined,
        workersCount: form.workersCount ? Number(form.workersCount) : undefined,
        neededDate: form.neededDate || undefined,
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) return setError(typeof data.error === "string" ? data.error : t.err);
    setForm({ projectId: "", type: "PURCHASE", supplierId: "", itemDescription: "", estimatedAmount: "", trade: "", workersCount: "", neededDate: "", notes: "" });
    setShowForm(false);
    load();
  }

  async function act(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm(t.confirmReject)) return;
    const res = await fetch(`/api/site-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return alert((await res.json()).error);
    load();
  }

  async function removeRequest(id: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/site-requests/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => (!filterProject || r.projectId === filterProject) && (!filterStatus || r.status === filterStatus));
  }, [requests, filterProject, filterStatus]);

  return (
    <AppShell
      title={t.title}
      action={
        <button onClick={() => setShowForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.cancel : t.newRequest}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.project}</label>
            <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseProject}</option>
              {projects.filter((p: any) => p.status !== "CLOSED").map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.type}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="PURCHASE">{typeLabels.PURCHASE[locale]}</option>
              <option value="LABOR">{typeLabels.LABOR[locale]}</option>
            </select>
          </div>

          {form.type === "PURCHASE" ? (
            <>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.supplier}</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
                  <option value="">{t.chooseSupplier}</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-sm text-neutral-600 block mb-1">{t.itemDescription}</label>
                <input required value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.estimatedAmount}</label>
                <input type="number" step="0.01" value={form.estimatedAmount} onChange={(e) => setForm({ ...form, estimatedAmount: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.trade}</label>
                <input required value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.workersCount}</label>
                <input required type="number" min={1} value={form.workersCount} onChange={(e) => setForm({ ...form, workersCount: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.neededDate}</label>
                <input type="date" value={form.neededDate} onChange={(e) => setForm({ ...form, neededDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
            </>
          )}

          <div className="lg:col-span-3">
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterProject}</label>
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            <option value="">{t.allProjects}</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="sm:w-56">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterStatus}</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            <option value="">{t.allStatuses}</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
          </select>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thSerial}</th>
              <th className="p-3 font-medium">{t.thCode}</th>
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium">{t.thType}</th>
              <th className="p-3 font-medium">{t.thDetails}</th>
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={8}>{t.loading}</td></tr>}
            {!loading && filtered.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={8}>{t.empty}</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 text-neutral-500">{r.serialNumber}</td>
                <td className="p-3 font-mono text-xs text-neutral-500">{r.code}</td>
                <td className="p-3 font-medium">{r.project.name}</td>
                <td className="p-3">{typeLabels[r.type][locale]}</td>
                <td className="p-3 text-neutral-600">
                  {r.type === "PURCHASE"
                    ? `${r.itemDescription}${r.supplier ? ` — ${r.supplier.name}` : ""}${r.estimatedAmount ? ` (${Number(r.estimatedAmount).toLocaleString(localeCode)} ${currency})` : ""}`
                    : `${r.trade} × ${r.workersCount} ${t.workersUnit}${r.neededDate ? ` — ${new Date(r.neededDate).toLocaleDateString(localeCode)}` : ""}`}
                </td>
                <td className="p-3">{new Date(r.createdAt).toLocaleDateString(localeCode)}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[r.status]}`}>{statusLabels[r.status][locale]}</span></td>
                <td className="p-3 flex gap-2">
                  {(r.status === "PENDING_FINANCE" || r.status === "PENDING_ADMIN") && (
                    <>
                      <button onClick={() => act(r.id, "approve")} className="text-success hover:opacity-70" title={t.approve}><Check size={16} /></button>
                      <button onClick={() => act(r.id, "reject")} className="text-danger hover:opacity-70" title={t.reject}><Ban size={16} /></button>
                    </>
                  )}
                  <button onClick={() => removeRequest(r.id)} className="text-danger hover:opacity-70" title={t.delete}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
