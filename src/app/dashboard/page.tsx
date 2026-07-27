import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

const dict = {
  ar: {
    title: "الرئيسية",
    tagline: "نظام إدارة متكامل لأعمال المقاولات — تفاصيل المشاريع والأرباح والرسوم البيانية موجودة في صفحة \"المشاريع\".",
    address: "العنوان",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    website: "الموقع",
    taxNumber: "الرقم الضريبي",
    commercialReg: "السجل التجاري",
  },
  en: {
    title: "Dashboard",
    tagline: 'A complete construction management system — project, profit, and chart details are on the "Projects" page.',
    address: "Address",
    phone: "Phone",
    email: "Email",
    website: "Website",
    taxNumber: "Tax Number",
    commercialReg: "Commercial Registry",
  },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const locale = cookies().get("locale")?.value === "en" ? "en" : "ar";
  const t = dict[locale];

  const company = await prisma.companyProfile.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return (
    <AppShell title={t.title}>
      <div className="card flex flex-col items-center text-center py-14 gap-4">
        <img src="/logo.png" alt="Section" className="h-24 w-auto object-contain" />
        <h2 className="text-2xl font-bold text-neutral-900">{company.name}</h2>
        <p className="text-sm text-neutral-500 max-w-lg">{t.tagline}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2 text-sm text-neutral-600 mt-4">
          {company.address && <p><span className="text-neutral-400">{t.address}: </span>{company.address}</p>}
          {company.phone && <p><span className="text-neutral-400">{t.phone}: </span>{company.phone}</p>}
          {company.email && <p><span className="text-neutral-400">{t.email}: </span>{company.email}</p>}
          {company.website && <p><span className="text-neutral-400">{t.website}: </span>{company.website}</p>}
          {company.taxNumber && <p><span className="text-neutral-400">{t.taxNumber}: </span>{company.taxNumber}</p>}
          {company.commercialReg && <p><span className="text-neutral-400">{t.commercialReg}: </span>{company.commercialReg}</p>}
        </div>
      </div>
    </AppShell>
  );
}
