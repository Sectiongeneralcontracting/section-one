"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const dict = {
  ar: {
    title: "المخازن", addWarehouse: "+ مخزن", addItem: "+ صنف", newMovement: "حركة مخزون",
    warehouseName: "اسم المخزن", location: "الموقع", saveWarehouse: "حفظ المخزن",
    itemName: "اسم الصنف", unit: "الوحدة", reorderLevel: "حد إعادة الطلب", saveItem: "حفظ الصنف",
    movementType: "نوع الحركة", in: "وارد (توريد)", out: "منصرف (لمشروع)",
    warehouse: "المخزن *", chooseWarehouse: "اختر المخزن", item: "الصنف *", chooseItem: "اختر الصنف",
    quantity: "الكمية *", receivingProject: "المشروع المستلم", none: "بدون تحديد", notes: "ملاحظات",
    save: "حفظ الحركة", saving: "جارٍ الحفظ...",
    errItem: "تعذر إضافة الصنف", errWarehouse: "تعذر إضافة المخزن", errMovement: "تعذر تسجيل الحركة",
    thItem: "الصنف", thUnit: "الوحدة", thBalance: "الرصيد الحالي", thReorder: "حد إعادة الطلب", thStatus: "الحالة",
    loading: "جارٍ التحميل...", empty: "لا يوجد أصناف بعد.", low: "منخفض", available: "متوفر",
  },
  en: {
    title: "Inventory", addWarehouse: "+ Warehouse", addItem: "+ Item", newMovement: "Stock Movement",
    warehouseName: "Warehouse Name", location: "Location", saveWarehouse: "Save Warehouse",
    itemName: "Item Name", unit: "Unit", reorderLevel: "Reorder Level", saveItem: "Save Item",
    movementType: "Movement Type", in: "In (supply)", out: "Out (to project)",
    warehouse: "Warehouse *", chooseWarehouse: "Choose warehouse", item: "Item *", chooseItem: "Choose item",
    quantity: "Quantity *", receivingProject: "Receiving Project", none: "None", notes: "Notes",
    save: "Save Movement", saving: "Saving...",
    errItem: "Failed to add item", errWarehouse: "Failed to add warehouse", errMovement: "Failed to record movement",
    thItem: "Item", thUnit: "Unit", thBalance: "Current Balance", thReorder: "Reorder Level", thStatus: "Status",
    loading: "Loading...", empty: "No items yet.", low: "Low", available: "Available",
  },
};

