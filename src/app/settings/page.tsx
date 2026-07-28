"use client";

import { useEffect, useState, Fragment } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { ROLE_LABELS } from "@/lib/modules";
import { resizeImageToDataUrl } from "@/lib/image-utils";
import { Sun, Moon, Building2 } from "lucide-react";

const dict = {
  ar: {
    title: "الإعدادات", tabGeneral: "عام", tabAppearance: "المظهر", tabPermissions: "الصلاحيات",
    permissionsTitle: "صلاحيات الأدوار الوظيفية",
    permissionsDesc: "تحكم في كل دور وظيفي يقدر يشوف إيه ويعدّل إيه في النظام. مدير النظام (Admin) دايمًا له صلاحية كاملة على كل حاجة تلقائيًا.",
    view: "عرض", edit: "تعديل", savePermissions: "حفظ الصلاحيات", savingPermissions: "جارٍ الحفظ...",
    permissionsSaved: "تم حفظ الصلاحيات ✓", errPermissions: "تعذر حفظ الصلاحيات",
    appearanceTitle: "لون النظام", appearanceDesc: "اختر مظهر النظام: فاتح (أبيض) أو غامق (أسود) بألوان مريحة للعين.",
    light: "فاتح (أبيض)", dark: "غامق (أسود)",
    companyTitle: "بيانات الشركة (تظهر في كل التقارير)",
    companyLogo: "شعار الشركة", uploadLogo: "رفع شعار", uploading: "جارٍ الرفع...", removeLogo: "إزالة",
    logoNote: "الشعار ده بيظهر في عروض الأسعار المطبوعة والمُصدَّرة لملف Word.",
    companyName: "اسم الشركة", phone: "الهاتف", email: "البريد الإلكتروني", website: "الموقع الإلكتروني",
    taxNumber: "الرقم الضريبي", commercialReg: "السجل التجاري", address: "العنوان",
    saveCompany: "حفظ بيانات الشركة",
    systemSettingsTitle: "إعدادات النظام", insuranceRate: "نسبة التأمينات %", taxRate: "نسبة الضريبة %",
    currency: "العملة", defaultLanguage: "اللغة الافتراضية", arabic: "العربية", english: "English",
    saveSettings: "حفظ إعدادات النظام",
    backupTitle: "النسخ الاحتياطي والاستعادة",
    backupDesc: "تصدير نسخة كاملة من قاعدة البيانات كملف JSON، أو استعادة نسخة سابقة (سيتم استبدال كل البيانات الحالية).",
    exportBackup: "تصدير نسخة احتياطية", restoreBackup: "استعادة نسخة احتياطية", restoring: "جارٍ الاستعادة...",
    loading: "جارٍ التحميل...",
    savedCompany: "تم حفظ بيانات الشركة ✓", savedSettings: "تم حفظ إعدادات النظام ✓",
    errSave: "تعذر الحفظ — يتطلب صلاحية Admin", errBackup: "تعذر إنشاء النسخة الاحتياطية",
    confirmRestore: "تحذير: استعادة نسخة احتياطية هتستبدل كل البيانات الحالية. متأكد؟",
    restoredOk: "تم استعادة النسخة الاحتياطية بنجاح ✓", errRestore: "تعذر الاستيراد: ",
  },
  en: {
    title: "Settings", tabGeneral: "General", tabAppearance: "Appearance", tabPermissions: "Permissions",
    permissionsTitle: "Role Permissions",
    permissionsDesc: "Control what each functional role can view and edit in the system. Admin always has full access to everything automatically.",
    view: "View", edit: "Edit", savePermissions: "Save Permissions", savingPermissions: "Saving...",
    permissionsSaved: "Permissions saved ✓", errPermissions: "Failed to save permissions",
    appearanceTitle: "System Theme", appearanceDesc: "Choose the system appearance: light (white) or dark (black) with comfortable colors.",
    light: "Light", dark: "Dark",
    companyTitle: "Company Info (shown on all reports)",
    companyLogo: "Company Logo", uploadLogo: "Upload Logo", uploading: "Uploading...", removeLogo: "Remove",
    logoNote: "This logo appears on printed and exported (Word) quotations.",
    companyName: "Company Name", phone: "Phone", email: "Email", website: "Website",
    taxNumber: "Tax Number", commercialReg: "Commercial Registry", address: "Address",
    saveCompany: "Save Company Info",
    systemSettingsTitle: "System Settings", insuranceRate: "Insurance Rate %", taxRate: "Tax Rate %",
    currency: "Currency", defaultLanguage: "Default Language", arabic: "العربية", english: "English",
    saveSettings: "Save System Settings",
    backupTitle: "Backup & Restore",
    backupDesc: "Export a full database backup as a JSON file, or restore a previous one (this replaces all current data).",
    exportBackup: "Export Backup", restoreBackup: "Restore Backup", restoring: "Restoring...",
    loading: "Loading...",
    savedCompany: "Company info saved ✓", savedSettings: "System settings saved ✓",
    errSave: "Failed to save — requires Admin role", errBackup: "Failed to create backup",
    confirmRestore: "Warning: restoring a backup will replace all current data. Continue?",
    restoredOk: "Backup restored successfully ✓", errRestore: "Import failed: ",
  },
};

