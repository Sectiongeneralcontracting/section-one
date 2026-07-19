"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, HandCoins, Settings, UserCog, FileBarChart, FileSignature, Truck, ShoppingCart, Warehouse, HardHat, IdCard, Wallet, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/projects", label: "المشاريع", icon: Briefcase },
  { href: "/contracts", label: "العقود", icon: FileSignature },
  { href: "/clients", label: "العملاء", icon: Users },
  { href: "/partners", label: "الشركاء", icon: HandCoins },
  { href: "/suppliers", label: "الموردون", icon: Truck },
  { href: "/purchase-orders", label: "أوامر الشراء", icon: ShoppingCart },
  { href: "/inventory", label: "المخازن", icon: Warehouse },
  { href: "/equipment", label: "المعدات", icon: HardHat },
  { href: "/employees", label: "الموظفون", icon: IdCard },
  { href: "/attendance", label: "الحضور والانصراف", icon: CalendarCheck },
  { href: "/payroll", label: "الرواتب", icon: Wallet },
  { href: "/reports", label: "التقارير", icon: FileBarChart },
  { href: "/users", label: "المستخدمون", icon: UserCog },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 bg-steel-dark text-white min-h-screen p-4 hidden md:block">
      <div className="flex items-center gap-2 mb-1 px-2">
        <Image src="/logo.png" alt="Section" width={32} height={32} />
        <span className="text-lg font-bold">Section One</span>
      </div>
      <p className="text-[10px] text-white/50 px-2 mb-7 tracking-wide">CONSTRUCTION MANAGEMENT PLATFORM</p>
      <nav className="space-y-1">
        {items.map((item) => {
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
