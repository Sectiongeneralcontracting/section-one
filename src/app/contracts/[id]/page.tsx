"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, X } from "lucide-react";

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مقدَّم",
  APPROVED: "معتمد",
  PAID: "مصروف",
};
const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  SUBMITTED: "bg-secondary/10 text-secondary",
  APPROVED: "bg-primary/10 text-primary",
  PAID: "bg-success/10 text-success",
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
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
    if (!res.ok) return setError("تعذر إضافة البند");
    setBoqForm({ code: "", description: "", unit: "", quantity: 0, unitPrice: 0 });
    setShowBoqForm(false);
    load();
  }

  async function deleteBoq(itemId: string) {
    if (!confirm("تأكيد حذف البند؟")) return;
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
    if (!res.ok) return setError((await res.json()).error ?? "تعذر إنشاء المستخلص");
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
    if (!res.ok) return alert((await res.json()).error ?? "تعذر تنفيذ الإجراء");
    load();
  }

  if (!contract) return <AppShell title="جارٍ التحميل..."><></></AppShell>;

  const boqTotal = contract.boqItems.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  return (
    <AppShell title={`عقد ${contract.contractNumber}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-neutral-500">المشروع</p><p className="font-bold">{contract.project.name}</p></div>
        <div className="card"><p className="text-sm text-neutral-500">قيمة العقد</p><p className="font-bold">{Number(contract.project.contractValue).toLocaleString("ar-EG")} ج.م</p></div>
        <div className="card"><p className="text-sm text-neutral-500">ضمان حسن التنفيذ</p><p className="font-bold">{Number(contract.retentionPct)}%</p></div>
        <div className="card"><p className="text-sm text-neutral-500">الدفعة المقدمة</p><p className="font-bold">{Number(contract.advancePaymentAmount).toLocaleString("ar-EG")} ج.م</p></div>
      </div>

      {/* BOQ */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">جدول الكميات (BOQ)</h2>
        <button onClick={() => setShowBoqForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showBoqForm ? <X size={14} /> : <Plus size={14} />} بند جديد
        </button>
      </div>
      {showBoqForm && (
        <form onSubmit={addBoq} className="card grid grid-cols-1 sm:grid-cols-5 gap-4">
          <input required placeholder="الكود" value={boqForm.code} onChange={(e) => setBoqForm({ ...boqForm, code: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder="الوصف" value={boqForm.description} onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })} className="border rounded-xl px-3 py-2 sm:col-span-2" />
          <input required placeholder="الوحدة" value={boqForm.unit} onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required type="number" step="0.001" placeholder="الكمية" value={boqForm.quantity} onChange={(e) => setBoqForm({ ...boqForm, quantity: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          <input required type="number" step="0.01" placeholder="سعر الوحدة" value={boqForm.unitPrice} onChange={(e) => setBoqForm({ ...boqForm, unitPrice: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          {error && <p className="text-danger text-sm sm:col-span-5">{error}</p>}
          <div className="sm:col-span-5">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">حفظ البند</button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">الكود</th><th className="p-3 font-medium">الوصف</th>
              <th className="p-3 font-medium">الوحدة</th><th className="p-3 font-medium">الكمية</th>
              <th className="p-3 font-medium">سعر الوحدة</th><th className="p-3 font-medium">الإجمالي</th><th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contract.boqItems.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={7}>لا يوجد بنود بعد.</td></tr>}
            {contract.boqItems.map((i: any) => (
              <tr key={i.id} className="border-t">
                <td className="p-3">{i.code}</td>
                <td className="p-3">{i.description}</td>
                <td className="p-3">{i.unit}</td>
                <td className="p-3">{Number(i.quantity).toLocaleString("ar-EG")}</td>
                <td className="p-3">{Number(i.unitPrice).toLocaleString("ar-EG")}</td>
                <td className="p-3">{(Number(i.quantity) * Number(i.unitPrice)).toLocaleString("ar-EG")}</td>
                <td className="p-3"><button onClick={() => deleteBoq(i.id)} className="text-danger text-xs">حذف</button></td>
              </tr>
            ))}
          </tbody>
          {contract.boqItems.length > 0 && (
            <tfoot><tr className="border-t bg-neutral-50 font-semibold"><td className="p-3" colSpan={5}>الإجمالي</td><td className="p-3">{boqTotal.toLocaleString("ar-EG")} ج.م</td><td /></tr></tfoot>
          )}
        </table>
      </div>

      {/* Certificates */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">المستخلصات</h2>
        <button onClick={() => setShowCertForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showCertForm ? <X size={14} /> : <Plus size={14} />} مستخلص جديد
        </button>
      </div>
      {showCertForm && (
        <form onSubmit={addCertificate} className="card grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div><label className="text-sm text-neutral-600 block mb-1">من تاريخ</label><input required type="date" value={certForm.periodFrom} onChange={(e) => setCertForm({ ...certForm, periodFrom: e.target.value })} className="w-full border rounded-xl px-3 py-2" /></div>
          <div><label className="text-sm text-neutral-600 block mb-1">إلى تاريخ</label><input required type="date" value={certForm.periodTo} onChange={(e) => setCertForm({ ...certForm, periodTo: e.target.value })} className="w-full border rounded-xl px-3 py-2" /></div>
          <div><label className="text-sm text-neutral-600 block mb-1">نسبة الإنجاز التراكمية %</label><input required type="number" step="0.01" value={certForm.cumulativePct} onChange={(e) => setCertForm({ ...certForm, cumulativePct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" /></div>
          <div><label className="text-sm text-neutral-600 block mb-1">نسبة الضريبة %</label><input type="number" step="0.01" value={certForm.taxPct} onChange={(e) => setCertForm({ ...certForm, taxPct: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" /></div>
          {error && <p className="text-danger text-sm sm:col-span-4">{error}</p>}
          <div className="sm:col-span-4">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? "جارٍ الحساب..." : "حفظ المستخلص (يُحسب تلقائيًا)"}
            </button>
          </div>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">رقم</th><th className="p-3 font-medium">الفترة</th>
              <th className="p-3 font-medium">نسبة الإنجاز</th><th className="p-3 font-medium">قيمة الفترة</th>
              <th className="p-3 font-medium">الضمان</th><th className="p-3 font-medium">استرداد الدفعة</th>
              <th className="p-3 font-medium">صافي المستحق</th><th className="p-3 font-medium">الحالة</th><th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contract.certificates.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={9}>لا يوجد مستخلصات بعد.</td></tr>}
            {contract.certificates.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.number}</td>
                <td className="p-3">{new Date(c.periodFrom).toLocaleDateString("ar-EG")} - {new Date(c.periodTo).toLocaleDateString("ar-EG")}</td>
                <td className="p-3">{Number(c.cumulativePct)}%</td>
                <td className="p-3">{Number(c.thisPeriodValue).toLocaleString("ar-EG")}</td>
                <td className="p-3">{Number(c.retentionAmount).toLocaleString("ar-EG")}</td>
                <td className="p-3">{Number(c.advanceRecoveryAmount).toLocaleString("ar-EG")}</td>
                <td className="p-3 font-semibold">{Number(c.netPayable).toLocaleString("ar-EG")}</td>
                <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[c.status]}`}>{statusLabels[c.status]}</span></td>
                <td className="p-3">
                  {c.status === "DRAFT" && <button onClick={() => transitionCert(c.id, "submit")} className="text-primary text-xs">تقديم</button>}
                  {c.status === "SUBMITTED" && <button onClick={() => transitionCert(c.id, "approve")} className="text-primary text-xs">اعتماد</button>}
                  {c.status === "APPROVED" && <button onClick={() => transitionCert(c.id, "pay")} className="text-success text-xs">تسجيل الصرف</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