export default function SettingsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [tab, setTab] = useState<"general" | "appearance" | "permissions">("general");
  const [permMatrix, setPermMatrix] = useState<any>(null);
  const [permSaving, setPermSaving] = useState(false);
  const [permSaved, setPermSaved] = useState("");
  const [company, setCompany] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    fetch("/api/company-profile").then((r) => r.json()).then(setCompany);
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
    const match = document.cookie.match(/(?:^|; )theme=(light|dark)/);
    setTheme((match?.[1] as "light" | "dark") ?? "light");
  }, []);

  useEffect(() => {
    if (tab === "permissions" && !permMatrix) {
      fetch("/api/permissions").then((r) => (r.ok ? r.json() : null)).then((d) => d && setPermMatrix(d));
    }
  }, [tab]);

  function togglePerm(role: string, moduleKey: string, field: "canView" | "canEdit") {
    setPermMatrix((prev: any) => {
      const next = { ...prev, matrix: { ...prev.matrix } };
      next.matrix[role] = { ...next.matrix[role] };
      const cell = { ...next.matrix[role][moduleKey], [field]: !next.matrix[role][moduleKey][field] };
      // مينفعش تدي صلاحية تعديل من غير صلاحية عرض
      if (field === "canEdit" && cell.canEdit) cell.canView = true;
      if (field === "canView" && !cell.canView) cell.canEdit = false;
      next.matrix[role][moduleKey] = cell;
      return next;
    });
  }

  async function savePermissions() {
    setPermSaving(true);
    setPermSaved("");
    const updates: any[] = [];
    for (const role of permMatrix.roles) {
      for (const m of permMatrix.modules) {
        const cell = permMatrix.matrix[role][m.key];
        updates.push({ role, module: m.key, canView: cell.canView, canEdit: cell.canEdit });
      }
    }
    const res = await fetch("/api/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    setPermSaving(false);
    if (!res.ok) return alert(t.errPermissions);
    setPermSaved(t.permissionsSaved);
  }

  function applyTheme(next: "light" | "dark") {
    document.cookie = `theme=${next}; path=/; max-age=31536000`;
    setTheme(next);
    window.location.reload();
  }

  async function exportBackup() {
    const res = await fetch("/api/backup");
    if (!res.ok) return alert(t.errBackup);
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
    if (!confirm(t.confirmRestore)) {
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
      alert(t.restoredOk);
    } catch (err: any) {
      alert(t.errRestore + (err.message ?? ""));
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
    if (!res.ok) return setError(t.errSave);
    setSavedMsg(t.savedCompany);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 500, 0.9);
      setCompany((c: any) => ({ ...c, logoUrl: dataUrl }));
    } catch {
      setError(t.errSave);
    }
    setUploadingLogo(false);
    e.target.value = "";
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
    if (!res.ok) return setError(t.errSave);
    setSavedMsg(t.savedSettings);
  }

  if (!company || !settings) {
    return (
      <AppShell title={t.title}>
        <p className="text-neutral-400">{t.loading}</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={t.title}>
      <div className="flex gap-2">
        <button
          onClick={() => setTab("general")}
          className={`text-sm px-4 py-2 rounded-xl ${tab === "general" ? "bg-primary text-white" : "border"}`}
        >
          {t.tabGeneral}
        </button>
        <button
          onClick={() => setTab("appearance")}
          className={`text-sm px-4 py-2 rounded-xl ${tab === "appearance" ? "bg-primary text-white" : "border"}`}
        >
          {t.tabAppearance}
        </button>
        <button
          onClick={() => setTab("permissions")}
          className={`text-sm px-4 py-2 rounded-xl ${tab === "permissions" ? "bg-primary text-white" : "border"}`}
        >
          {t.tabPermissions}
        </button>
      </div>

      {tab === "permissions" && (
        <div className="card space-y-4 overflow-x-auto">
          <h2 className="font-semibold">{t.permissionsTitle}</h2>
          <p className="text-sm text-neutral-500">{t.permissionsDesc}</p>
          {!permMatrix ? (
            <p className="text-sm text-neutral-400">...</p>
          ) : (
            <>
              <table className="w-full text-sm border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    <th className="p-2 text-right border-b sticky right-0 bg-white">{locale === "ar" ? "الموديول" : "Module"}</th>
                    {permMatrix.roles.map((role: string) => (
                      <th key={role} className="p-2 text-center border-b" colSpan={2}>
                        {ROLE_LABELS[role]?.[locale] ?? role}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="border-b sticky right-0 bg-white"></th>
                    {permMatrix.roles.map((role: string) => (
                      <Fragment key={role}>
                        <th className="p-1 text-center border-b text-xs font-normal text-neutral-400">{t.view}</th>
                        <th className="p-1 text-center border-b text-xs font-normal text-neutral-400">{t.edit}</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permMatrix.modules.map((m: any) => (
                    <tr key={m.key} className="border-b">
                      <td className="p-2 font-medium sticky right-0 bg-white">{locale === "ar" ? m.label : m.labelEn}</td>
                      {permMatrix.roles.map((role: string) => {
                        const cell = permMatrix.matrix[role][m.key];
                        return (
                          <Fragment key={role + m.key}>
                            <td className="p-1 text-center">
                              <input type="checkbox" checked={cell.canView} onChange={() => togglePerm(role, m.key, "canView")} />
                            </td>
                            <td className="p-1 text-center">
                              <input type="checkbox" checked={cell.canEdit} onChange={() => togglePerm(role, m.key, "canEdit")} />
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {permSaved && <p className="text-success text-sm">{permSaved}</p>}
              <button onClick={savePermissions} disabled={permSaving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
                {permSaving ? t.savingPermissions : t.savePermissions}
              </button>
            </>
          )}
        </div>
      )}

      {tab === "appearance" && (
        <div className="card space-y-4">
          <h2 className="font-semibold">{t.appearanceTitle}</h2>
          <p className="text-sm text-neutral-500">{t.appearanceDesc}</p>
          <div className="flex gap-4">
            <button
              onClick={() => applyTheme("light")}
              className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border-2 ${theme === "light" ? "border-primary" : "border-neutral-200"}`}
            >
              <div className="w-full h-16 rounded-lg bg-white border border-neutral-200 flex items-center justify-center">
                <Sun size={22} className="text-warning" />
              </div>
              <span className="text-sm font-medium">{t.light}</span>
            </button>
            <button
              onClick={() => applyTheme("dark")}
              className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border-2 ${theme === "dark" ? "border-primary" : "border-neutral-200"}`}
            >
              <div className="w-full h-16 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                <Moon size={22} className="text-neutral-200" />
              </div>
              <span className="text-sm font-medium">{t.dark}</span>
            </button>
          </div>
        </div>
      )}

      {tab === "general" && (
      <>
      {savedMsg && <p className="text-success text-sm">{savedMsg}</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      <form onSubmit={saveCompany} className="card space-y-4">
        <h2 className="font-semibold">{t.companyTitle}</h2>
        <div>
          <label className="text-sm text-neutral-600 block mb-1">{t.companyLogo}</label>
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="logo" className="h-20 w-20 object-contain rounded-xl border bg-white" />
            ) : (
              <div className="h-20 w-20 rounded-xl border bg-neutral-50 flex items-center justify-center text-neutral-300">
                <Building2 size={28} />
              </div>
            )}
            <label className="border rounded-xl px-4 py-2 text-sm font-medium cursor-pointer">
              {uploadingLogo ? t.uploading : t.uploadLogo}
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
            </label>
            {company.logoUrl && (
              <button type="button" onClick={() => setCompany({ ...company, logoUrl: "" })} className="text-danger text-sm">
                {t.removeLogo}
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1">{t.logoNote}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t.companyName} value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
          <Field label={t.phone} value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
          <Field label={t.email} value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
          <Field label={t.website} value={company.website} onChange={(v) => setCompany({ ...company, website: v })} />
          <Field label={t.taxNumber} value={company.taxNumber} onChange={(v) => setCompany({ ...company, taxNumber: v })} />
          <Field label={t.commercialReg} value={company.commercialReg} onChange={(v) => setCompany({ ...company, commercialReg: v })} />
          <div className="sm:col-span-2">
            <Field label={t.address} value={company.address} onChange={(v) => setCompany({ ...company, address: v })} />
          </div>
        </div>
        <button className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium">{t.saveCompany}</button>
      </form>

      <form onSubmit={saveSettings} className="card space-y-4">
        <h2 className="font-semibold">{t.systemSettingsTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label={t.insuranceRate} type="number" value={settings.insuranceRate} onChange={(v) => setSettings({ ...settings, insuranceRate: v })} />
          <Field label={t.taxRate} type="number" value={settings.taxRate} onChange={(v) => setSettings({ ...settings, taxRate: v })} />
          <Field label={t.currency} value={settings.currency} onChange={(v) => setSettings({ ...settings, currency: v })} />
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.defaultLanguage}</label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="ar">{t.arabic}</option>
              <option value="en">{t.english}</option>
            </select>
          </div>
        </div>
        <button className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium">{t.saveSettings}</button>
      </form>

      <div className="card space-y-3">
        <h2 className="font-semibold">{t.backupTitle}</h2>
        <p className="text-sm text-neutral-500">{t.backupDesc}</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportBackup} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium">
            {t.exportBackup}
          </button>
          <label className="border rounded-xl px-5 py-2 text-sm font-medium cursor-pointer">
            {restoring ? t.restoring : t.restoreBackup}
            <input type="file" accept="application/json" onChange={importBackup} disabled={restoring} className="hidden" />
          </label>
        </div>
      </div>
      </>
      )}
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
