"use client";

import { useEffect, useState } from "react";

// Hook موحّد لقراءة تفضيل اللغة (كوكيز locale) في أي Client Component.
// نفس المنطق مستخدم في Sidebar وUserMenu — هنا مركزي عشان أي صفحة جديدة تستخدمه بسهولة.
export function useLocale(): "ar" | "en" {
  const [locale, setLocale] = useState<"ar" | "en">("ar");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )locale=(ar|en)/);
    setLocale((match?.[1] as "ar" | "en") ?? "ar");
  }, []);

  return locale;
}
