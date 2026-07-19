export type EquipmentStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";

// معدة متاحة للتخصيص لمشروع لو حالتها "متاحة" فقط
export function canAssignEquipment(status: EquipmentStatus): boolean {
  return status === "AVAILABLE";
}

// معدة تدخل الصيانة من أي حالة إلا لو خارج الخدمة نهائيًا
export function canSendToMaintenance(status: EquipmentStatus): boolean {
  return status !== "OUT_OF_SERVICE";
}

// عند إنهاء تخصيص معدة، ترجع "متاحة" إلا لو كانت أصلًا محتاجة صيانة
export function nextStatusAfterUnassign(needsMaintenance: boolean): EquipmentStatus {
  return needsMaintenance ? "MAINTENANCE" : "AVAILABLE";
}
