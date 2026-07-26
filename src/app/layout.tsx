import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Section One — Construction Management Platform",
  description: "نظام إدارة الأرباح والشركاء - Section General Contracting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = cookies().get("locale")?.value === "en" ? "en" : "ar";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
