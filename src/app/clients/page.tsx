"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  projects: { contractValue: string; status: string }[];
};

const dict = {
  ar: {
    title: "العملاء",
    newClient: "عميل جديد",
    cancel: "إلغاء",
    editTitle: "تعديل بيانات العميل",
    newTitle: "عميل جديد",
    name: "اسم العميل *",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    notes: "ملاحظات",
    save: "حفظ العميل",
    saveEdit: "حفظ التعديلات",
    saving: "جارٍ الحفظ...",
    err: "تعذر حفظ العميل — تأكد من البيانات",
    confirmDelete: "تأكيد حذف العميل؟",
    filterName: "فلترة باسم العميل",
    filterNamePh: "اكتب اسم العميل...",
    filterStatus: "فلترة بحالة مشاريع العميل",
    allStatuses: "كل الحالات",
    thName: "اسم العميل",
    thPhone: "الهاتف",
    thEmail: "البريد الإلكتروني",
    thProjectsCount: "عدد المشاريع",
    thTotalValue: "إجمالي قيمة العقود",
    loading: "جارٍ التحميل...",
    noMatch: "لا يوجد عملاء مطابقين.",
    statuses: { ONGOING: "جارية", READY_TO_CLOSE: "جاهزة للإغلاق", CLOSED: "مغلقة", DELAYED: "متأخرة" },
  },
  en: {
    title: "Clients",
    newClient: "New Client",
    cancel: "Cancel",
    editTitle: "Edit Client",
    newTitle: "New Client",
    name: "Client Name *",
    phone: "Phone",
    email: "Email",
    address: "Address",
    notes: "Notes",
    save: "Save Client",
    saveEdit: "Save Changes",
    saving: "Saving...",
    err: "Failed to save client — check the data",
    confirmDelete: "Confirm client deletion?",
    filterName: "Filter by client name",
    filterNamePh: "Type client name...",
    filterStatus: "Filter by project status",
    allStatuses: "All statuses",
    thName: "Client Name",
    thPhone: "Phone",
    thEmail: "Email",
    thProjectsCount: "Projects Count",
    thTotalValue: "Total Contract Value",
    loading: "Loading...",
    noMatch: "No matching clients.",
    statuses: { ONGOING: "Ongoing", READY_TO_CLOSE: "Ready to Close", CLOSED: "Closed", DELAYED: "Delayed" },
  },
};

export default function ClientsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [error, setError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(c: Client) {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setShowForm((v) => !v || editingId !== null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(editingId ? `/api/clients/${editingId}` : "/api/clients", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t.err);
      return;
    }
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setShowForm(false);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.err);
    load();
  }

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesName = searchName.trim() === "" || c.name.toLowerCase().includes(searchName.trim().toLowerCase());
      const matchesStatus = filterStatus === "" || c.projects.some((p) => p.status === filterStatus);
      return matchesName && matchesStatus;
    });
  }, [clients, searchName, filterStatus]);

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
          onClick={startNew}
          className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
          {showForm && !editingId ? t.cancel : t.newClient}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p className="sm:col-span-2 font-semibold text-sm text-neutral-600">
            {editingId ? t.editTitle : t.newTitle}
          </p>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.name}</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.phone}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.email}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.address}</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              rows={2}
            />
          </div>
          {error && <p className="text-danger text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button
              disabled={saving}
              className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60"
            >
              {saving ? t.saving : editingId ? t.saveEdit : t.save}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setShowForm(false); }}
                className="text-sm px-4 py-2 rounded-xl border"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterName}</label>
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder={t.filterNamePh}
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="sm:w-56">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterStatus}</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thName}</th>
              <th className="p-3 font-medium">{t.thPhone}</th>
              <th className="p-3 font-medium">{t.thEmail}</th>
              <th className="p-3 font-medium">{t.thProjectsCount}</th>
              <th className="p-3 font-medium">{t.thTotalValue}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.loading}</td></tr>
            )}
            {!loading && filteredClients.length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.noMatch}</td></tr>
            )}
            {filteredClients.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">
                  <Link href={`/clients/${c.id}`} className="text-primary hover:underline">{c.name}</Link>
                </td>
                <td className="p-3">{c.phone || "—"}</td>
                <td className="p-3">{c.email || "—"}</td>
                <td className="p-3">{c.projects.length}</td>
                <td className="p-3">
                  {c.projects
                    .reduce((s, p) => s + Number(p.contractValue), 0)
                    .toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}{" "}
                  {locale === "ar" ? "ج.م" : "EGP"}
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(c)} className="text-primary hover:opacity-70"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-danger hover:opacity-70"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
