"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Printer } from "lucide-react";

type Tab = "clients" | "projects" | "partners" | "management" | "executive";

const dict = {
  ar: {
    print: "طباعة / حفظ PDF", reportDate: "تاريخ التقرير",
    tabExecutive: "تقارير تنفيذية", tabManagement: "تقارير الإدارة", tabClients: "تقارير العملاء",
    tabProjects: "تقارير المشروعات", tabPartners: "تقارير الشركاء",
    executiveDesc: "نظرة شاملة عبر كل موديولات النظام — للإدارة العليا",
    ongoingProjects: "مشاريع جارية", signedContracts: "عقود موقّعة", pendingCerts: "مستخلصات معلّقة اعتماد",
    openPOs: "أوامر شراء مفتوحة", approvedPOsValue: "قيمة أوامر الشراء المعتمدة", lowStock: "أصناف مخزون منخفضة",
    availableEquipment: "معدات متاحة", equipmentInMaintenance: "معدات بالصيانة", activeEmployees: "موظفون نشطون",
    currentMonthPayroll: "إجمالي رواتب الشهر الحالي", activeSuppliers: "عدد الموردين النشطين", partnersCount: "عدد الشركاء",
    totalContracts: "إجمالي قيمة العقود", totalExpenses: "إجمالي المصروفات", totalProfit: "إجمالي الأرباح",
    topClients: "أكثر العملاء ربحية", topProjects: "أكثر المشروعات ربحية", topPartners: "أكثر الشركاء تحقيقًا للأرباح",
    client: "العميل", contractsValue: "قيمة العقود", project: "المشروع", netProfit: "صافي الربح",
    partner: "الشريك", totalContributions: "إجمالي المساهمات",
    clientsReportTitle: "تقرير العملاء", projectsCount: "عدد المشاريع",
    projectsReportTitle: "تقرير المشروعات — الربح والخسارة", value: "قيمة العقد", expenses: "المصروفات",
    choosePartner: "اختر شريك لعرض تفاصيل أرباحه لكل مشروع", allPartners: "كل الشركاء (ملخص عام)",
    partnersReportTitle: "تقرير الشركاء — ملخص عام", defaultShare: "النسبة الافتراضية",
    loading: "جارٍ التحميل...", partnerTotalProfit: "إجمالي أرباح الشريك",
    partnerTotalContribution: "إجمالي مساهماته (مصروفاته) في المشاريع", partnerProjectsCount: "عدد المشاريع المشارك فيها",
    partnerDetails: "تفاصيل الشريك:", thContribution: "مصروف الشريك في المشروع", thShare: "نسبة الشريك",
    thProfit: "قيمة ربحه", noPartnerProjects: "الشريك ده مش مشارك في أي مشروع لسه.", total: "الإجمالي",
    noData: "لا يوجد بيانات.",
  },
  en: {
    print: "Print / Save PDF", reportDate: "Report Date",
    tabExecutive: "Executive Reports", tabManagement: "Management Reports", tabClients: "Client Reports",
    tabProjects: "Project Reports", tabPartners: "Partner Reports",
    executiveDesc: "A comprehensive overview across all system modules — for senior management",
    ongoingProjects: "Ongoing Projects", signedContracts: "Signed Contracts", pendingCerts: "Certificates Pending Approval",
    openPOs: "Open Purchase Orders", approvedPOsValue: "Approved PO Value", lowStock: "Low Stock Items",
    availableEquipment: "Available Equipment", equipmentInMaintenance: "Equipment in Maintenance", activeEmployees: "Active Employees",
    currentMonthPayroll: "Current Month Payroll Total", activeSuppliers: "Active Suppliers", partnersCount: "Partners Count",
    totalContracts: "Total Contract Value", totalExpenses: "Total Expenses", totalProfit: "Total Profit",
    topClients: "Most Profitable Clients", topProjects: "Most Profitable Projects", topPartners: "Top Earning Partners",
    client: "Client", contractsValue: "Contract Value", project: "Project", netProfit: "Net Profit",
    partner: "Partner", totalContributions: "Total Contributions",
    clientsReportTitle: "Clients Report", projectsCount: "Projects Count",
    projectsReportTitle: "Projects Report — Profit & Loss", value: "Contract Value", expenses: "Expenses",
    choosePartner: "Choose a partner to see their profit details per project", allPartners: "All Partners (summary)",
    partnersReportTitle: "Partners Report — Summary", defaultShare: "Default Share",
    loading: "Loading...", partnerTotalProfit: "Partner's Total Profit",
    partnerTotalContribution: "Total Contributions (Expenses) in Projects", partnerProjectsCount: "Projects Involved",
    partnerDetails: "Partner Details:", thContribution: "Partner's Project Contribution", thShare: "Share",
    thProfit: "Profit Amount", noPartnerProjects: "This partner isn't involved in any project yet.", total: "Total",
    noData: "No data.",
  },
};