export default function InventoryPage() {
  const locale = useLocale();
  const t = dict[locale];
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showItemForm, setShowItemForm] = useState(false);
  const [showWhForm, setShowWhForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [itemForm, setItemForm] = useState({ name: "", unit: "", reorderLevel: 0 });
  const [whForm, setWhForm] = useState({ name: "", location: "" });
  const [moveForm, setMoveForm] = useState({ warehouseId: "", itemId: "", type: "IN", quantity: 0, projectId: "", notes: "" });

  async function load() {
    setLoading(true);
    const [iRes, wRes, pRes] = await Promise.all([
      fetch("/api/inventory-items"),
      fetch("/api/warehouses"),
      fetch("/api/projects"),
    ]);
    if (iRes.ok) setItems(await iRes.json());
    if (wRes.ok) setWarehouses(await wRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/inventory-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemForm),
    });
    setSaving(false);
    if (!res.ok) return setError(t.errItem);
    setItemForm({ name: "", unit: "", reorderLevel: 0 });
    setShowItemForm(false);
    load();
  }

  async function addWarehouse(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(whForm),
    });
    setSaving(false);
    if (!res.ok) return setError(t.errWarehouse);
    setWhForm({ name: "", location: "" });
    setShowWhForm(false);
    load();
  }

  async function addMovement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...moveForm, projectId: moveForm.projectId || undefined }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? t.errMovement);
    setMoveForm({ warehouseId: "", itemId: "", type: "IN", quantity: 0, projectId: "", notes: "" });
    setShowMoveForm(false);
    load();
  }

  const localeCode = locale === "ar" ? "ar-EG" : "en-US";

  return (
    <AppShell
      title={t.title}
      action={
        <div className="flex gap-2">
          <button onClick={() => setShowWhForm((v) => !v)} className="border text-sm px-3 py-2 rounded-xl">{t.addWarehouse}</button>
          <button onClick={() => setShowItemForm((v) => !v)} className="border text-sm px-3 py-2 rounded-xl">{t.addItem}</button>
          <button onClick={() => setShowMoveForm((v) => !v)} className="bg-primary text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
            {showMoveForm ? <X size={16} /> : <Plus size={16} />} {t.newMovement}
          </button>
        </div>
      }
    >
      {showWhForm && (
        <form onSubmit={addWarehouse} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required placeholder={t.warehouseName} value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.location} value={whForm.location} onChange={(e) => setWhForm({ ...whForm, location: e.target.value })} className="border rounded-xl px-3 py-2" />
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium">{t.saveWarehouse}</button>
        </form>
      )}

      {showItemForm && (
        <form onSubmit={addItem} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required placeholder={t.itemName} value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required placeholder={t.unit} value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input type="number" step="0.001" placeholder={t.reorderLevel} value={itemForm.reorderLevel} onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          <button disabled={saving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-3">{t.saveItem}</button>
        </form>
      )}

      {showMoveForm && (
        <form onSubmit={addMovement} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.movementType}</label>
            <select value={moveForm.type} onChange={(e) => setMoveForm({ ...moveForm, type: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="IN">{t.in}</option>
              <option value="OUT">{t.out}</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.warehouse}</label>
            <select required value={moveForm.warehouseId} onChange={(e) => setMoveForm({ ...moveForm, warehouseId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseWarehouse}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.item}</label>
            <select required value={moveForm.itemId} onChange={(e) => setMoveForm({ ...moveForm, itemId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              <option value="">{t.chooseItem}</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.quantity}</label>
            <input required type="number" step="0.001" value={moveForm.quantity} onChange={(e) => setMoveForm({ ...moveForm, quantity: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {moveForm.type === "OUT" && (
            <div>
              <label className="text-sm text-neutral-600 block mb-1">{t.receivingProject}</label>
              <select value={moveForm.projectId} onChange={(e) => setMoveForm({ ...moveForm, projectId: e.target.value })} className="w-full border rounded-xl px-3 py-2">
                <option value="">{t.none}</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm text-neutral-600 block mb-1">{t.notes}</label>
            <input value={moveForm.notes} onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          {error && <p className="text-danger text-sm lg:col-span-3">{error}</p>}
          <div className="lg:col-span-3">
            <button disabled={saving} className="bg-primary text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr className="text-right">
              <th className="p-3 font-medium">{t.thItem}</th>
              <th className="p-3 font-medium">{t.thUnit}</th>
              <th className="p-3 font-medium">{t.thBalance}</th>
              <th className="p-3 font-medium">{t.thReorder}</th>
              <th className="p-3 font-medium">{t.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.loading}</td></tr>}
            {!loading && items.length === 0 && <tr><td className="p-4 text-neutral-400" colSpan={5}>{t.empty}</td></tr>}
            {items.map((i) => {
              const low = i.totalBalance <= Number(i.reorderLevel);
              return (
                <tr key={i.id} className="border-t">
                  <td className="p-3 font-medium">{i.name}</td>
                  <td className="p-3">{i.unit}</td>
                  <td className="p-3">{i.totalBalance.toLocaleString(localeCode)}</td>
                  <td className="p-3">{Number(i.reorderLevel).toLocaleString(localeCode)}</td>
                  <td className="p-3">
                    {low ? (
                      <span className="bg-danger/10 text-danger text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit">
                        <ArrowDownCircle size={12} /> {t.low}
                      </span>
                    ) : (
                      <span className="bg-success/10 text-success text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit">
                        <ArrowUpCircle size={12} /> {t.available}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
