"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";

const statusLabels: Record<string, { ar: string; en: string }> = {
  PRESENT: { ar: "حاضر", en: "Present" },
  ABSENT: { ar: "غائب", en: "Absent" },
  LEAVE: { ar: "إجازة", en: "Leave" },
  SICK: { ar: "مرضي", en: "Sick" },
};
const statusStyles: Record<string, string> = {
  PRESENT: "bg-success/10 text-success",
  ABSENT: "bg-danger/10 text-danger",
  LEAVE: "bg-secondary/10 text-secondary",
  SICK: "bg-primary/10 text-primary",
};

const dict = {
  ar: {
    title: "الحضور والانصراف", thEmployee: "الموظف", thDepartment: "القسم", thCurrentStatus: "الحالة الحالية",
    thQuick: "تسجيل سريع", loading: "جارٍ التحميل...", empty: "لا يوجد موظفون نشطون.", notRecorded: "لم يُسجَّل",
  },
  en: {
    title: "Attendance", thEmployee: "Employee", thDepartment: "Department", thCurrentStatus: "Current Status",
    thQuick: "Quick Entry", loading: "Loading...", empty: "No active employees.", notRecorded: "Not recorded",
  },
};

export default function AttendancePage() {
  const locale = useLocale();
  const t = dict[locale];
  const [employees, setEmployees] = useState<any[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [eRes, aRes] = await Promise.all([
      fetch("/api/employees"),
      fetch(`/api/attendance?date=${date}`),
    ]);
    if (eRes.ok) setEmployees(await eRes.json());
    if (aRes.ok) setRecords(await aRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [date]);

  function recordFor(employeeId: string) {
    return records.find((r) => r.employeeId === employeeId);
  }

  async function markStatus(employeeId: string, status: string) {
    setSaving(employeeId);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, date, status }),
    });
    setSaving(null);
    load();
  }

  return (
    <AppShell
      title={t.title}
      action={
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
      }
    >
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thEmployee}</th>
              <th className="p-3 font-medium">{t.thDepartment}</th>
              <th className="p-3 font-medium">{t.thCurrentStatus}</th>
              <th className="p-3 font-medium">{t.thQuick}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={4}>{t.loading}</td></tr>}
            {!loading && employees.filter((e) => e.isActive).length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={4}>{t.empty}</td></tr>
            )}
            {employees.filter((e) => e.isActive).map((emp) => {
              const rec = recordFor(emp.id);
              return (
                <tr key={emp.id} className="border-t">
                  <td className="p-3 font-medium">{emp.name}</td>
                  <td className="p-3">{emp.department || "—"}</td>
                  <td className="p-3">
                    {rec ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[rec.status]}`}>{statusLabels[rec.status][locale]}</span>
                    ) : (
                      <span className="text-xs text-neutral-400">{t.notRecorded}</span>
                    )}
                  </td>
                  <td className="p-3 flex gap-2 flex-wrap">
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <button
                        key={key}
                        disabled={saving === emp.id}
                        onClick={() => markStatus(emp.id, key)}
                        className={`text-xs px-2 py-1 rounded-lg border ${rec?.status === key ? "bg-primary text-white border-primary" : "hover:bg-neutral-50"}`}
                      >
                        {label[locale]}
                      </button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
