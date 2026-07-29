import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SessionGuard } from "@/components/session-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Section One — Construction Management Platform",
  description: "نظام إدارة الأرباح والشركاء - Section General Contracting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = cookies().get("locale")?.value === "en" ? "en" : "ar";
  const theme = cookies().get("theme")?.value === "dark" ? "dark" : "light";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={theme === "dark" ? "dark" : ""}>
      <body>
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}
