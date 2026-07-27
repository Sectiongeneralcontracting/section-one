// قائمة مركزية بكل موديولات النظام — تُستخدم في القائمة الجانبية وصفحة إدارة الصلاحيات
// أي موديول جديد يُضاف للنظام لازم يتضاف هنا كمان عشان يدخل تحت نظام الصلاحيات

export type ModuleDef = { key: string; label: string; labelEn: string; href: string };

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "الرئيسية", labelEn: "Dashboard", href: "/dashboard" },
  { key: "projects", label: "المشاريع", labelEn: "Projects", href: "/projects" },
  { key: "contracts", label: "العقود", labelEn: "Contracts", href: "/contracts" },
  { key: "clients", label: "العملاء", labelEn: "Clients", href: "/clients" },
  { key: "partners", label: "الشركاء", labelEn: "Partners", href: "/partners" },
  { key: "suppliers", label: "الموردون", labelEn: "Suppliers", href: "/suppliers" },
  { key: "purchase-orders", label: "أوامر الشراء", labelEn: "Purchase Orders", href: "/purchase-orders" },
  { key: "inventory", label: "المخازن", labelEn: "Inventory", href: "/inventory" },
  { key: "equipment", label: "المعدات", labelEn: "Equipment", href: "/equipment" },
  { key: "contractors", label: "مقاولو الباطن", labelEn: "Contractors", href: "/contractors" },
  { key: "site-reports", label: "إدارة الموقع", labelEn: "Site Management", href: "/site-reports" },
  { key: "site-requests", label: "طلبات الموقع (شراء/عمالة)", labelEn: "Site Requests (Purchase/Labor)", href: "/site-requests" },
  { key: "employees", label: "الموظفون", labelEn: "Employees", href: "/employees" },
  { key: "hr-extra", label: "شؤون الموظفين (عقود/سلف/جزاءات/إجازات)", labelEn: "HR (contracts/advances/penalties/leaves)", href: "/hr" },
  { key: "attendance", label: "الحضور والانصراف", labelEn: "Attendance", href: "/attendance" },
  { key: "head-office-expenses", label: "مصروفات المكتب الرئيسي", labelEn: "Head Office Expenses", href: "/hr/head-office-expenses" },
  { key: "payroll", label: "الرواتب", labelEn: "Payroll", href: "/payroll" },
  { key: "reports", label: "التقارير", labelEn: "Reports", href: "/reports" },
  { key: "users", label: "المستخدمون", labelEn: "Users", href: "/users" },
  { key: "settings", label: "الإعدادات", labelEn: "Settings", href: "/settings" },
];

export const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  ADMIN: { ar: "مدير النظام", en: "Admin" },
  MANAGER: { ar: "مدير", en: "Manager" },
  VIEWER: { ar: "مشاهد", en: "Viewer" },
  SITE_ENGINEER: { ar: "مهندس موقع", en: "Site Engineer" },
  ACCOUNTANT: { ar: "محاسب", en: "Accountant" },
  FINANCE_MANAGER: { ar: "مدير مالي", en: "Finance Manager" },
  HR_MANAGER: { ar: "مدير الموارد البشرية", en: "HR Manager" },
};

export const ALL_ROLES = Object.keys(ROLE_LABELS);

// صلاحيات افتراضية منطقية لكل دور جديد — بتتحط أول مرة بس، وبعدين الأدمن يقدر يعدّلها من الإعدادات
export const DEFAULT_PERMISSIONS: Record<string, { view: string[]; edit: string[] }> = {
  SITE_ENGINEER: {
    view: ["dashboard", "projects", "contracts", "equipment", "inventory", "contractors", "attendance", "site-reports", "site-requests"],
    edit: ["projects", "attendance", "site-reports", "site-requests"],
  },
  ACCOUNTANT: {
    view: ["dashboard", "projects", "clients", "suppliers", "purchase-orders", "payroll", "reports", "head-office-expenses"],
    edit: ["purchase-orders", "payroll", "head-office-expenses"],
  },
  FINANCE_MANAGER: {
    view: ["dashboard", "projects", "clients", "partners", "contracts", "reports", "payroll", "head-office-expenses", "site-requests"],
    edit: ["partners", "reports", "head-office-expenses", "site-requests"],
  },
  HR_MANAGER: {
    view: ["dashboard", "employees", "hr-extra", "attendance", "payroll"],
    edit: ["employees", "hr-extra", "attendance", "payroll"],
  },
  MANAGER: {
    view: MODULES.map((m) => m.key).filter((k) => k !== "settings"),
    edit: MODULES.map((m) => m.key).filter((k) => k !== "settings" && k !== "users"),
  },
  VIEWER: {
    view: MODULES.map((m) => m.key).filter((k) => k !== "settings" && k !== "users"),
    edit: [],
  },
};
