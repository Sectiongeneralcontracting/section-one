"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Printer } from "lucide-react";

type Tab = "clients" | "projects" | "partners" | "management" | "executive";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("executive");
  const [company, setCompany] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/company-profile").then((r) => r.json()).then(setCompany);
    fetch("/api/clients").then((r) => r.json()).then(setClients);
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
    fetch("/api/partners").then((r) => r.json()).then(setPartners);
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
    fetch("/api/purchase-orders").then((r) => r.json()).then(setPurchaseOrders);
    fetch("/api/inventory-items").then((r) => r.json()).then(setInventoryItems);
    fetch("/api/equipment").then((r) => r.json()).then(setEquipment);
    fetch("/api/employees").then((r) => r.json()).then(setEmployees);
    const month = new Date().toISOString().slice(0, 7);
    fetch(`/api/payroll?month=${month}`).then((r) => r.json()).then(setPayroll);
    fetch("/api/contracts").then((r) => r.json()).then(setContracts);
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "executive", label: "تقارير تنفيذية" },
    { key: "management", label: "تقارير الإدارة" },
    { key: "clients", label: "تقارير العملاء" },
    { key: "projects", label: "تقارير المشروعات" },
    { key: "partners", label: "تقارير الشركاء" },
  ];

  const totalContracts = projects.reduce((s, p) => s + Number(p.contractValue), 0);
  const totalExpenses = projects.reduce(
    (s, p) => s + (p.expenses?.reduce((x: number, e: any) => x + Number(e.amount), 0) ?? 0),
    0
  );

  const mostProfitableClients = [...clients]
    .map((c) => ({ name: c.name, value: c.projects.reduce((s: number, p: any) => s + Number(p.contractValue), 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const mostProfitableProjects = [...projects]
    .map((p) => {
      const exp = p.expenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0;
      return { name: p.name, profit: Number(p.contractValue) - exp };
    })
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  const partnerProfits = [...partners]
    .map((p) => ({
      name: p.name,
      contributions: p.contributions?.reduce((s: number, c: any) => s + Number(c.amount), 0) ?? 0,
    }))
    .sort((a, b) => b.contributions - a.contributions);

  return (
    <AppShell
      title="التقارير"
      action={
        <button onClick={() => window.print()} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 print:hidden">
          <Printer size={16} /> طباعة / حفظ PDF
        </button>
      }
    >
      <div className="flex gap-2 print:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-1.5 rounded-full ${tab === t.key ? "bg-primary text-white" : "bg-neutral-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card space-y-6" id="report-content">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <p className="font-bold text-lg">{company?.name ?? "Section General Contracting"}</p>
            <p className="text-xs text-neutral-500">{company?.address}</p>
            <p className="text-xs text-neutral-500">{company?.phone} — {company?.email}</p>
          </div>
          <p className="text-xs text-neutral-400">تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}</p>
        </div>

        {tab === "executive" && (
          <div className="space-y-6">
            <p className="text-xs text-neutral-400">نظرة شاملة عبر كل موديولات النظام — للإدارة العليا</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ExecTile label="مشاريع جارية" value={String(projects.filter((p) => p.status === "ONGOING").length)} />
              <ExecTile label="عقود موقّعة" value={String(contracts.length)} />
              <ExecTile label="مستخلصات معلّقة اعتماد" value={String(contracts.reduce((s, c) => s + c.certificates.filter((cert: any) => cert.status === "SUBMITTED").length, 0))} />
              <ExecTile label="أوامر شراء مفتوحة" value={String(purchaseOrders.filter((o) => ["DRAFT", "APPROVED"].includes(o.status)).length)} />
              <ExecTile label="قيمة أوامر الشراء المعتمدة" value={`${purchaseOrders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.items.reduce((x: number, i: any) => x + Number(i.quantity) * Number(i.unitPrice), 0), 0).toLocaleString("ar-EG")} ج.م`} />
              <ExecTile label="أصناف مخزون منخفضة" value={String(inventoryItems.filter((i) => i.totalBalance <= Number(i.reorderLevel)).length)} />
              <ExecTile label="معدات متاحة" value={`${equipment.filter((e) => e.status === "AVAILABLE").length} / ${equipment.length}`} />
              <ExecTile label="معدات بالصيانة" value={String(equipment.filter((e) => e.status === "MAINTENANCE").length)} />
              <ExecTile label="موظفون نشطون" value={String(employees.filter((e) => e.isActive).length)} />
              <ExecTile label="إجمالي رواتب الشهر الحالي" value={`${payroll.reduce((s, r) => s + Number(r.netSalary), 0).toLocaleString("ar-EG")} ج.م`} />
              <ExecTile label="عدد الموردين النشطين" value={String(suppliers.filter((s) => s.isActive).length)} />
              <ExecTile label="عدد الشركاء" value={String(partners.length)} />
            </div>
          </div>
        )}

        {tab === "management" && (
          <div className="space-y-6">
            <ReportBlock title="إجمالي قيمة العقود" value={`${totalContracts.toLocaleString("ar-EG")} ج.م`} />
            <ReportBlock title="إجمالي المصروفات" value={`${totalExpenses.toLocaleString("ar-EG")} ج.م`} />
            <ReportBlock title="إجمالي الأرباح" value={`${(totalContracts - totalExpenses).toLocaleString("ar-EG")} ج.م`} />
            <ReportTable title="أكثر العملاء ربحية" rows={mostProfitableClients.map((c) => [c.name, `${c.value.toLocaleString("ar-EG")} ج.م`])} headers={["العميل", "قيمة العقود"]} />
            <ReportTable title="أكثر المشروعات ربحية" rows={mostProfitableProjects.map((p) => [p.name, `${p.profit.toLocaleString("ar-EG")} ج.م`])} headers={["المشروع", "صافي الربح"]} />
            <ReportTable title="أكثر الشركاء تحقيقًا للأرباح" rows={partnerProfits.map((p) => [p.name, `${p.contributions.toLocaleString("ar-EG")} ج.م`])} headers={["الشريك", "إجمالي المساهمات"]} />
          </div>
        )}

        {tab === "clients" && (
          <ReportTable
            title="تقرير العملاء"
            headers={["العميل", "عدد المشاريع", "إجمالي قيمة العقود"]}
            rows={clients.map((c) => [c.name, String(c.projects.length), `${c.projects.reduce((s: number, p: any) => s + Number(p.contractValue), 0).toLocaleString("ar-EG")} ج.م`])}
          />
        )}

        {tab === "projects" && (
          <ReportTable
            title="تقرير المشروعات — الربح والخسارة"
            headers={["المشروع", "العميل", "قيمة العقد", "المصروفات", "صافي الربح"]}
            rows={projects.map((p) => {
              const exp = p.expenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0;
              return [p.name, p.client?.name ?? "—", `${Number(p.contractValue).toLocaleString("ar-EG")}`, `${exp.toLocaleString("ar-EG")}`, `${(Number(p.contractValue) - exp).toLocaleString("ar-EG")}`];
            })}
          />
        )}

        {tab === "partners" && (
          <ReportTable
            title="تقرير الشركاء"
            headers={["الشريك", "النسبة الافتراضية", "إجمالي المساهمات"]}
            rows={partners.map((p) => [p.name, `${Number(p.defaultShare)}%`, `${(p.contributions?.reduce((s: number, c: any) => s + Number(c.amount), 0) ?? 0).toLocaleString("ar-EG")} ج.م`])}
          />
        )}
      </div>
    </AppShell>
  );
}

function ExecTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-xl p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-bold text-lg mt-1">{value}</p>
    </div>
  );
}

function ReportBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-neutral-600">{title}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function ReportTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div>
      <p className="font-semibold mb-2">{title}</p>
      <table className="w-full text-sm border">
        <thead className="bg-neutral-50">
          <tr>{headers.map((h) => <th key={h} className="p-2 text-right border-b">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td className="p-3 text-neutral-400" colSpan={headers.length}>لا يوجد بيانات.</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              {r.map((c, j) => <td key={j} className="p-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
