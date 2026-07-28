"use client";

import { useLocale } from "@/lib/use-locale";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#C9692E", "#565B60", "#2E7D32", "#E08A4F", "#9A4E20", "#25282B"];

export function MonthlyProfitChart({ data }: { data: { month: string; profit: number }[] }) {
  const locale = useLocale();
  return (
    <div className="card">
      <p className="font-semibold mb-4">{locale === "ar" ? "الأرباح الشهرية" : "Monthly Profit"}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString("ar-EG") + " ج.م"} />
          <Bar dataKey="profit" fill="#C9692E" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensesByCategoryChart({ data }: { data: { name: string; value: number }[] }) {
  const locale = useLocale();
  return (
    <div className="card">
      <p className="font-semibold mb-4">{locale === "ar" ? "المصروفات حسب البند" : "Expenses by Category"}</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString("ar-EG") + " ج.م"} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClientProjectsChart({ data }: { data: { name: string; value: number; paid: number; remaining: number }[] }) {
  const locale = useLocale();
  return (
    <div className="card">
      <p className="font-semibold mb-4">{locale === "ar" ? "قيمة المشاريع مقابل المدفوع والمتبقي" : "Project Value vs Paid vs Remaining"}</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} />
          <Bar dataKey="value" name={locale === "ar" ? "قيمة العقد" : "Contract Value"} fill="#565B60" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid" name={locale === "ar" ? "المدفوع" : "Paid"} fill="#2E7D32" radius={[4, 4, 0, 0]} />
          <Bar dataKey="remaining" name={locale === "ar" ? "المتبقي" : "Remaining"} fill="#C9692E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function PartnerDistributionBars({ data }: { data: { name: string; pct: number }[] }) {
  const locale = useLocale();
  return (
    <div className="card">
      <p className="font-semibold mb-4">{locale === "ar" ? "توزيع الأرباح بين الشركاء" : "Profit Distribution Among Partners"}</p>
      <div className="space-y-3">
        {data.length === 0 && <p className="text-sm text-neutral-400">لا يوجد شركاء بعد.</p>}
        {data.map((p, i) => (
          <div key={p.name}>
            <div className="flex justify-between text-sm mb-1"><span>{p.name}</span><span>{p.pct}%</span></div>
            <div className="h-2 bg-neutral-100 rounded-full">
              <div className="h-2 rounded-full" style={{ width: `${p.pct}%`, background: COLORS[i % COLORS.length] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
