"use client";

import { useLocale } from "@/lib/use-locale";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
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
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
  const fmt = (v: number) => v.toLocaleString(localeCode);

  const chartData = data.map((d) => ({
    ...d,
    paidPct: d.value > 0 ? Math.round((d.paid / d.value) * 100) : 0,
  }));
  const rowHeight = 46;
  const height = Math.max(chartData.length * rowHeight + 60, 200);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold">{locale === "ar" ? "المدفوع والمتبقي لكل مشروع" : "Paid vs Remaining per Project"}</p>
        <p className="text-xs text-neutral-400">{locale === "ar" ? "قيمة كل شريط = قيمة العقد الكاملة" : "Full bar length = total contract value"}</p>
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">{locale === "ar" ? "لا يوجد بيانات." : "No data."}</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="vertical"
            barCategoryGap={14}
            margin={{ top: 8, right: 48, bottom: 8, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEE" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#8A8F94" }} tickFormatter={fmt} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 12, fill: "#25282B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              formatter={(v: number, key: string) => [`${fmt(v)} ${currency}`, key]}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            <Bar dataKey="paid" name={locale === "ar" ? "المدفوع" : "Paid"} stackId="a" fill="#2E7D32" radius={[6, 0, 0, 6]} barSize={22}>
              <LabelList
                dataKey="paidPct"
                position="insideLeft"
                formatter={(v: number) => (v > 12 ? `${v}%` : "")}
                fill="#fff"
                fontSize={11}
                fontWeight={600}
              />
            </Bar>
            <Bar dataKey="remaining" name={locale === "ar" ? "المتبقي" : "Remaining"} stackId="a" fill="#E8B4A0" radius={[0, 6, 6, 0]} barSize={22}>
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: number) => fmt(v)}
                fill="#565B60"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
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
