"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Languages, ChevronDown } from "lucide-react";

function getLocaleCookie(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/(?:^|; )locale=(ar|en)/);
  return (match?.[1] as "ar" | "en") ?? "ar";
}

export function UserMenu() {
  const [user, setUser] = useState<{ name: string; roleLabel: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<"ar" | "en">("ar");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser);
    setLocale(getLocaleCookie());
  }, []);

  function toggleLocale() {
    const next = locale === "ar" ? "en" : "ar";
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLocale}
        title={locale === "ar" ? "Switch to English" : "التبديل للعربية"}
        className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
      >
        <Languages size={15} />
        AR/EN
      </button>

      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50">
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium leading-none">{user?.name ?? "..."}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{user?.roleLabel}</p>
          </div>
          <ChevronDown size={14} className="text-neutral-400" />
        </button>

        {open && (
          <div className="absolute left-0 mt-1 w-40 bg-white rounded-xl shadow-lg border z-50">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-danger/5 rounded-xl"
            >
              <LogOut size={15} />
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
