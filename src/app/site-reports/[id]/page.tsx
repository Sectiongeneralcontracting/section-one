"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "@/lib/use-locale";
import { Plus, X, Trash2, Pencil, Users, HardHat, Package, Camera } from "lucide-react";

const dict = {
  ar: {
    loading: "جارٍ التحميل...", project: "المشروع", date: "التاريخ",
    weatherNotes: "ملاحظات الطقس", generalNotes: "ملاحظات عامة", saveNotes: "حفظ الملاحظات",
    // عمال
    workersTitle: "حضور العمال", newWorker: "إضافة", trade: "الحرفة *", tradePh: "حداد، نجار، عامل عادي...",
    count: "العدد *", saveWorker: "حفظ", errWorker: "تعذر الحفظ", noWorkers: "لا يوجد سجلات حضور بعد.", totalWorkers: "إجمالي العمال",
    // معدات
    equipmentTitle: "المعدات بالموقع", newEquipment: "إضافة", equipment: "معدة مسجلة", chooseEquipment: "اختر معدة (اختياري)",
    orCustomName: "أو اكتب اسم معدة غير مسجلة", hoursUsed: "عدد الساعات", saveEquipment: "حفظ", errEquipment: "تعذر الحفظ", noEquipment: "لا يوجد معدات مسجلة بعد.",
    // مواد
    materialsTitle: "استهلاك المواد", newMaterial: "إضافة", item: "صنف من المخزون", chooseItem: "اختر صنف (اختياري)",
    orCustomMaterial: "أو اكتب اسم مادة غير مسجلة", warehouse: "المخزن (لو الصنف مسجل)", chooseWarehouse: "اختر المخزن",
    quantity: "الكمية *", unit: "الوحدة", saveMaterial: "حفظ", errMaterial: "تعذر الحفظ", noMaterials: "لا يوجد سجلات استهلاك بعد.",
    materialNote: "لو اخترت صنف من المخزون وحددت المخزن، الكمية هتتخصم فعليًا من رصيد المخزن.",
    // صور
    photosTitle: "صور الموقع", uploadPhoto: "رفع صورة", caption: "وصف الصورة (اختياري)", noPhotos: "لا يوجد صور مرفوعة بعد.",
    uploading: "جارٍ الرفع...", deletePhoto: "حذف", confirmDeletePhoto: "تأكيد حذف الصورة؟",
    notes: "ملاحظات", saving: "جارٍ الحفظ...",
    saveEdit: "حفظ", cancelEdit: "إلغاء", errEdit: "تعذر الحفظ",
    confirmDeleteRow: "تأكيد الحذف؟",
  },
  en: {
    loading: "Loading...", project: "Project", date: "Date",
    weatherNotes: "Weather Notes", generalNotes: "General Notes", saveNotes: "Save Notes",
    workersTitle: "Worker Attendance", newWorker: "Add", trade: "Trade *", tradePh: "Steel fixer, carpenter, laborer...",
    count: "Count *", saveWorker: "Save", errWorker: "Failed to save", noWorkers: "No attendance records yet.", totalWorkers: "Total Workers",
    equipmentTitle: "Equipment at Site", newEquipment: "Add", equipment: "Registered Equipment", chooseEquipment: "Choose equipment (optional)",
    orCustomName: "or type unregistered equipment name", hoursUsed: "Hours Used", saveEquipment: "Save", errEquipment: "Failed to save", noEquipment: "No equipment recorded yet.",
    materialsTitle: "Material Consumption", newMaterial: "Add", item: "Inventory Item", chooseItem: "Choose item (optional)",
    orCustomMaterial: "or type unregistered material name", warehouse: "Warehouse (if item is registered)", chooseWarehouse: "Choose warehouse",
    quantity: "Quantity *", unit: "Unit", saveMaterial: "Save", errMaterial: "Failed to save", noMaterials: "No consumption records yet.",
    materialNote: "If you pick a registered item and a warehouse, the quantity is actually deducted from that warehouse's stock.",
    photosTitle: "Site Photos", uploadPhoto: "Upload Photo", caption: "Caption (optional)", noPhotos: "No photos uploaded yet.",
    uploading: "Uploading...", deletePhoto: "Delete", confirmDeletePhoto: "Confirm deleting this photo?",
    notes: "Notes", saving: "Saving...",
    saveEdit: "Save", cancelEdit: "Cancel", errEdit: "Failed to save",
    confirmDeleteRow: "Confirm deletion?",
  },
};

