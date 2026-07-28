"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Pencil, Trash2, ArrowRightCircle, Printer, FileDown } from "lucide-react";

const statusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  SENT: { ar: "مُرسل للعميل", en: "Sent to Client" },
  ACCEPTED: { ar: "مقبول من العميل", en: "Accepted" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
  CONVERTED: { ar: "تم تحويله لعقد", en: "Converted" },
};
const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  SENT: "bg-secondary/10 text-secondary",
  ACCEPTED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
  CONVERTED: "bg-primary/10 text-primary",
};

const dict = {
  ar: {
    loading: "جارٍ التحميل...", client: "العميل", projectName: "المشروع المقترح", date: "التاريخ", validUntil: "صالح حتى",
    itemsTitle: "بنود عرض السعر", newItem: "بند جديد", cancel: "إلغاء",
    codePh: "الكود", descPh: "الوصف", unitPh: "الوحدة", qtyPh: "الكمية", pricePh: "سعر الوحدة",
    thCode: "الكود", thDesc: "الوصف", thUnit: "الوحدة", thQty: "الكمية", thPrice: "سعر الوحدة", thTotal: "الإجمالي",
    saveItem: "حفظ البند", errItem: "تعذر إضافة البند", noItems: "لا يوجد بنود بعد.", total: "الإجمالي",
    send: "إرسال للعميل", accept: "قبول العميل", reject: "رفض", reSend: "إعادة إرسال", errAction: "تعذر تنفيذ الإجراء",
    convertTitle: "تحويل لعقد فعلي", convertBtn: "تحويل لعقد", convertNote: "متاح بس لما العرض يكون في حالة \"مقبول من العميل\".",
    projectCode: "كود المشروع الجديد *", contractNumber: "رقم العقد *", startDate: "تاريخ البدء *",
    retentionPct: "نسبة ضمان حسن التنفيذ %", advancePct: "نسبة الدفعة المقدمة %",
    doConvert: "تأكيد التحويل", converting: "جارٍ التحويل...", errConvert: "تعذر التحويل",
    convertedNote: "تم تحويل عرض السعر ده لمشروع فعلي:", saveEdit: "حفظ", cancelEdit: "إلغاء",
    confirmDeleteItem: "تأكيد حذف البند؟", errDelete: "تعذر الحذف",
    deleteQuotation: "حذف عرض السعر", confirmDeleteQuotation: "تأكيد حذف عرض السعر بالكامل؟",
    print: "طباعة", exportWord: "تصدير Word", noVat: "الأسعار لا تشمل ضريبة القيمة المضافة.",
    validUntilPrint: "العرض ساري حتى", hopeApproval: "نأمل أن ينال عرضنا رضاكم", regards: "وتفضلوا بقبول فائق الاحترام والتقدير،،،",
    dearSir: "المحترمين،،،", greeting: "تحية طيبة وبعد،", introText: "يسرّنا أن نتقدّم لسيادتكم بعرض السعر الخاص بـ",
    asDetailedBelow: "كما هو موضّح بالتفصيل أدناه:", offerNumber: "رقم العرض",
    techOfficeManager: "مدير المكتب الفني", managerName: "م. اسماء محمود",
  },
  en: {
    loading: "Loading...", client: "Client", projectName: "Proposed Project", date: "Date", validUntil: "Valid Until",
    itemsTitle: "Quotation Items", newItem: "New Item", cancel: "Cancel",
    codePh: "Code", descPh: "Description", unitPh: "Unit", qtyPh: "Quantity", pricePh: "Unit Price",
    thCode: "Code", thDesc: "Description", thUnit: "Unit", thQty: "Qty", thPrice: "Unit Price", thTotal: "Total",
    saveItem: "Save Item", errItem: "Failed to add item", noItems: "No items yet.", total: "Total",
    send: "Send to Client", accept: "Client Accepted", reject: "Reject", reSend: "Re-send", errAction: "Action failed",
    convertTitle: "Convert to Real Contract", convertBtn: "Convert to Contract", convertNote: "Only available once the quotation is \"Accepted\".",
    projectCode: "New Project Code *", contractNumber: "Contract Number *", startDate: "Start Date *",
    retentionPct: "Retention %", advancePct: "Advance Payment %",
    doConvert: "Confirm Conversion", converting: "Converting...", errConvert: "Failed to convert",
    convertedNote: "This quotation was converted to a real project:", saveEdit: "Save", cancelEdit: "Cancel",
    confirmDeleteItem: "Confirm item deletion?", errDelete: "Failed to delete",
    deleteQuotation: "Delete Quotation", confirmDeleteQuotation: "Confirm permanently deleting this quotation?",
    print: "Print", exportWord: "Export Word", noVat: "Prices do not include VAT.",
    validUntilPrint: "Valid until", hopeApproval: "We hope our offer meets your approval", regards: "Best regards,",
    dearSir: "Dear Sir/Madam,", greeting: "Greetings,", introText: "We are pleased to submit our quotation for",
    asDetailedBelow: "as detailed below:", offerNumber: "Quotation No.",
    techOfficeManager: "Technical Office Manager", managerName: "Eng. Asmaa Mahmoud",
  },
};

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  const [quotation, setQuotation] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });
  const [itemError, setItemError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });

  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertForm, setConvertForm] = useState({ projectCode: "", contractNumber: "", startDate: "", retentionPct: 5, advancePaymentPct: 0 });
  const [convertError, setConvertError] = useState("");
  const [converting, setConverting] = useState(false);

  async function load() {
    const res = await fetch(`/api/quotations/${id}`);
    if (res.ok) setQuotation(await res.json());
    const cRes = await fetch("/api/company-profile");
    if (cRes.ok) setCompany(await cRes.json());
  }
  useEffect(() => { load(); }, [id]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setItemError("");
    const res = await fetch(`/api/quotations/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemForm),
    });
    setSaving(false);
    if (!res.ok) return setItemError((await res.json()).error ?? t.errItem);
    setItemForm({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });
    setShowItemForm(false);
    load();
  }

  function startEditItem(i: any) {
    setEditingItemId(i.id);
    setEditItemForm({ code: i.code ?? "", description: i.description, unit: i.unit, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) });
  }
  async function saveEditedItem(itemId: string) {
    const res = await fetch(`/api/quotation-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editItemForm),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    setEditingItemId(null);
    load();
  }
  async function deleteItem(itemId: string) {
    if (!confirm(t.confirmDeleteItem)) return;
    const res = await fetch(`/api/quotation-items/${itemId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  async function transition(action: string) {
    const res = await fetch(`/api/quotations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errAction);
    load();
  }

  async function convert(e: React.FormEvent) {
    e.preventDefault();
    setConverting(true);
    setConvertError("");
    const res = await fetch(`/api/quotations/${id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(convertForm),
    });
    setConverting(false);
    if (!res.ok) return setConvertError((await res.json()).error ?? t.errConvert);
    load();
  }

  async function removeQuotation() {
    if (!confirm(t.confirmDeleteQuotation)) return;
    const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error);
    window.location.href = "/quotations";
  }

  if (!quotation) return <AppShell title={t.loading}><></></AppShell>;

  const total = (quotation.items ?? []).reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  return (
    <AppShell
      title={`${quotation.quotationNumber} — ${quotation.projectName}`}
      action={
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-2 rounded-xl font-medium ${statusStyles[quotation.status]}`}>{statusLabels[quotation.status]?.[locale] ?? quotation.status}</span>
          <button onClick={() => window.print()} className="border text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            <Printer size={15} /> {t.print}
          </button>
          <a href={`/api/quotations/${id}/export-docx`} className="border text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            <FileDown size={15} /> {t.exportWord}
          </a>
          <button onClick={removeQuotation} className="border border-danger text-danger text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            <Trash2 size={15} /> {t.deleteQuotation}
          </button>
        </div>
      }
    >
      <div className="print:hidden space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">{t.client}</p><p className="font-bold">{quotation.client?.name ?? "—"}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.date}</p><p className="font-bold">{new Date(quotation.date).toLocaleDateString(localeCode)}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.validUntil}</p><p className="font-bold">{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString(localeCode) : "—"}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.total}</p><p className="font-bold text-success">{total.toLocaleString(localeCode)} {currency}</p></div>
      </div>

      {quotation.status !== "CONVERTED" && (
        <div className="flex gap-2 flex-wrap">
          {quotation.status === "DRAFT" && <button onClick={() => transition("SENT")} className="bg-secondary text-white text-sm px-4 py-2 rounded-xl">{t.send}</button>}
          {quotation.status === "SENT" && (
            <>
              <button onClick={() => transition("ACCEPTED")} className="bg-success text-white text-sm px-4 py-2 rounded-xl">{t.accept}</button>
              <button onClick={() => transition("REJECTED")} className="bg-danger text-white text-sm px-4 py-2 rounded-xl">{t.reject}</button>
            </>
          )}
          {quotation.status === "ACCEPTED" && <button onClick={() => transition("REJECTED")} className="bg-danger text-white text-sm px-4 py-2 rounded-xl">{t.reject}</button>}
          {quotation.status === "REJECTED" && <button onClick={() => transition("SENT")} className="bg-secondary text-white text-sm px-4 py-2 rounded-xl">{t.reSend}</button>}
        </div>
      )}

      {/* بنود عرض السعر */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.itemsTitle}</h2>
        <button onClick={() => setShowItemForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showItemForm ? <X size={14} /> : <Plus size={14} />} {t.newItem}
        </button>
      </div>
      {showItemForm && (
        <form onSubmit={addItem} className="card grid grid-cols-1 sm:grid-cols-5 gap-4">
          <input placeholder={t.codePh} value={itemForm.code} onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder={t.descPh} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="border rounded-xl px-3 py-2 sm:col-span-2" />
          <input required placeholder={t.unitPh} value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required type="number" step="0.001" placeholder={t.qtyPh} value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          <input required type="number" step="0.01" placeholder={t.pricePh} value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          {itemError && <p className="text-danger text-sm sm:col-span-5">{itemError}</p>}
          <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium sm:col-span-5">{t.saveItem}</button>
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
            {(quotation.items ?? []).length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={7}>{t.noItems}</td></tr>}
            {(quotation.items ?? []).map((i: any) =>
              editingItemId === i.id ? (
                <tr key={i.id} className="border-t bg-neutral-50">
                  <td className="p-2"><input value={editItemForm.code} onChange={(e) => setEditItemForm({ ...editItemForm, code: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input value={editItemForm.description} onChange={(e) => setEditItemForm({ ...editItemForm, description: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input value={editItemForm.unit} onChange={(e) => setEditItemForm({ ...editItemForm, unit: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="number" step="0.001" value={editItemForm.quantity} onChange={(e) => setEditItemForm({ ...editItemForm, quantity: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="number" step="0.01" value={editItemForm.unitPrice} onChange={(e) => setEditItemForm({ ...editItemForm, unitPrice: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2 text-neutral-500">{(editItemForm.quantity * editItemForm.unitPrice).toLocaleString(localeCode)}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEditedItem(i.id)} className="text-success text-xs">{t.saveEdit}</button>
                    <button onClick={() => setEditingItemId(null)} className="text-neutral-500 text-xs">{t.cancelEdit}</button>
                  </td>
                </tr>
              ) : (
                <tr key={i.id} className="border-t">
                  <td className="p-3">{i.code || "—"}</td>
                  <td className="p-3">{i.description}</td>
                  <td className="p-3">{i.unit}</td>
                  <td className="p-3">{Number(i.quantity).toLocaleString(localeCode)}</td>
                  <td className="p-3">{Number(i.unitPrice).toLocaleString(localeCode)}</td>
                  <td className="p-3">{(Number(i.quantity) * Number(i.unitPrice)).toLocaleString(localeCode)}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEditItem(i)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => deleteItem(i.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            )}
          </tbody>
          {(quotation.items ?? []).length > 0 && (
            <tfoot><tr className="border-t bg-neutral-50 font-semibold"><td className="p-3" colSpan={5}>{t.total}</td><td className="p-3">{total.toLocaleString(localeCode)} {currency}</td><td /></tr></tfoot>
          )}
        </table>
      </div>

      {/* التحويل لعقد */}
      {quotation.status === "CONVERTED" && quotation.convertedProject ? (
        <div className="card bg-primary/5 border border-primary/20">
          <p className="text-sm">{t.convertedNote} <Link href={`/projects/${quotation.convertedProject.id}`} className="text-primary font-semibold hover:underline">{quotation.convertedProject.name}</Link></p>
        </div>
      ) : quotation.status === "CONVERTED" ? null : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><ArrowRightCircle size={18} /> {t.convertTitle}</h2>
            {quotation.status === "ACCEPTED" && (
              <button onClick={() => setShowConvertForm((v) => !v)} className="bg-success text-white text-sm px-4 py-2 rounded-xl">
                {showConvertForm ? t.cancel : t.convertBtn}
              </button>
            )}
          </div>
          {quotation.status !== "ACCEPTED" && <p className="text-xs text-neutral-400">{t.convertNote}</p>}
          {showConvertForm && quotation.status === "ACCEPTED" && (
            <form onSubmit={convert} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.projectCode}</label>
                <input required value={convertForm.projectCode} onChange={(e) => setConvertForm({ ...convertForm, projectCode: e.target.value })} placeholder="PRJ-006" className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.contractNumber}</label>
                <input required value={convertForm.contractNumber} onChange={(e) => setConvertForm({ ...convertForm, contractNumber: e.target.value })} placeholder="CTR-2026-006" className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.startDate}</label>
                <input required type="date" value={convertForm.startDate} onChange={(e) => setConvertForm({ ...convertForm, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.retentionPct}</label>
                <input type="number" step="0.01" value={convertForm.retentionPct} onChange={(e) => setConvertForm({ ...convertForm, retentionPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-neutral-600 block mb-1">{t.advancePct}</label>
                <input type="number" step="0.01" value={convertForm.advancePaymentPct} onChange={(e) => setConvertForm({ ...convertForm, advancePaymentPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
              </div>
              {convertError && <p className="text-danger text-sm lg:col-span-3">{convertError}</p>}
              <div className="lg:col-span-3">
                <button disabled={converting} className="bg-success text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
                  {converting ? t.converting : t.doConvert}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      </div>

      {/* قسم مخصص للطباعة فقط — بنفس شكل ملف Word المُصدَّر */}
      <div className="hidden print:block" dir="rtl">
        <div className="flex items-start justify-between">
          <div className="text-right">
            <p className="text-sm font-semibold">{t.offerNumber}: {quotation.quotationNumber}</p>
            <p className="text-xs text-neutral-500">{new Date(quotation.date).toLocaleDateString(localeCode, { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="text-center -mt-6">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="" className="h-96 w-96 object-contain" />
            ) : (
              <p className="text-lg font-bold" style={{ color: "#C9692E" }}>{company?.name ?? "Section General Contracting"}</p>
            )}
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold -mt-6 mb-6">{locale === "ar" ? "عرض سعر" : "Quotation"}</h1>

        <p className="font-bold mb-1">{locale === "ar" ? "السادة/" : "Dear"} {quotation.client?.name ?? "—"} {t.dearSir}</p>
        <p className="mb-1">{t.greeting}</p>
        <p className="mb-4">{t.introText} "{quotation.projectName}" {t.asDetailedBelow}</p>

        <table className="w-full border-collapse text-sm mb-4">
          <thead>
            <tr style={{ backgroundColor: "#2C2E30", color: "#fff" }}>
              <th className="p-2 border text-center">م</th>
              <th className="p-2 border text-right">{t.thDesc}</th>
              <th className="p-2 border text-center">{t.thUnit}</th>
              <th className="p-2 border text-center">{t.thQty}</th>
              <th className="p-2 border text-center">{t.thPrice}</th>
              <th className="p-2 border text-center">{t.thTotal}</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.items ?? []).map((i: any, idx: number) => (
              <tr key={i.id}>
                <td className="p-2 border text-center">{idx + 1}</td>
                <td className="p-2 border text-right">{i.description}</td>
                <td className="p-2 border text-center">{i.unit}</td>
                <td className="p-2 border text-center">{Number(i.quantity).toLocaleString(localeCode)}</td>
                <td className="p-2 border text-center">{Number(i.unitPrice).toLocaleString(localeCode)}</td>
                <td className="p-2 border text-center">{(Number(i.quantity) * Number(i.unitPrice)).toLocaleString(localeCode)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#F3F3F3" }}>
              <td className="p-2 border font-bold text-right" colSpan={5}>{t.total}</td>
              <td className="p-2 border font-bold text-center" style={{ color: "#2E7D32" }}>{total.toLocaleString(localeCode)} {currency}</td>
            </tr>
          </tfoot>
        </table>

        <p className="text-xs italic mb-1" style={{ color: "#990000" }}>{t.noVat}</p>
        {quotation.validUntil && (
          <p className="text-xs italic text-neutral-500 mb-1">{t.validUntilPrint} {new Date(quotation.validUntil).toLocaleDateString(localeCode)}.</p>
        )}
        {quotation.notes && <p className="text-xs text-neutral-500 mb-4">{quotation.notes}</p>}

        <p className="text-center font-bold text-lg mt-10 mb-1">{t.hopeApproval}</p>
        <p className="text-center text-sm mb-16">{t.regards}</p>

        <div className="text-left mt-16">
          <p className="text-sm font-bold">{t.techOfficeManager}</p>
          <p className="text-sm">{t.managerName}</p>
        </div>

        <div className="fixed bottom-0 left-0 right-0 text-center border-t pt-2 pb-4" style={{ borderColor: "#ddd" }}>
          <p className="text-xs text-neutral-500">
            www.section-eg.com&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;info@section-eg.com&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;03 5516692&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;01110444395
          </p>
        </div>
      </div>
    </AppShell>
  );
}
