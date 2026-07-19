import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Section One — Construction Management Platform",
  description: "نظام إدارة الأرباح والشركاء - Section General Contracting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // اللغة الافتراضية عربي / RTL — تُقرأ لاحقًا من SystemSettings
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
