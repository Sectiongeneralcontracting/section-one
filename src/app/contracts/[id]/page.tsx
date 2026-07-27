"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X } from "lucide-react";

const statusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  SUBMITTED: { ar: "مقدَّم", en: "Submitted" },
  APPROVED: { ar: "معتمد", en: "Approved" },
  PAID: { ar: "مصروف", en: "Paid" },
};
const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  SUBMITTED: "bg-secondary/10 text-secondary",
  APPROVED: "bg-primary/10 text-primary",
  PAID: "bg-success/10 text-success",
};

const dict = {
  ar: {
    loading: "جارٍ التحميل...", contractTitle: "عقد", project: "المشروع", value: "قيمة العقد",
    retention: "ضمان حسن التنفيذ", advance: "الدفعة المقدمة",
    boqTitle: "جدول الكميات (BOQ)", newItem: "بند جديد", codePh: "الكود", descPh: "الوصف",
    unitPh: "الوحدة", qtyPh: "الكمية", pricePh: "سعر الوحدة", saveItem: "حفظ البند",
    thCode: "الكود", thDesc: "الوصف", thUnit: "الوحدة", thQty: "الكمية", thPrice: "سعر الوحدة", thTotal: "الإجمالي",
    delete: "حذف", noItems: "لا يوجد بنود بعد.", total: "الإجمالي",
    certTitle: "المستخلصات", newCert: "مستخلص جديد", from: "من تاريخ", to: "إلى تاريخ",
    cumulativePct: "نسبة الإنجاز التراكمية %", taxPct: "نسبة الضريبة %",
    calculating: "جارٍ الحساب...", saveCert: "حفظ المستخلص (يُحسب تلقائيًا)",
    thNumber: "رقم", thPeriod: "الفترة", thCumulative: "نسبة الإنجاز", thPeriodValue: "قيمة الفترة",
    thRetention: "الضمان", thAdvanceRecovery: "استرداد الدفعة", thNet: "صافي المستحق", thStatus: "الحالة",
    noCerts: "لا يوجد مستخلصات بعد.", submit: "تقديم", approve: "اعتماد", markPaid: "تسجيل الصرف",
    errAddItem: "تعذر إضافة البند", confirmDeleteItem: "تأكيد حذف البند؟", errCert: "تعذر إنشاء المستخلص", errAction: "تعذر تنفيذ الإجراء",
  },
  en: {
    loading: "Loading...", contractTitle: "Contract", project: "Project", value: "Contract Value",
    retention: "Retention", advance: "Advance Payment",
    boqTitle: "Bill of Quantities (BOQ)", newItem: "New Item", codePh: "Code", descPh: "Description",
    unitPh: "Unit", qtyPh: "Quantity", pricePh: "Unit Price", saveItem: "Save Item",
    thCode: "Code", thDesc: "Description", thUnit: "Unit", thQty: "Qty", thPrice: "Unit Price", thTotal: "Total",
    delete: "Delete", noItems: "No items yet.", total: "Total",
    certTitle: "Payment Certificates", newCert: "New Certificate", from: "From Date", to: "To Date",
    cumulativePct: "Cumulative Completion %", taxPct: "Tax %",
    calculating: "Calculating...", saveCert: "Save Certificate (auto-calculated)",
    thNumber: "No.", thPeriod: "Period", thCumulative: "Completion %", thPeriodValue: "Period Value",
    thRetention: "Retention", thAdvanceRecovery: "Advance Recovery", thNet: "Net Payable", thStatus: "Status",
    noCerts: "No certificates yet.", submit: "Submit", approve: "Approve", markPaid: "Mark Paid",
    errAddItem: "Failed to add item", confirmDeleteItem: "Confirm item deletion?", errCert: "Failed to create certificate", errAction: "Action failed",
  },
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = dict[locale];
  const [contract, setContract] = useState<any>(null);
  const [showBoqForm, setShowBoqForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [boqForm, setBoqForm] = useState({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });
  const [certForm, setCertForm] = useState({ periodFrom: "", periodTo: "", cumulativePct: 0, taxPct: 0, notes: "" });

  async function load() {
    const res = await fetch(`/api/contracts/${id}`);
    if (res.ok) setContract(await res.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addBoq(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/contracts/${id}/boq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(boqForm),
    });
    setSaving(false);
    if (!res.ok) return setError(t.errAddItem);
    setBoqForm({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });
    setShowBoqForm(false);
    load();
  }

  async function deleteBoq(itemId: string) {
    if (!confirm(t.confirmDeleteItem)) return;
    await fetch(`/api/boq-items/${itemId}`, { method: "DELETE" });
    load();
  }

  async function addCertificate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/contracts/${id}/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(certForm),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? t.errCert);
    setCertForm({ periodFrom: "", periodTo: "", cumulativePct: 0, taxPct: 0, notes: "" });
    setShowCertForm(false);
    load();
  }

  async function transitionCert(certId: string, action: "submit" | "approve" | "pay") {
    const res = await fetch(`/api/certificates/${certId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errAction);
    load();
  }

  if (!contract) return <AppShell title={t.loading}><></></AppShell>;

  const boqTotal = contract.boqItems.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  return (
    <AppShell title={`${t.contractTitle} ${contract.contractNumber}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">{t.project}</p><p className="font-bold">{contract.project.name}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.value}</p><p className="font-bold">{Number(contract.project.contractValue).toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.retention}</p><p className="font-bold">{Number(contract.retentionPct)}%</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.advance}</p><p className="font-bold">{Number(contract.advancePaymentAmount).toLocaleString(localeCode)} {currency}</p></div>
      </div>

      {/* BOQ */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.boqTitle}</h2>
        <button onClick={() => setShowBoqForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showBoqForm ? <X size={14} /> : <Plus size={14} />} {t.newItem}
        </button>
      </div>
      {showBoqForm && (
        <form onSubmit={addBoq} className="card grid grid-cols-1 sm:grid-cols-5 gap-4">
          <input required placeholder={t.codePh} value={boqForm.code} onChange={(e) => setBoqForm({ ...boqForm, code: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder={t.descPh} value={boqForm.description} onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })} className="border rounded-xl px-3 py-2 sm:col-span-2" />
          <input required placeholder={t.unitPh} value={boqForm.unit} onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required type="number" step="0.001" placeholder={t.qtyPh} value={boqForm.quantity} onChange={(e) => setBoqForm({ ...boqForm, quantity: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          <input required type="number" step="0.01" placeholder={t.pricePh} value={boqForm.unitPrice} onChange={(e) => setBoqForm({ ...boqForm, unitPrice: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          {error && <p className="text-danger text-sm sm:col-span-5">{error}</p>}
          <div className="sm:col-span-5">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">{t.saveItem}</button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thCode}</th><th className="p-3 font-medium">{t.thDesc}</th>
              <th className="p-3 font-medium">{t.thUnit}</th><th className="p-3 font-medium">{t.thQty}</th>
              <th className="p-3 font-medium">{t.thPrice}</th><th className="p-3 font-medium">{t.thTotal}</th><th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contract.boqItems.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={7}>{t.noItems}</td></tr>}
            {contract.boqItems.map((i: any) => (
              <tr key={i.id} className="border-t">
                <td className="p-3">{i.code}</td>
                <td className="p-3">{i.description}</td>
                <td className="p-3">{i.unit}</td>
                <td className="p-3">{Number(i.quantity).toLocaleString(localeCode)}</td>
                <td className="p-3">{Number(i.unitPrice).toLocaleString(localeCode)}</td>
                <td className="p-3">{(Number(i.quantity) * Number(i.unitPrice)).toLocaleString(localeCode)}</td>
                <td className="p-3"><button onClick={() => deleteBoq(i.id)} className="text-danger text-xs">{t.delete}</button></td>
              </tr>
            ))}
          </tbody>
          {contract.boqItems.length > 0 && (
            <tfoot><tr className="border-t bg-neutral-50 font-semibold"><td className="p-3" colSpan={5}>{t.total}</td><td className="p-3">{boqTotal.toLocaleString(localeCode)} {currency}</td><td /></tr></tfoot>
          )}
        </table>
      </div>

      {/* Certificates */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.certTitle}</h2>
        <button onClick={() => setShowCertForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showCertForm ? <X size={14} /> : <Plus size={14} />} {t.newCert}
        </button>
      </div>
      {showCertForm && (
        <form onSubmit={addCertificate} className="card grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div><label className="text-sm text-neutral-600 block mb-1">{t.from}</label><input required type="date" value={certForm.periodFrom} onChange={(e) => setCertForm({ ...certForm, periodFrom: e.target.value })} className="w-full border rounded-xl px-3 py-2" /></div>
          <div><label className="text-sm text-neutral-600 block mb-1">{t.to}</label><input required type="date" value={certForm.periodTo} onChange={(e) => setCertForm({ ...certForm, periodTo: e.target.value })} className="w-full border rounded-xl px-3 py-2" /></div>
          <div><label className="text-sm text-neutral-600 block mb-1">{t.cumulativePct}</label><input required type="number" step="0.01" value={certForm.cumulativePct} onChange={(e) => setCertForm({ ...certForm, cumulativePct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" /></div>
          <div><label className="text-sm text-neutral-600 block mb-1">{t.taxPct}</label><input type="number" step="0.01" value={certForm.taxPct} onChange={(e) => setCertForm({ ...certForm, taxPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" /></div>
          {error && <p className="text-danger text-sm sm:col-span-4">{error}</p>}
          <div className="sm:col-span-4">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.calculating : t.saveCert}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thNumber}</th><th className="p-3 font-medium">{t.thPeriod}</th>
              <th className="p-3 font-medium">{t.thCumulative}</th><th className="p-3 font-medium">{t.thPeriodValue}</th>
              <th className="p-3 font-medium">{t.thRetention}</th><th className="p-3 font-medium">{t.thAdvanceRecovery}</th>
              <th className="p-3 font-medium">{t.thNet}</th><th className="p-3 font-medium">{t.thStatus}</th><th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contract.certificates.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={9}>{t.noCerts}</td></tr>}
            {contract.certificates.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.number}</td>
                <td className="p-3">{new Date(c.periodFrom).toLocaleDateString(localeCode)} - {new Date(c.periodTo).toLocaleDateString(localeCode)}</td>
                <td className="p-3">{Number(c.cumulativePct)}%</td>
                <td className="p-3">{Number(c.thisPeriodValue).toLocaleString(localeCode)}</td>
                <td className="p-3">{Number(c.retentionAmount).toLocaleString(localeCode)}</td>
                <td className="p-3">{Number(c.advanceRecoveryAmount).toLocaleString(localeCode)}</td>
                <td className="p-3 font-semibold">{Number(c.netPayable).toLocaleString(localeCode)}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[c.status]}`}>{statusLabels[c.status][locale]}</span></td>
                <td className="p-3">
                  {c.status === "DRAFT" && <button onClick={() => transitionCert(c.id, "submit")} className="text-primary text-xs">{t.submit}</button>}
                  {c.status === "SUBMITTED" && <button onClick={() => transitionCert(c.id, "approve")} className="text-primary text-xs">{t.approve}</button>}
                  {c.status === "APPROVED" && <button onClick={() => transitionCert(c.id, "pay")} className="text-success text-xs">{t.markPaid}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
