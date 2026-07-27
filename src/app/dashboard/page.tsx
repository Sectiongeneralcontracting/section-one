import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const company = await prisma.companyProfile.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return (
    <AppShell title="الرئيسية">
      <div className="card flex flex-col items-center text-center py-14 gap-4">
        <img src="/logo.png" alt="Section" className="h-24 w-auto object-contain" />
        <h2 className="text-2xl font-bold text-neutral-900">{company.name}</h2>
        <p className="text-sm text-neutral-500 max-w-lg">
          نظام إدارة متكامل لأعمال المقاولات — تفاصيل المشاريع والأرباح والرسوم البيانية موجودة في صفحة "المشاريع".
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2 text-sm text-neutral-600 mt-4">
          {company.address && <p><span className="text-neutral-400">العنوان: </span>{company.address}</p>}
          {company.phone && <p><span className="text-neutral-400">الهاتف: </span>{company.phone}</p>}
          {company.email && <p><span className="text-neutral-400">البريد الإلكتروني: </span>{company.email}</p>}
          {company.website && <p><span className="text-neutral-400">الموقع: </span>{company.website}</p>}
          {company.taxNumber && <p><span className="text-neutral-400">الرقم الضريبي: </span>{company.taxNumber}</p>}
          {company.commercialReg && <p><span className="text-neutral-400">السجل التجاري: </span>{company.commercialReg}</p>}
        </div>
      </div>
    </AppShell>
  );
}
