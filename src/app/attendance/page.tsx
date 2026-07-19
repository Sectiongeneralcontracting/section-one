"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

const statusLabels: Record<string, string> = { PRESENT: "حاضر", ABSENT: "غائب", LEAVE: "إجازة", SICK: "مرضي" };
const statusStyles: Record<string, string> = {
  PRESENT: "bg-success/10 text-success",
  ABSENT: "bg-danger/10 text-danger",
  LEAVE: "bg-secondary/10 text-secondary",
  SICK: "bg-primary/10 text-primary",
};

export default function AttendancePage() {
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
      title="الحضور والانصراف"
      action={
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
      }
    >
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">الموظف</th>
              <th className="p-3 font-medium">القسم</th>
              <th className="p-3 font-medium">الحالة الحالية</th>
              <th className="p-3 font-medium">تسجيل سريع</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={4}>جارٍ التحميل...</td></tr>}
            {!loading && employees.filter((e) => e.isActive).length === 0 && (
              <tr><td className="p-4 text-neutral-400" colSpan={4}>لا يوجد موظفون نشطون.</td></tr>
            )}
            {employees.filter((e) => e.isActive).map((emp) => {
              const rec = recordFor(emp.id);
              return (
                <tr key={emp.id} className="border-t">
                  <td className="p-3 font-medium">{emp.name}</td>
                  <td className="p-3">{emp.department || "—"}</td>
                  <td className="p-3">
                    {rec ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[rec.status]}`}>{statusLabels[rec.status]}</span>
                    ) : (
                      <span className="text-xs text-neutral-400">لم يُسجَّل</span>
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
                        {label}
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