function resizeImage(file: File, maxWidth = 1280, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SiteReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = dict[locale];
  const localeCode = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";

  const [report, setReport] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [notesForm, setNotesForm] = useState({ weatherNotes: "", generalNotes: "" });
  const [notesSaving, setNotesSaving] = useState(false);

  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [workerForm, setWorkerForm] = useState({ trade: "", count: 1, notes: "" });
  const [workerSaving, setWorkerSaving] = useState(false);
  const [workerError, setWorkerError] = useState("");

  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState({ equipmentId: "", customName: "", hoursUsed: "", notes: "" });
  const [equipmentSaving, setEquipmentSaving] = useState(false);
  const [equipmentError, setEquipmentError] = useState("");

  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({ itemId: "", warehouseId: "", customName: "", quantity: 0, unit: "", notes: "" });
  const [materialSaving, setMaterialSaving] = useState(false);
  const [materialError, setMaterialError] = useState("");

  const [uploading, setUploading] = useState(false);

  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [editWorkerForm, setEditWorkerForm] = useState({ trade: "", count: 1, notes: "" });
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [editEquipmentForm, setEditEquipmentForm] = useState({ customName: "", hoursUsed: "", notes: "" });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editMaterialForm, setEditMaterialForm] = useState({ customName: "", quantity: 0, notes: "" });
  const [photoCaption, setPhotoCaption] = useState("");

  async function load() {
    const res = await fetch(`/api/site-reports/${id}`);
    if (res.ok) {
      const data = await res.json();
      setReport(data);
      setNotesForm({ weatherNotes: data.weatherNotes ?? "", generalNotes: data.generalNotes ?? "" });
    }
    const [eRes, iRes, wRes] = await Promise.all([
      fetch("/api/equipment"),
      fetch("/api/inventory-items"),
      fetch("/api/warehouses"),
    ]);
    if (eRes.ok) setEquipmentList(await eRes.json());
    if (iRes.ok) setInventoryItems(await iRes.json());
    if (wRes.ok) setWarehouses(await wRes.json());
  }

  useEffect(() => { load(); }, [id]);

  async function saveNotes() {
    setNotesSaving(true);
    await fetch(`/api/site-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notesForm),
    });
    setNotesSaving(false);
    load();
  }

  async function addWorker(e: React.FormEvent) {
    e.preventDefault();
    setWorkerSaving(true);
    setWorkerError("");
    const res = await fetch(`/api/site-reports/${id}/workers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workerForm),
    });
    setWorkerSaving(false);
    if (!res.ok) return setWorkerError((await res.json()).error ?? t.errWorker);
    setWorkerForm({ trade: "", count: 1, notes: "" });
    setShowWorkerForm(false);
    load();
  }

  async function addEquipment(e: React.FormEvent) {
    e.preventDefault();
    setEquipmentSaving(true);
    setEquipmentError("");
    const res = await fetch(`/api/site-reports/${id}/equipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...equipmentForm,
        equipmentId: equipmentForm.equipmentId || undefined,
        hoursUsed: equipmentForm.hoursUsed ? Number(equipmentForm.hoursUsed) : undefined,
      }),
    });
    setEquipmentSaving(false);
    if (!res.ok) return setEquipmentError((await res.json()).error ?? t.errEquipment);
    setEquipmentForm({ equipmentId: "", customName: "", hoursUsed: "", notes: "" });
    setShowEquipmentForm(false);
    load();
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault();
    setMaterialSaving(true);
    setMaterialError("");
    const res = await fetch(`/api/site-reports/${id}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...materialForm,
        itemId: materialForm.itemId || undefined,
        warehouseId: materialForm.warehouseId || undefined,
      }),
    });
    setMaterialSaving(false);
    if (!res.ok) return setMaterialError((await res.json()).error ?? t.errMaterial);
    setMaterialForm({ itemId: "", warehouseId: "", customName: "", quantity: 0, unit: "", notes: "" });
    setShowMaterialForm(false);
    load();
  }

  // --- تعديل/حذف العمال ---
  function startEditWorker(w: any) {
    setEditingWorkerId(w.id);
    setEditWorkerForm({ trade: w.trade, count: w.count, notes: w.notes ?? "" });
  }
  async function saveEditedWorker(workerId: string) {
    const res = await fetch(`/api/site-workers/${workerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editWorkerForm),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errEdit);
    setEditingWorkerId(null);
    load();
  }
  async function removeWorker(workerId: string) {
    if (!confirm(t.confirmDeleteRow)) return;
    const res = await fetch(`/api/site-workers/${workerId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errEdit);
    load();
  }

  // --- تعديل/حذف المعدات ---
  function startEditEquipment(eq: any) {
    setEditingEquipmentId(eq.id);
    setEditEquipmentForm({ customName: eq.customName ?? "", hoursUsed: eq.hoursUsed ?? "", notes: eq.notes ?? "" });
  }
  async function saveEditedEquipment(logId: string) {
    const res = await fetch(`/api/site-equipment-logs/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editEquipmentForm, hoursUsed: editEquipmentForm.hoursUsed ? Number(editEquipmentForm.hoursUsed) : undefined }),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errEdit);
    setEditingEquipmentId(null);
    load();
  }
  async function removeEquipmentLog(logId: string) {
    if (!confirm(t.confirmDeleteRow)) return;
    const res = await fetch(`/api/site-equipment-logs/${logId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errEdit);
    load();
  }

  // --- تعديل/حذف المواد ---
  function startEditMaterial(m: any) {
    setEditingMaterialId(m.id);
    setEditMaterialForm({ customName: m.customName ?? "", quantity: Number(m.quantity), notes: m.notes ?? "" });
  }
  async function saveEditedMaterial(logId: string) {
    const res = await fetch(`/api/site-materials/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editMaterialForm),
    });
    if (!res.ok) return alert((await res.json()).error ?? t.errEdit);
    setEditingMaterialId(null);
    load();
  }
  async function removeMaterialLog(logId: string) {
    if (!confirm(t.confirmDeleteRow)) return;
    const res = await fetch(`/api/site-materials/${logId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error ?? t.errEdit);
    load();
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      await fetch(`/api/site-reports/${id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: dataUrl, caption: photoCaption }),
      });
      setPhotoCaption("");
      load();
    } catch {
      alert(t.errMaterial);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function deletePhoto(photoId: string) {
    if (!confirm(t.confirmDeletePhoto)) return;
    await fetch(`/api/site-photos/${photoId}`, { method: "DELETE" });
    load();
  }

  if (!report) return <AppShell title={t.loading}><></></AppShell>;

  return (
    <AppShell title={`${report.project.name} — ${new Date(report.date).toLocaleDateString(localeCode)}`}>
      {report.project.client?.logoUrl && (
        <div className="card flex items-center gap-3 !py-3">
          <img src={report.project.client.logoUrl} alt={report.project.client.name} className="h-12 w-12 object-contain rounded-lg bg-white border" />
          <div>
            <p className="text-sm font-semibold">{report.project.client.name}</p>
            <p className="text-xs text-neutral-400">{report.project.name}</p>
          </div>
        </div>
      )}
      <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-neutral-600 block mb-1">{t.weatherNotes}</label>
          <input value={notesForm.weatherNotes} onChange={(e) => setNotesForm({ ...notesForm, weatherNotes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-neutral-600 block mb-1">{t.generalNotes}</label>
          <input value={notesForm.generalNotes} onChange={(e) => setNotesForm({ ...notesForm, generalNotes: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div className="sm:col-span-2">
          <button onClick={saveNotes} disabled={notesSaving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60">
            {notesSaving ? t.saving : t.saveNotes}
          </button>
        </div>
      </div>

      {/* حضور العمال */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2"><Users size={18} /> {t.workersTitle}</h2>
        <button onClick={() => setShowWorkerForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showWorkerForm ? <X size={14} /> : <Plus size={14} />} {t.newWorker}
        </button>
      </div>
      {showWorkerForm && (
        <form onSubmit={addWorker} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required placeholder={t.tradePh} value={workerForm.trade} onChange={(e) => setWorkerForm({ ...workerForm, trade: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input required type="number" min={1} placeholder={t.count} value={workerForm.count} onChange={(e) => setWorkerForm({ ...workerForm, count: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.notes} value={workerForm.notes} onChange={(e) => setWorkerForm({ ...workerForm, notes: e.target.value })} className="border rounded-xl px-3 py-2" />
          {workerError && <p className="text-danger text-sm sm:col-span-3">{workerError}</p>}
          <button disabled={workerSaving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-3">{workerSaving ? t.saving : t.saveWorker}</button>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {report.workerAttendance.length === 0 && <tr><td className="p-4 text-neutral-400">{t.noWorkers}</td></tr>}
            {report.workerAttendance.map((w: any) =>
              editingWorkerId === w.id ? (
                <tr key={w.id} className="border-t bg-neutral-50">
                  <td className="p-2"><input value={editWorkerForm.trade} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, trade: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input type="number" min={1} value={editWorkerForm.count} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, count: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input value={editWorkerForm.notes} onChange={(e) => setEditWorkerForm({ ...editWorkerForm, notes: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEditedWorker(w.id)} className="text-success text-xs">{t.saveEdit}</button>
                    <button onClick={() => setEditingWorkerId(null)} className="text-neutral-500 text-xs">{t.cancelEdit}</button>
                  </td>
                </tr>
              ) : (
                <tr key={w.id} className="border-t">
                  <td className="p-3 font-medium">{w.trade}</td>
                  <td className="p-3">{w.count}</td>
                  <td className="p-3 text-neutral-500">{w.notes || "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEditWorker(w)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => removeWorker(w.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            )}
          </tbody>
          {report.workerAttendance.length > 0 && (
            <tfoot><tr className="border-t bg-neutral-50 font-semibold"><td className="p-3" colSpan={2}>{t.totalWorkers}: {report.workerAttendance.reduce((s: number, w: any) => s + w.count, 0)}</td><td colSpan={2} /></tr></tfoot>
          )}
        </table>
      </div>

      {/* المعدات بالموقع */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2"><HardHat size={18} /> {t.equipmentTitle}</h2>
        <button onClick={() => setShowEquipmentForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showEquipmentForm ? <X size={14} /> : <Plus size={14} />} {t.newEquipment}
        </button>
      </div>
      {showEquipmentForm && (
        <form onSubmit={addEquipment} className="card grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select value={equipmentForm.equipmentId} onChange={(e) => setEquipmentForm({ ...equipmentForm, equipmentId: e.target.value, customName: "" })} className="border rounded-xl px-3 py-2">
            <option value="">{t.chooseEquipment}</option>
            {equipmentList.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
          </select>
          <input placeholder={t.orCustomName} value={equipmentForm.customName} disabled={!!equipmentForm.equipmentId} onChange={(e) => setEquipmentForm({ ...equipmentForm, customName: e.target.value })} className="border rounded-xl px-3 py-2 disabled:bg-neutral-50" />
          <input type="number" step="0.5" placeholder={t.hoursUsed} value={equipmentForm.hoursUsed} onChange={(e) => setEquipmentForm({ ...equipmentForm, hoursUsed: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.notes} value={equipmentForm.notes} onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })} className="border rounded-xl px-3 py-2" />
          {equipmentError && <p className="text-danger text-sm sm:col-span-4">{equipmentError}</p>}
          <button disabled={equipmentSaving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-4">{equipmentSaving ? t.saving : t.saveEquipment}</button>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {report.equipmentLogs.length === 0 && <tr><td className="p-4 text-neutral-400">{t.noEquipment}</td></tr>}
            {report.equipmentLogs.map((eq: any) =>
              editingEquipmentId === eq.id ? (
                <tr key={eq.id} className="border-t bg-neutral-50">
                  <td className="p-2 text-neutral-400">{eq.equipment?.name ?? <input value={editEquipmentForm.customName} onChange={(e) => setEditEquipmentForm({ ...editEquipmentForm, customName: e.target.value })} className="w-full border rounded-lg px-2 py-1" />}</td>
                  <td className="p-2"><input type="number" step="0.5" value={editEquipmentForm.hoursUsed} onChange={(e) => setEditEquipmentForm({ ...editEquipmentForm, hoursUsed: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"><input value={editEquipmentForm.notes} onChange={(e) => setEditEquipmentForm({ ...editEquipmentForm, notes: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEditedEquipment(eq.id)} className="text-success text-xs">{t.saveEdit}</button>
                    <button onClick={() => setEditingEquipmentId(null)} className="text-neutral-500 text-xs">{t.cancelEdit}</button>
                  </td>
                </tr>
              ) : (
                <tr key={eq.id} className="border-t">
                  <td className="p-3 font-medium">{eq.equipment?.name ?? eq.customName}</td>
                  <td className="p-3">{eq.hoursUsed ? `${eq.hoursUsed} ${locale === "ar" ? "ساعة" : "hrs"}` : "—"}</td>
                  <td className="p-3 text-neutral-500">{eq.notes || "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEditEquipment(eq)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => removeEquipmentLog(eq.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* استهلاك المواد */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2"><Package size={18} /> {t.materialsTitle}</h2>
        <button onClick={() => setShowMaterialForm((v) => !v)} className="bg-primary text-white text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          {showMaterialForm ? <X size={14} /> : <Plus size={14} />} {t.newMaterial}
        </button>
      </div>
      {showMaterialForm && (
        <form onSubmit={addMaterial} className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select value={materialForm.itemId} onChange={(e) => setMaterialForm({ ...materialForm, itemId: e.target.value, customName: "" })} className="border rounded-xl px-3 py-2">
            <option value="">{t.chooseItem}</option>
            {inventoryItems.map((it: any) => <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>)}
          </select>
          <input placeholder={t.orCustomMaterial} value={materialForm.customName} disabled={!!materialForm.itemId} onChange={(e) => setMaterialForm({ ...materialForm, customName: e.target.value })} className="border rounded-xl px-3 py-2 disabled:bg-neutral-50" />
          <select value={materialForm.warehouseId} onChange={(e) => setMaterialForm({ ...materialForm, warehouseId: e.target.value })} className="border rounded-xl px-3 py-2">
            <option value="">{t.chooseWarehouse}</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input required type="number" step="0.001" placeholder={t.quantity} value={materialForm.quantity} onChange={(e) => setMaterialForm({ ...materialForm, quantity: Number(e.target.value) })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.unit} value={materialForm.unit} onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })} className="border rounded-xl px-3 py-2" />
          <input placeholder={t.notes} value={materialForm.notes} onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })} className="border rounded-xl px-3 py-2" />
          <p className="text-xs text-neutral-400 sm:col-span-3">{t.materialNote}</p>
          {materialError && <p className="text-danger text-sm sm:col-span-3">{materialError}</p>}
          <button disabled={materialSaving} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium sm:col-span-3">{materialSaving ? t.saving : t.saveMaterial}</button>
        </form>
      )}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {report.materialLogs.length === 0 && <tr><td className="p-4 text-neutral-400">{t.noMaterials}</td></tr>}
            {report.materialLogs.map((m: any) =>
              editingMaterialId === m.id ? (
                <tr key={m.id} className="border-t bg-neutral-50">
                  <td className="p-2 text-neutral-400">{m.item?.name ?? <input value={editMaterialForm.customName} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, customName: e.target.value })} className="w-full border rounded-lg px-2 py-1" />}</td>
                  <td className="p-2"><input type="number" step="0.001" value={editMaterialForm.quantity} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, quantity: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2"></td>
                  <td className="p-2"><input value={editMaterialForm.notes} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, notes: e.target.value })} className="w-full border rounded-lg px-2 py-1" /></td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => saveEditedMaterial(m.id)} className="text-success text-xs">{t.saveEdit}</button>
                    <button onClick={() => setEditingMaterialId(null)} className="text-neutral-500 text-xs">{t.cancelEdit}</button>
                  </td>
                </tr>
              ) : (
                <tr key={m.id} className="border-t">
                  <td className="p-3 font-medium">{m.item?.name ?? m.customName}</td>
                  <td className="p-3">{Number(m.quantity).toLocaleString(localeCode)} {m.unit || m.item?.unit || ""}</td>
                  <td className="p-3">{m.stockMovementId ? <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{locale === "ar" ? "اتخصم من المخزن" : "Deducted from stock"}</span> : "—"}</td>
                  <td className="p-3 text-neutral-500">{m.notes || "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEditMaterial(m)} className="text-primary hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={() => removeMaterialLog(m.id)} className="text-danger hover:opacity-70"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* صور الموقع */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2"><Camera size={18} /> {t.photosTitle}</h2>
      </div>
      <div className="card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="text-sm text-neutral-600 block mb-1">{t.caption}</label>
            <input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <label className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-60">
            {uploading ? t.uploading : t.uploadPhoto}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
        {report.photos.length === 0 ? (
          <p className="text-sm text-neutral-400">{t.noPhotos}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {report.photos.map((p: any) => (
              <div key={p.id} className="relative group">
                <img src={p.url} alt={p.caption ?? ""} className="w-full h-32 object-cover rounded-xl border" />
                {p.caption && <p className="text-xs text-neutral-500 mt-1 truncate">{p.caption}</p>}
                <button onClick={() => deletePhoto(p.id)} className="absolute top-1 left-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={14} className="text-danger" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
