const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeNetSalary(baseSalary: number, allowances: number, deductions: number): number {
  return round2(baseSalary + allowances - deductions);
}

export type AttendanceRecordInput = { status: "PRESENT" | "ABSENT" | "LEAVE" | "SICK" };

// يحسب أيام الحضور الفعلية من إجمالي أيام الشهر (للاستخدام في خصم الغياب من الراتب مثلاً)
export function computeAttendanceSummary(records: AttendanceRecordInput[]) {
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const leave = records.filter((r) => r.status === "LEAVE").length;
  const sick = records.filter((r) => r.status === "SICK").length;
  return { present, absent, leave, sick, total: records.length };
}

// خصم يومي من الراتب بناءً على أيام الغياب غير المبرر
export function computeAbsenceDeduction(baseSalary: number, absentDays: number, workingDaysInMonth = 30): number {
  if (absentDays <= 0) return 0;
  return round2((baseSalary / workingDaysInMonth) * absentDays);
}

// يحسب عدد ساعات العمل بين وقتي حضور وانصراف
export function computeWorkedHours(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  if (ms <= 0) return 0;
  return round2(ms / (1000 * 60 * 60));
}
