import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

const dict = {
  ar: { title: "الرئيسية", tagline: "Construction Management Platform", welcome: "أهلًا بك،" },
  en: { title: "Dashboard", tagline: "Construction Management Platform", welcome: "Welcome," },
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
      <div className="card flex flex-col items-center text-center py-20 gap-3">
        <img src="/logo.png" alt="Section" className="h-24 w-auto object-contain" />
        <h2 className="text-2xl font-bold text-neutral-900">{company.name}</h2>
        <p className="text-xs text-neutral-400 tracking-wide">{t.tagline}</p>
        <p className="text-sm text-neutral-500 mt-4">
          {t.welcome} <span className="font-medium text-neutral-700">{session.user?.name}</span>
        </p>
      </div>
    </AppShell>
  );
}
