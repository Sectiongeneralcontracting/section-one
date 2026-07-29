"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// بيلف window.fetch مرة واحدة على مستوى الموقع كله — أي استدعاء API في أي صفحة بيرجّع 401
// (يعني الجلسة بطلت صالحة: الحساب اتعطّل، الدور اتغيّر، كلمة السر اتغيّرت من مكان تاني) بيوجّه المستخدم
// فورًا لصفحة الدخول برسالة واضحة، بدل ما يفضل واقف قدام صفحة كل بياناتها فاشلة من غير أي تفسير.
export function SessionGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/login")) return; // تجنّب أي حلقة على صفحة الدخول نفسها

    const originalFetch = window.fetch.bind(window);
    let redirecting = false;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await originalFetch(...args);
      if (res.status === 401 && !redirecting) {
        redirecting = true;
        window.location.href = "/login?reason=session-expired";
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname]);

  return null;
}
