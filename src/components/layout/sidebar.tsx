"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, HandCoins, Settings, UserCog, FileBarChart, FileSignature, Truck, ShoppingCart, Warehouse, HardHat, IdCard, Wallet, CalendarCheck, ChevronDown, Users2, FileText, HandCoins as Coins2, ShieldAlert, Plane, Landmark, Clock3, MinusCircle, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "الرئيسية", labelEn: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "المشاريع", labelEn: "Projects", icon: Briefcase },
  { href: "/contracts", label: "العقود", labelEn: "Contracts", icon: FileSignature },
  { href: "/clients", label: "العملاء", labelEn: "Clients", icon: Users },
  { href: "/partners", label: "الشركاء", labelEn: "Partners", icon: HandCoins },
  { href: "/suppliers", label: "الموردون", labelEn: "Suppliers", icon: Truck },
  { href: "/purchase-orders", label: "أوامر الشراء", labelEn: "Purchase Orders", icon: ShoppingCart },
  { href: "/inventory", label: "المخازن", labelEn: "Inventory", icon: Warehouse },
  { href: "/equipment", label: "المعدات", labelEn: "Equipment", icon: HardHat },
  { href: "/reports", label: "التقارير", labelEn: "Reports", icon: FileBarChart },
  { href: "/users", label: "المستخدمون", labelEn: "Users", icon: UserCog },
  { href: "/settings", label: "الإعدادات", labelEn: "Settings", icon: Settings },
];

// HR — بيانات وشؤون الموظفين
const hrItems = [
  { href: "/employees", label: "الموظفين", labelEn: "Employees", icon: IdCard },
  { href: "/hr/contracts", label: "العقود", labelEn: "Contracts", icon: FileText },
  { href: "/attendance", label: "الحضور", labelEn: "Attendance", icon: CalendarCheck },
  { href: "/employees", label: "المرتبات", labelEn: "Salaries", icon: Coins2 },
  { href: "/hr/advances", label: "السلف", labelEn: "Advances", icon: Landmark },
  { href: "/hr/penalties", label: "الجزاءات", labelEn: "Penalties", icon: ShieldAlert },
  { href: "/hr/leaves", label: "الإجازات", labelEn: "Leaves", icon: Plane },
];

// Payroll — تشغيل الرواتب الشهرية (كل البنود دي جوه صفحة الرواتب نفسها)
const payrollItems = [
  { href: "/payroll", label: "الرواتب", labelEn: "Payroll", icon: Wallet },
  { href: "/payroll", label: "البدلات", labelEn: "Allowances", icon: Coins2 },
  { href: "/payroll", label: "الإضافي", labelEn: "Overtime", icon: Clock3 },
  { href: "/payroll", label: "الاستقطاعات", labelEn: "Deductions", icon: MinusCircle },
  { href: "/payroll", label: "تحويل البنك", labelEn: "Bank Transfer", icon: Banknote },
];

export function Sidebar() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const hrActive = hrItems.some((i) => pathname?.startsWith(i.href));
  const payrollActive = pathname?.startsWith("/payroll") ?? false;
  const [hrOpen, setHrOpen] = useState(hrActive);
  const [payrollOpen, setPayrollOpen] = useState(payrollActive);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )locale=(ar|en)/);
    setLocale((match?.[1] as "ar" | "en") ?? "ar");
  }, []);

  useEffect(() => {
    if (hrActive) setHrOpen(true);
  }, [hrActive]);

  useEffect(() => {
    if (payrollActive) setPayrollOpen(true);
  }, [payrollActive]);

  return (
    <aside className="w-64 shrink-0 bg-steel-dark text-white min-h-screen p-4 hidden md:block overflow-y-auto">
      <div className="flex items-center gap-2 mb-1 px-2">
        <Image src="/logo.png" alt="Section" width={32} height={32} />
        <span className="text-lg font-bold">Section One</span>
      </div>
      <p className="text-[10px] text-white/50 px-2 mb-7 tracking-wide">CONSTRUCTION MANAGEMENT PLATFORM</p>
      <nav className="space-y-1">
        {items.slice(0, 8).map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                active ? "bg-primary/90 font-medium" : "hover:bg-white/10 text-white/85"
              )}
            >
              <item.icon size={18} />
              {locale === "en" ? item.labelEn : item.label}
            </Link>
          );
        })}

        {/* HR */}
        <button
          onClick={() => setHrOpen((v) => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
            hrActive ? "bg-primary/90 font-medium" : "hover:bg-white/10 text-white/85"
          )}
        >
          <Users2 size={18} />
          <span className="flex-1 text-right">HR</span>
          <ChevronDown size={14} className={cn("transition-transform", hrOpen && "rotate-180")} />
        </button>
        {hrOpen && (
          <div className="pr-4 space-y-1">
            {hrItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                    active ? "bg-primary/90 font-medium" : "hover:bg-white/10 text-white/70"
                  )}
                >
                  <item.icon size={16} />
                  {locale === "en" ? item.labelEn : item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Payroll */}
        <button
          onClick={() => setPayrollOpen((v) => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
            payrollActive ? "bg-primary/90 font-medium" : "hover:bg-white/10 text-white/85"
          )}
        >
          <Wallet size={18} />
          <span className="flex-1 text-right">Payroll</span>
          <ChevronDown size={14} className={cn("transition-transform", payrollOpen && "rotate-180")} />
        </button>
        {payrollOpen && (
          <div className="pr-4 space-y-1">
            {payrollItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                    active ? "bg-primary/90 font-medium" : "hover:bg-white/10 text-white/70"
                  )}
                >
                  <item.icon size={16} />
                  {locale === "en" ? item.labelEn : item.label}
                </Link>
              );
            })}
          </div>
        )}

        {items.slice(8).map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                active ? "bg-primary/90 font-medium" : "hover:bg-white/10 text-white/85"
              )}
            >
              <item.icon size={18} />
              {locale === "en" ? item.labelEn : item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
