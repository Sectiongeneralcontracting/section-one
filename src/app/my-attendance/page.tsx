"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { LogIn, LogOut } from "lucide-react";

const approvalLabels: Record<string, { ar: string; en: string }> = {
  PENDING: { ar: "بانتظار الاعتماد", en: "Pending Approval" },
  APPROVED: { ar: "معتمد", en: "Approved" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
};
const approvalStyles: Record<string, string> = {
  PENDING: "bg-secondary/10 text-secondary",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
};

const dict = {
  ar: {
    title: "حضوري وانصرافي", checkIn: "تسجيل حضور", checkOut: "تسجيل انصراف",
    todayStatus: "حالة اليوم", notCheckedIn: "لسه ما سجّلتش حضور النهاردة",
    checkedInAt: "حضرت الساعة", checkedOutAt: "انصرفت الساعة", saving: "جارٍ التسجيل...",
    errAction: "تعذر تنفيذ الإجراء", notLinked: "حسابك مش مربوط بسجل موظف — كلّم الأدمن لربطه.",
    alreadyCheckedIn: "تم تسجيل الحضور بالفعل", alreadyCheckedOut: "تم تسجيل الانصراف بالفعل",
    history: "سجل الأيام", thDate: "التاريخ", thCheckIn: "الحضور", thCheckOut: "الانصراف",
    thApproval: "الاعتماد", loading: "جارٍ التحميل...", empty: "لا يوجد سجلات بعد.",
    month: "الشهر",
  },
  en: {
    title: "My Attendance", checkIn: "Check In", checkOut: "Check Out",
    todayStatus: "Today's Status", notCheckedIn: "You haven't checked in today yet",
    checkedInAt: "Checked in at", checkedOutAt: "Checked out at", saving: "Recording...",
    errAction: "Action failed", notLinked: "Your account isn't linked to an employee record — ask the admin to link it.",
    alreadyCheckedIn: "Already checked in", alreadyCheckedOut: "Already checked out",
    history: "Days Log", thDate: "Date", thCheckIn: "Check In", thCheckOut: "Check Out",
    thApproval: "Approval", loading: "Loading...", empty: "No records yet.",
    month: "Month",
  },
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MyAttendancePage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";

  const [data, setData] = useState<any>(null);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [notLinked, setNotLinked] = useState(false);
  const actingRef = useRef(false); // حماية متزامنة ضد الضغط المزدوج السريع (قبل ما الـ state يتحدّث)

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/my-attendance?month=${month}`);
    if (res.status === 404) {
      setNotLinked(true);
    } else if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  async function act(action: "checkin" | "checkout") {
    // لو فيه طلب شغال بالفعل، أو المستخدم مسجّل الحالة دي بالفعل — امنع الإرسال من الأساس
    if (actingRef.current) return;
    if (action === "checkin" && data?.today) {
      setError(t.alreadyCheckedIn);
      return;
    }
    if (action === "checkout" && data?.today?.checkOut) {
      setError(t.alreadyCheckedOut);
      return;
    }

    actingRef.current = true;
    setActing(true);
    setError("");
    const res = await fetch("/api/my-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    actingRef.current = false;
    setActing(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? t.errAction);
      return;
    }

    const record = await res.json();
    // تحديث فوري للواجهة (Optimistic) قبل ما ننادي load() عشان الزرار يختفي على طول ومتفضلش نافذة يقدر فيها يضغط تاني
    setData((prev: any) => ({ ...prev, today: record }));
    load();
  }

  if (notLinked) {
    return (
      <AppShell title={t.title}>
        <div className="card">
          <p className="text-neutral-500">{t.notLinked}</p>
        </div>
      </AppShell>
    );
  }

  if (loading && !data) return <AppShell title={t.title}><></></AppShell>;

  const today = data?.today;

  return (
    <AppShell
      title={t.title}
      action={
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
      }
    >
      <div className="card space-y-4">
        <h2 className="font-semibold">{t.todayStatus}</h2>
        {!today && (
          <>
            <p className="text-sm text-neutral-500">{t.notCheckedIn}</p>
            <button onClick={() => act("checkin")} disabled={acting} className="bg-primary text-white rounded-xl px-6 py-3 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              <LogIn size={18} /> {acting ? t.saving : t.checkIn}
            </button>
          </>
        )}
        {today && (
          <div className="space-y-3">
            <p className="text-sm text-success">
              {t.checkedInAt} {new Date(today.checkIn).toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" })}
            </p>
            {today.checkOut ? (
              <p className="text-sm text-neutral-500">
                {t.checkedOutAt} {new Date(today.checkOut).toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : (
              <button onClick={() => act("checkout")} disabled={acting} className="bg-danger text-white rounded-xl px-6 py-3 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
                <LogOut size={18} /> {acting ? t.saving : t.checkOut}
              </button>
            )}
            <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${approvalStyles[today.approvalStatus]}`}>
              {approvalLabels[today.approvalStatus]?.[locale]}
            </span>
          </div>
        )}
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-3 border-b font-semibold text-sm">{t.history}</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thCheckIn}</th>
              <th className="p-3 font-medium">{t.thCheckOut}</th>
              <th className="p-3 font-medium">{t.thApproval}</th>
            </tr>
          </thead>
          <tbody>
            {(!data?.records || data.records.length === 0) && (
              <tr><td className="p-4 text-neutral-400" colSpan={4}>{t.empty}</td></tr>
            )}
            {data?.records?.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.date).toLocaleDateString(localeCode)}</td>
                <td className="p-3">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className="p-3">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${approvalStyles[r.approvalStatus]}`}>
                    {approvalLabels[r.approvalStatus]?.[locale]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
