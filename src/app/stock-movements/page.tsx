"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";

const dict = {
  ar: {
    title: "سجل حركات المخزون",
    filterItem: "فلترة بالصنف", allItems: "كل الأصناف",
    filterWarehouse: "فلترة بالمخزن", allWarehouses: "كل المخازن",
    thDate: "التاريخ", thType: "النوع", thItem: "الصنف", thWarehouse: "المخزن",
    thQuantity: "الكمية", thProject: "المشروع", thNotes: "ملاحظات",
    inLabel: "وارد", outLabel: "منصرف",
    loading: "جارٍ التحميل...", empty: "لا يوجد حركات مسجلة بعد.",
    truncatedWarning: "بيتم عرض أحدث 200 حركة بس. فيه حركات أقدم مش ظاهرة — استخدم الفلترة بالصنف أو المخزن عشان تشوفها.",
    confirmDelete: "تأكيد حذف الحركة؟ ده هيغيّر رصيد الصنف فورًا. العملية لا يمكن التراجع عنها.",
    errDelete: "تعذر حذف الحركة",
  },
  en: {
    title: "Stock Movements Log",
    filterItem: "Filter by item", allItems: "All Items",
    filterWarehouse: "Filter by warehouse", allWarehouses: "All Warehouses",
    thDate: "Date", thType: "Type", thItem: "Item", thWarehouse: "Warehouse",
    thQuantity: "Quantity", thProject: "Project", thNotes: "Notes",
    inLabel: "In", outLabel: "Out",
    loading: "Loading...", empty: "No movements recorded yet.",
    truncatedWarning: "Showing the latest 200 movements only. Older movements exist but aren't shown — use item/warehouse filters to find them.",
    confirmDelete: "Confirm deleting this movement? This will immediately change the item's balance. This cannot be undone.",
    errDelete: "Failed to delete movement",
  },
};

export default function StockMovementsPage() {
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";

  const [movements, setMovements] = useState<any[]>([]);
  const [truncatedInfo, setTruncatedInfo] = useState<{ truncated: boolean; totalCount: number } | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterItem, setFilterItem] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterItem) params.set("itemId", filterItem);
    if (filterWarehouse) params.set("warehouseId", filterWarehouse);
    const [mRes, iRes, wRes] = await Promise.all([
      fetch(`/api/stock-movements?${params.toString()}`),
      fetch("/api/inventory-items"),
      fetch("/api/warehouses"),
    ]);
    if (mRes.ok) {
      const data = await mRes.json();
      setMovements(data.movements);
      setTruncatedInfo({ truncated: data.truncated, totalCount: data.totalCount });
    }
    if (iRes.ok) setItems(await iRes.json());
    if (wRes.ok) setWarehouses(await wRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterItem, filterWarehouse]);

  async function removeMovement(id: string) {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`/api/stock-movements/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errDelete);
    load();
  }

  return (
    <AppShell title={t.title}>
      <div className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterItem}</label>
          <select value={filterItem} onChange={(e) => setFilterItem(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            <option value="">{t.allItems}</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-neutral-600 block mb-1">{t.filterWarehouse}</label>
          <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className="w-full border rounded-xl px-3 py-2">
            <option value="">{t.allWarehouses}</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {truncatedInfo?.truncated && (
        <p className="text-sm text-warning bg-warning/10 border border-warning/20 rounded-xl px-4 py-2">{t.truncatedWarning}</p>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thDate}</th>
              <th className="p-3 font-medium">{t.thType}</th>
              <th className="p-3 font-medium">{t.thItem}</th>
              <th className="p-3 font-medium">{t.thWarehouse}</th>
              <th className="p-3 font-medium">{t.thQuantity}</th>
              <th className="p-3 font-medium">{t.thProject}</th>
              <th className="p-3 font-medium">{t.thNotes}</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={8}>{t.loading}</td></tr>}
            {!loading && movements.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={8}>{t.empty}</td></tr>}
            {movements.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">{new Date(m.date).toLocaleDateString(localeCode)}</td>
                <td className="p-3">
                  {m.type === "IN" ? (
                    <span className="bg-success/10 text-success text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit">
                      <ArrowDownCircle size={12} /> {t.inLabel}
                    </span>
                  ) : (
                    <span className="bg-danger/10 text-danger text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit">
                      <ArrowUpCircle size={12} /> {t.outLabel}
                    </span>
                  )}
                </td>
                <td className="p-3 font-medium">{m.item?.name ?? "—"}</td>
                <td className="p-3">{m.warehouse?.name ?? "—"}</td>
                <td className="p-3">{Number(m.quantity).toLocaleString(localeCode)} {m.item?.unit}</td>
                <td className="p-3">{m.project?.name ?? "—"}</td>
                <td className="p-3 text-neutral-500">{m.notes || "—"}</td>
                <td className="p-3"><button onClick={() => removeMovement(m.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
