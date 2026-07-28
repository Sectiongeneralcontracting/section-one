"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Trash2 } from "lucide-react";

const certStatusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  SUBMITTED: { ar: "مقدَّم", en: "Submitted" },
  APPROVED: { ar: "معتمد", en: "Approved" },
  PAID: { ar: "مصروف", en: "Paid" },
};
const certStatusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  SUBMITTED: "bg-secondary/10 text-secondary",
  APPROVED: "bg-primary/10 text-primary",
  PAID: "bg-success/10 text-success",
};
const nextLabel: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: "تقديم", en: "Submit" },
  SUBMITTED: { ar: "اعتماد", en: "Approve" },
  APPROVED: { ar: "تسجيل صرف", en: "Mark Paid" },
};

const dict = {
  ar: {
    loading: "جارٍ التحميل...", saving: "جارٍ الحفظ...", project: "المشروع", value: "قيمة العقد", scope: "نطاق العمل", signed: "تاريخ التوقيع",
    certTitle: "المستخلصات", newCert: "مستخلص جديد", from: "من تاريخ", to: "إلى تاريخ", cumulativePct: "نسبة الإنجاز التراكمية %",
    saveCert: "حفظ المستخلص", errCert: "تعذر حفظ المستخلص",
    thNumber: "رقم", thPeriod: "الفترة", thCumulative: "نسبة الإنجاز", thValue: "قيمة الفترة", thStatus: "الحالة",
    noCerts: "لا يوجد مستخلصات بعد.",
    paymentsTitle: "الدفعات الفعلية", newPayment: "دفعة جديدة", amount: "القيمة *", date: "التاريخ", notes: "ملاحظات",
    savePayment: "حفظ الدفعة (وتحميلها كمصروف على المشروع)", errPayment: "تعذر تسجيل الدفعة", noPayments: "لا يوجد دفعات بعد.",
    thPaymentAmount: "القيمة", totalPaid: "إجمالي المدفوع",
    note: "أي دفعة بتتسجل هنا بتتحمّل تلقائيًا كمصروف (بند: مقاولي باطن) على المشروع المرتبط بالعقد.",
  },
  en: {
    loading: "Loading...", saving: "Saving...", project: "Project", value: "Contract Value", scope: "Scope of Work", signed: "Signed Date",
    certTitle: "Certificates", newCert: "New Certificate", from: "From", to: "To", cumulativePct: "Cumulative Completion %",
    saveCert: "Save Certificate", errCert: "Failed to save certificate",
    thNumber: "No.", thPeriod: "Period", thCumulative: "Completion %", thValue: "Period Value", thStatus: "Status",
    noCerts: "No certificates yet.",
    paymentsTitle: "Actual Payments", newPayment: "New Payment", amount: "Amount *", date: "Date", notes: "Notes",
    savePayment: "Save Payment (and charge project expense)", errPayment: "Failed to record payment", noPayments: "No payments yet.",
    thPaymentAmount: "Amount", totalPaid: "Total Paid",
    note: "Any payment recorded here is automatically charged as an expense (Subcontractor category) to the project linked to this contract.",
  },
};

