"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

type Notif = { id: string; message: string; isRead: boolean; createdAt: string };

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifs(await res.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  }

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-xl hover:bg-neutral-100">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 max-h-96 overflow-auto">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-medium text-sm">الإشعارات</span>
            <button onClick={markAllRead} className="text-xs text-primary">تعليم الكل كمقروء</button>
          </div>
          {notifs.length === 0 && <p className="p-4 text-sm text-neutral-400">لا يوجد إشعارات.</p>}
          {notifs.map((n) => (
            <div key={n.id} className={`p-3 border-b text-sm ${n.isRead ? "text-neutral-500" : "font-medium"}`}>
              {n.message}
              <div className="text-xs text-neutral-400 mt-1">{new Date(n.createdAt).toLocaleString("ar-EG")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
