"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

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
    boqTitle: "جدول الكميات (BOQ)", newItem: "بند جديد", codePh: "الكود", descPh: "الوصف", cancel: "إلغاء",
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
    editContract: "تعديل بيانات العقد", contractNumber: "رقم العقد", signedDate: "تاريخ التوقيع",
    retentionPct: "نسبة ضمان حسن التنفيذ %", advancePct: "نسبة الدفعة المقدمة %", notes: "ملاحظات",
    saveContract: "حفظ", cancelContract: "إلغاء", errSaveContract: "تعذر حفظ تعديلات العقد",
    deleteContract: "حذف العقد", confirmDeleteContract: "تأكيد حذف العقد نهائيًا؟ ده هيمسح جدول الكميات معاه، ومش هيتم لو فيه مستخلصات مسجلة. العملية لا يمكن التراجع عنها.",
    errDeleteContract: "تعذر حذف العقد",
  },
  en: {
    loading: "Loading...", contractTitle: "Contract", project: "Project", value: "Contract Value",
    retention: "Retention", advance: "Advance Payment",
    boqTitle: "Bill of Quantities (BOQ)", newItem: "New Item", codePh: "Code", descPh: "Description", cancel: "Cancel",
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
    editContract: "Edit Contract Details", contractNumber: "Contract Number", signedDate: "Signed Date",
    retentionPct: "Retention %", advancePct: "Advance Payment %", notes: "Notes",
    saveContract: "Save", cancelContract: "Cancel", errSaveContract: "Failed to save contract changes",
    deleteContract: "Delete Contract", confirmDeleteContract: "Confirm permanently deleting this contract? This will also remove its BOQ, and won't proceed if certificates exist. This cannot be undone.",
    errDeleteContract: "Failed to delete contract",
  },
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = dict[locale];
  const [contract, setContract] = useState<any>(null);
  const [editingContract, setEditingContract] = useState(false);
  const [contractForm, setContractForm] = useState({ contractNumber: "", signedDate: "", retentionPct: 0, advancePaymentPct: 0, notes: "" });
  const [contractError, setContractError] = useState("");
  const [showBoqForm, setShowBoqForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [boqForm, setBoqForm] = useState({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });
  const [editingBoqId, setEditingBoqId] = useState<string | null>(null);
  const [editBoqForm, setEditBoqForm] = useState({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });
  const [boqActionError, setBoqActionError] = useState("");
  const [certForm, setCertForm] = useState({ periodFrom: "", periodTo: "", cumulativePct: 0, taxPct: 0, notes: "" });

  async function load() {
    const res = await fetch(`/api/contracts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setContract(data);
      setContractForm({
        contractNumber: data.contractNumber,
        signedDate: new Date(data.signedDate).toISOString().slice(0, 10),
        retentionPct: Number(data.retentionPct),
        advancePaymentPct: Number(data.advancePaymentPct),
        notes: data.notes ?? "",
      });
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveContract(e: React.FormEvent) {
    e.preventDefault();
    setContractError("");
    const res = await fetch(`/api/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contractForm),
    });
    if (!res.ok) return setContractError((await res.json()).error ?? t.errSaveContract);
    setEditingContract(false);
    load();
  }

  async function removeContract() {
    if (!confirm(t.confirmDeleteContract)) return;
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDeleteContract);
    router.push(`/projects/${contract.project.id}`);
  }

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
    setBoqActionError("");
    const res = await fetch(`/api/boq-items/${itemId}`, { method: "DELETE" });
    if (!res.ok) {
      setBoqActionError((await res.json()).error ?? t.errAddItem);
      return;
    }
    load();
  }

  function startEditBoq(i: any) {
    setEditingBoqId(i.id);
    setEditBoqForm({ code: i.code, description: i.description, unit: i.unit, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) });
    setBoqActionError("");
  }

  async function saveEditedBoq(itemId: string) {
    setBoqActionError("");
    const res = await fetch(`/api/boq-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editBoqForm),
    });
    if (!res.ok) {
      setBoqActionError((await res.json()).error ?? t.errAddItem);
      return;
    }
    setEditingBoqId(null);
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

  async function removeCertificate(certId: string) {
    if (!confirm(locale === "ar" ? "تأكيد حذف المستخلص؟" : "Confirm deleting this certificate?")) return;
    const res = await fetch(`/api/certificates/${certId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errAction);
    load();
  }

  if (!contract) return <AppShell title={t.loading}><></></AppShell>;

  const boqTotal = contract.boqItems.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  return (
    <AppShell
      title={`${t.contractTitle} ${contract.contractNumber}`}
      action={
        <div className="flex gap-2">
          <button onClick={() => setEditingContract((v) => !v)} className="border text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            <Pencil size={15} /> {t.editContract}
          </button>
          <button onClick={removeContract} className="border border-danger text-danger text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            <Trash2 size={15} /> {t.deleteContract}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">{t.project}</p><p className="font-bold">{contract.project.name}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.value}</p><p className="font-bold">{Number(contract.project.contractValue).toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.retention}</p><p className="font-bold">{Number(contract.retentionPct)}%</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.advance}</p><p className="font-bold">{Number(contract.advancePaymentAmount).toLocaleString(localeCode)} {currency}</p></div>
      </div>

      {editingContract && (
        <form onSubmit={saveContract} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.contractNumber}</label>
            <input required value={contractForm.contractNumber} onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.signedDate}</label>
            <input required type="date" value={contractForm.signedDate} onChange={(e) => setContractForm({ ...contractForm, signedDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.retentionPct}</label>
            <input required type="number" step="0.01" value={contractForm.retentionPct} onChange={(e) => setContractForm({ ...contractForm, retentionPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.advancePct}</label>
            <input required type="number" step="0.01" value={contractForm.advancePaymentPct} onChange={(e) => setContractForm({ ...contractForm, advancePaymentPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={contractForm.notes} onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {contractError && <p className="text-danger text-sm lg:col-span-3">{contractError}</p>}
          <div className="lg:col-span-3 flex gap-2">
            <button className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium">{t.saveContract}</button>
            <button type="button" onClick={() => setEditingContract(false)} className="text-sm px-4 py-2 rounded-xl border">{t.cancelContract}</button>
          </div>
        </form>
      )}

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
        {boqActionError && <p className="text-danger text-sm p-3 border-b">{boqActionError}</p>}
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
            {contract.boqItems.map((i: any) =>
              editingBoqId === i.id ? (
                <tr key={i.id} className="border-t bg-neutral-50">
                  <td className="p-2"><input value={editBoqForm.code} onChange={(e) => setEditBoqForm({ ...editBoqForm, code: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input value={editBoqForm.description} onChange={(e) => setEditBoqForm({ ...editBoqForm, description: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input value={editBoqForm.unit} onChange={(e) => setEditBoqForm({ ...editBoqForm, unit: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="number" step="0.001" value={editBoqForm.quantity} onChange={(e) => setEditBoqForm({ ...editBoqForm, quantity: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="number" step="0.01" value={editBoqForm.unitPrice} onChange={(e) => setEditBoqForm({ ...editBoqForm, unitPrice: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2 text-neutral-500">{(editBoqForm.quantity * editBoqForm.unitPrice).toLocaleString(localeCode)}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEditedBoq(i.id)} className="text-success text-xs font-medium">{t.saveItem}</button>
                    <button onClick={() => setEditingBoqId(null)} className="text-neutral-500 text-xs">{t.cancel}</button>
                  </td>
                </tr>
              ) : (
                <tr key={i.id} className="border-t">
                  <td className="p-3">{i.code}</td>
                  <td className="p-3">{i.description}</td>
                  <td className="p-3">{i.unit}</td>
                  <td className="p-3">{Number(i.quantity).toLocaleString(localeCode)}</td>
                  <td className="p-3">{Number(i.unitPrice).toLocaleString(localeCode)}</td>
                  <td className="p-3">{(Number(i.quantity) * Number(i.unitPrice)).toLocaleString(localeCode)}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEditBoq(i)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => deleteBoq(i.id)} className="text-danger text-xs">{t.delete}</button>
                  </td>
                </tr>
              )
            )}
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
                <td className="p-3 flex gap-2">
                  {c.status === "DRAFT" && <button onClick={() => transitionCert(c.id, "submit")} className="text-primary text-xs">{t.submit}</button>}
                  {c.status === "SUBMITTED" && <button onClick={() => transitionCert(c.id, "approve")} className="text-primary text-xs">{t.approve}</button>}
                  {c.status === "APPROVED" && <button onClick={() => transitionCert(c.id, "pay")} className="text-success text-xs">{t.markPaid}</button>}
                  {c.status === "DRAFT" && <button onClick={() => removeCertificate(c.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