export default function SubcontractorContractPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";

  const [contract, setContract] = useState<any>(null);
  const [showCertForm, setShowCertForm] = useState(false);
  const [certSaving, setCertSaving] = useState(false);
  const [certError, setCertError] = useState("");
  const [certForm, setCertForm] = useState({ periodFrom: "", periodTo: "", cumulativePct: 0 });

  const [showPayForm, setShowPayForm] = useState(false);
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState("");
  const [payForm, setPayForm] = useState({ amount: 0, date: "", notes: "" });

  async function refresh() {
    const res = await fetch(`/api/subcontractor-contracts/${id}`);
    if (res.ok) setContract(await res.json());
  }

  useEffect(() => { refresh(); }, [id]);

  async function addCertificate(e: React.FormEvent) {
    e.preventDefault();
    setCertSaving(true);
    setCertError("");
    const res = await fetch(`/api/subcontractor-contracts/${id}/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(certForm),
    });
    setCertSaving(false);
    if (!res.ok) return setCertError((await res.json()).error ?? t.errCert);
    setCertForm({ periodFrom: "", periodTo: "", cumulativePct: 0 });
    setShowCertForm(false);
    refresh();
  }

  async function advanceCertificate(certId: string) {
    const res = await fetch(`/api/subcontractor-certificates/${certId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance" }),
    });
    if (!res.ok) return alert((await res.json()).error);
    refresh();
  }

  async function removeCertificate(certId: string) {
    if (!confirm(locale === "ar" ? "تأكيد حذف المستخلص؟" : "Confirm deleting this certificate?")) return;
    const res = await fetch(`/api/subcontractor-certificates/${certId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error);
    refresh();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaySaving(true);
    setPayError("");
    const res = await fetch(`/api/subcontractor-contracts/${id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payForm),
    });
    setPaySaving(false);
    if (!res.ok) return setPayError((await res.json()).error ?? t.errPayment);
    setPayForm({ amount: 0, date: "", notes: "" });
    setShowPayForm(false);
    refresh();
  }

  if (!contract) return <AppShell title={t.loading}><></></AppShell>;

  const totalPaid = contract.payments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <AppShell title={`${contract.subcontractor.name} — ${contract.contractNumber}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">{t.project}</p><p className="font-bold">{contract.project.name}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.value}</p><p className="font-bold">{Number(contract.contractValue).toLocaleString(localeCode)} {currency}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.signed}</p><p className="font-bold">{new Date(contract.signedDate).toLocaleDateString(localeCode)}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">{t.totalPaid}</p><p className="font-bold text-success">{totalPaid.toLocaleString(localeCode)} {currency}</p></div>
      </div>

      {/* المستخلصات */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.certTitle}</h2>
        <button onClick={() => setShowCertForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showCertForm ? <X size={14} /> : <Plus size={14} />} {t.newCert}
        </button>
      </div>
      {showCertForm && (
        <form onSubmit={addCertificate} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.from}</label>
            <input required type="date" value={certForm.periodFrom} onChange={(e) => setCertForm({ ...certForm, periodFrom: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.to}</label>
            <input required type="date" value={certForm.periodTo} onChange={(e) => setCertForm({ ...certForm, periodTo: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.cumulativePct}</label>
            <input required type="number" step="0.01" value={certForm.cumulativePct} onChange={(e) => setCertForm({ ...certForm, cumulativePct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {certError && <p className="text-danger text-sm sm:col-span-3">{certError}</p>}
          <div className="sm:col-span-3">
            <button disabled={certSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {certSaving ? t.saving : t.saveCert}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thNumber}</th>
              <th className="p-3 font-medium">{t.thPeriod}</th>
              <th className="p-3 font-medium">{t.thCumulative}</th>
              <th className="p-3 font-medium">{t.thValue}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contract.certificates.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={6}>{t.noCerts}</td></tr>}
            {contract.certificates.sort((a: any, b: any) => a.number - b.number).map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.number}</td>
                <td className="p-3">{new Date(c.periodFrom).toLocaleDateString(localeCode)} - {new Date(c.periodTo).toLocaleDateString(localeCode)}</td>
                <td className="p-3">{Number(c.cumulativePct)}%</td>
                <td className="p-3 font-semibold">{Number(c.thisPeriodValue).toLocaleString(localeCode)} {currency}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${certStatusStyles[c.status]}`}>{certStatusLabels[c.status][locale]}</span></td>
                <td className="p-3 flex gap-2">
                  {c.status !== "PAID" && (
                    <button onClick={() => advanceCertificate(c.id)} className="text-primary text-xs">{nextLabel[c.status][locale]}</button>
                  )}
                  {c.status === "DRAFT" && (
                    <button onClick={() => removeCertificate(c.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* الدفعات الفعلية */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t.paymentsTitle}</h2>
        <button onClick={() => setShowPayForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showPayForm ? <X size={14} /> : <Plus size={14} />} {t.newPayment}
        </button>
      </div>
      {showPayForm && (
        <form onSubmit={addPayment} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.amount}</label>
            <input required type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.date}</label>
            <input type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {payError && <p className="text-danger text-sm sm:col-span-3">{payError}</p>}
          <div className="sm:col-span-3">
            <button disabled={paySaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {paySaving ? t.saving : t.savePayment}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.date}</th>
              <th className="p-3 font-medium">{t.thPaymentAmount}</th>
              <th className="p-3 font-medium">{t.notes}</th>
            </tr>
          </thead>
          <tbody>
            {contract.payments.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={3}>{t.noPayments}</td></tr>}
            {contract.payments.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{new Date(p.date).toLocaleDateString(localeCode)}</td>
                <td className="p-3 font-semibold text-success">{Number(p.amount).toLocaleString(localeCode)} {currency}</td>
                <td className="p-3">{p.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
          {contract.payments.length > 0 && (
            <tfoot><tr className="border-t bg-neutral-50 font-semibold"><td className="p-3">{t.totalPaid}</td><td className="p-3 text-success">{totalPaid.toLocaleString(localeCode)} {currency}</td><td /></tr></tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-neutral-400">{t.note}</p>
    </AppShell>
  );
}