export default function ReportsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  const currency = locale === "ar" ? "ج.م" : "EGP";
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

  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [partnerReport, setPartnerReport] = useState<any>(null);
  const [loadingPartnerReport, setLoadingPartnerReport] = useState(false);

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

  useEffect(() => {
    if (!selectedPartnerId) {
      setPartnerReport(null);
      return;
    }
    setLoadingPartnerReport(true);
    fetch(`/api/partners/${selectedPartnerId}/report`)
      .then((r) => r.json())
      .then(setPartnerReport)
      .finally(() => setLoadingPartnerReport(false));
  }, [selectedPartnerId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "executive", label: t.tabExecutive },
    { key: "management", label: t.tabManagement },
    { key: "clients", label: t.tabClients },
    { key: "projects", label: t.tabProjects },
    { key: "partners", label: t.tabPartners },
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
      title=""
      hideTitle
      hideBell
      action={
        <button onClick={() => window.print()} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 print:hidden">
          <Printer size={16} /> {t.print}
        </button>
      }
    >
      <div className="flex gap-2 print:hidden flex-wrap">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`text-sm px-3 py-1.5 rounded-full ${tab === tb.key ? "bg-primary text-white" : "bg-neutral-100"}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="card space-y-6" id="report-content">
        <div className="flex items-center justify-between border-b pb-4">
          <p className="text-xs text-neutral-400">{t.reportDate}: {new Date().toLocaleDateString(localeCode)}</p>
          <img src="/logo-report.png" alt="Section" className="h-14 w-auto object-contain" />
        </div>

        {tab === "executive" && (
          <div className="space-y-6">
            <p className="text-xs text-neutral-400">{t.executiveDesc}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ExecTile label={t.ongoingProjects} value={String(projects.filter((p) => p.status === "ONGOING").length)} />
              <ExecTile label={t.signedContracts} value={String(contracts.length)} />
              <ExecTile label={t.pendingCerts} value={String(contracts.reduce((s, c) => s + c.certificates.filter((cert: any) => cert.status === "SUBMITTED").length, 0))} />
              <ExecTile label={t.openPOs} value={String(purchaseOrders.filter((o) => ["DRAFT", "APPROVED"].includes(o.status)).length)} />
              <ExecTile label={t.approvedPOsValue} value={`${purchaseOrders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.items.reduce((x: number, i: any) => x + Number(i.quantity) * Number(i.unitPrice), 0), 0).toLocaleString(localeCode)} ${currency}`} />
              <ExecTile label={t.lowStock} value={String(inventoryItems.filter((i) => i.totalBalance <= Number(i.reorderLevel)).length)} />
              <ExecTile label={t.availableEquipment} value={`${equipment.filter((e) => e.status === "AVAILABLE").length} / ${equipment.length}`} />
              <ExecTile label={t.equipmentInMaintenance} value={String(equipment.filter((e) => e.status === "MAINTENANCE").length)} />
              <ExecTile label={t.activeEmployees} value={String(employees.filter((e) => e.isActive).length)} />
              <ExecTile label={t.currentMonthPayroll} value={`${payroll.reduce((s, r) => s + Number(r.netSalary), 0).toLocaleString(localeCode)} ${currency}`} />
              <ExecTile label={t.activeSuppliers} value={String(suppliers.filter((s) => s.isActive).length)} />
              <ExecTile label={t.partnersCount} value={String(partners.length)} />
            </div>
          </div>
        )}

        {tab === "management" && (
          <div className="space-y-6">
            <ReportBlock title={t.totalContracts} value={`${totalContracts.toLocaleString(localeCode)} ${currency}`} />
            <ReportBlock title={t.totalExpenses} value={`${totalExpenses.toLocaleString(localeCode)} ${currency}`} />
            <ReportBlock title={t.totalProfit} value={`${(totalContracts - totalExpenses).toLocaleString(localeCode)} ${currency}`} />
            <ReportTable title={t.topClients} rows={mostProfitableClients.map((c) => [c.name, `${c.value.toLocaleString(localeCode)} ${currency}`])} headers={[t.client, t.contractsValue]} noData={t.noData} />
            <ReportTable title={t.topProjects} rows={mostProfitableProjects.map((p) => [p.name, `${p.profit.toLocaleString(localeCode)} ${currency}`])} headers={[t.project, t.netProfit]} noData={t.noData} />
            <ReportTable title={t.topPartners} rows={partnerProfits.map((p) => [p.name, `${p.contributions.toLocaleString(localeCode)} ${currency}`])} headers={[t.partner, t.totalContributions]} noData={t.noData} />
          </div>
        )}

        {tab === "clients" && (
          <ReportTable
            title={t.clientsReportTitle}
            headers={[t.client, t.projectsCount, t.contractsValue]}
            rows={clients.map((c) => [c.name, String(c.projects.length), `${c.projects.reduce((s: number, p: any) => s + Number(p.contractValue), 0).toLocaleString(localeCode)} ${currency}`])}
            noData={t.noData}
          />
        )}

        {tab === "projects" && (
          <ReportTable
            title={t.projectsReportTitle}
            headers={[t.project, t.client, t.value, t.expenses, t.netProfit]}
            rows={projects.map((p) => {
              const exp = p.expenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0;
              return [p.name, p.client?.name ?? "—", `${Number(p.contractValue).toLocaleString(localeCode)}`, `${exp.toLocaleString(localeCode)}`, `${(Number(p.contractValue) - exp).toLocaleString(localeCode)}`];
            })}
            noData={t.noData}
          />
        )}

        {tab === "partners" && (
          <div className="space-y-4">
            <div className="print:hidden">
              <label className="text-sm text-neutral-600 block mb-1">{t.choosePartner}</label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm w-full sm:w-72"
              >
                <option value="">{t.allPartners}</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {!selectedPartnerId && (
              <ReportTable
                title={t.partnersReportTitle}
                headers={[t.partner, t.defaultShare, t.totalContributions]}
                rows={partners.map((p) => [p.name, `${Number(p.defaultShare)}%`, `${(p.contributions?.reduce((s: number, c: any) => s + Number(c.amount), 0) ?? 0).toLocaleString(localeCode)} ${currency}`])}
                noData={t.noData}
              />
            )}

            {selectedPartnerId && loadingPartnerReport && (
              <p className="text-sm text-neutral-400">{t.loading}</p>
            )}

            {selectedPartnerId && !loadingPartnerReport && partnerReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ReportBlock title={t.partnerTotalProfit} value={`${partnerReport.totals.totalProfit.toLocaleString(localeCode)} ${currency}`} />
                  <ReportBlock title={t.partnerTotalContribution} value={`${partnerReport.totals.totalContribution.toLocaleString(localeCode)} ${currency}`} />
                  <ReportBlock title={t.partnerProjectsCount} value={String(partnerReport.totals.projectsCount)} />
                </div>
                <div>
                  <p className="font-semibold mb-2">{t.partnerDetails} {partnerReport.partner.name}</p>
                  <table className="w-full text-sm border">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="p-2 text-right border-b">{t.thContribution}</th>
                        <th className="p-2 text-right border-b">{t.project}</th>
                        <th className="p-2 text-right border-b">{t.client}</th>
                        <th className="p-2 text-right border-b">{t.netProfit}</th>
                        <th className="p-2 text-right border-b">{t.thShare}</th>
                        <th className="p-2 text-right border-b">{t.thProfit}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerReport.rows.length === 0 && (
                        <tr><td className="p-3 text-neutral-400" colSpan={6}>{t.noPartnerProjects}</td></tr>
                      )}
                      {partnerReport.rows.map((r: any) => (
                        <tr key={r.projectId} className="border-b">
                          <td className="p-2">{r.contributionAmount.toLocaleString(localeCode)} {currency}</td>
                          <td className="p-2">{r.projectName}</td>
                          <td className="p-2">{r.clientName}</td>
                          <td className="p-2">{r.netProfit.toLocaleString(localeCode)} {currency}</td>
                          <td className="p-2">{r.sharePct}%</td>
                          <td className="p-2 font-semibold text-success">{r.partnerProfit.toLocaleString(localeCode)} {currency}</td>
                        </tr>
                      ))}
                    </tbody>
                    {partnerReport.rows.length > 0 && (
                      <tfoot>
                        <tr className="bg-neutral-50 font-semibold">
                          <td className="p-2">{partnerReport.totals.totalContribution.toLocaleString(localeCode)} {currency}</td>
                          <td className="p-2" colSpan={3}>{t.total}</td>
                          <td className="p-2"></td>
                          <td className="p-2 text-success">{partnerReport.totals.totalProfit.toLocaleString(localeCode)} {currency}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
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

function ReportTable({ title, headers, rows, noData }: { title: string; headers: string[]; rows: string[][]; noData: string }) {
  return (
    <div>
      <p className="font-semibold mb-2">{title}</p>
      <table className="w-full text-sm border">
        <thead className="bg-neutral-50">
          <tr>{headers.map((h) => <th key={h} className="p-2 text-right border-b">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td className="p-3 text-neutral-400" colSpan={headers.length}>{noData}</td></tr>}
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
