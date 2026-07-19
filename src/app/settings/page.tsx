"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetch("/api/company-profile").then((r) => r.json()).then(setCompany);
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  async function exportBackup() {
    const res = await fetch("/api/backup");
    if (!res.ok) return alert("تعذر إنشاء النسخة الاحتياطية");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `section-finance-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("تحذير: استعادة نسخة احتياطية هتستبدل كل البيانات الحالية. متأكد؟")) {
      e.target.value = "";
      return;
    }
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, data: parsed.data }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      alert("تم استعادة النسخة الاحتياطية بنجاح ✓");
    } catch (err: any) {
      alert("تعذر الاستيراد: " + (err.message ?? "ملف غير صالح"));
    }
    setRestoring(false);
    e.target.value = "";
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSavedMsg("");
    const res = await fetch("/api/company-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    if (!res.ok) return setError("تعذر الحفظ — يتطلب صلاحية Admin");
    setSavedMsg("تم حفظ بيانات الشركة ✓");
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSavedMsg("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        insuranceRate: Number(settings.insuranceRate),
        taxRate: Number(settings.taxRate),
      }),
    });
    if (!res.ok) return setError("تعذر الحفظ — يتطلب صلاحية Admin");
    setSavedMsg("تم حفظ إعدادات النظام ✓");
  }

  if (!company || !settings) {
    return (
      <AppShell title="الإعدادات">
        <p className="text-neutral-400">جارٍ التحميل...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="الإعدادات">
      {savedMsg && <p className="text-success text-sm">{savedMsg}</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      <form onSubmit={saveCompany} className="card space-y-4">
        <h2 className="font-semibold">بيانات الشركة (تظهر في كل التقارير)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="اسم الشركة" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
          <Field label="الهاتف" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
          <Field label="البريد الإلكتروني" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
          <Field label="الموقع الإلكتروني" value={company.website} onChange={(v) => setCompany({ ...company, website: v })} />
          <Field label="الرقم الضريبي" value={company.taxNumber} onChange={(v) => setCompany({ ...company, taxNumber: v })} />
          <Field label="السجل التجاري" value={company.commercialReg} onChange={(v) => setCompany({ ...company, commercialReg: v })} />
          <div className="sm:col-span-2">
            <Field label="العنوان" value={company.address} onChange={(v) => setCompany({ ...company, address: v })} />
          </div>
        </div>
        <button className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium">حفظ بيانات الشركة</button>
      </form>

      <form onSubmit={saveSettings} className="card space-y-4">
        <h2 className="font-semibold">إعدادات النظام</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="نسبة التأمينات %" type="number" value={settings.insuranceRate} onChange={(v) => setSettings({ ...settings, insuranceRate: v })} />
          <Field label="نسبة الضريبة %" type="number" value={settings.taxRate} onChange={(v) => setSettings({ ...settings, taxRate: v })} />
          <Field label="العملة" value={settings.currency} onChange={(v) => setSettings({ ...settings, currency: v })} />
          <div>
            <label className="text-sm text-neutral-600 block mb-1">اللغة الافتراضية</label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <button className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium">حفظ إعدادات النظام</button>
      </form>

      <div className="card space-y-3">
        <h2 className="font-semibold">النسخ الاحتياطي والاستعادة</h2>
        <p className="text-sm text-neutral-500">
          تصدير نسخة كاملة من قاعدة البيانات كملف JSON، أو استعادة نسخة سابقة (سيتم استبدال كل البيانات الحالية).
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportBackup} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium">
            تصدير نسخة احتياطية
          </button>
          <label className="border rounded-xl px-5 py-2 text-sm font-medium cursor-pointer">
            {restoring ? "جارٍ الاستعادة..." : "استعادة نسخة احتياطية"}
            <input type="file" accept="application/json" onChange={importBackup} disabled={restoring} className="hidden" />
          </label>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm text-neutral-600 block mb-1">{label}</label>
      <input
        type={type}
        step={type === "number" ? "0.001" : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2"
      />
    </div>
  );
}
