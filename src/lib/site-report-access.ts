// التقرير اليومي قابل للتعديل بحرية خلال 24 ساعة من إنشائه.
// بعد كده، التعديل (تعديل الملاحظات، أو إضافة عمال/معدات/مواد/صور) بيبقى مقصور على الـ Admin بس.
export function canEditSiteReport(createdAt: Date, role: string): { allowed: boolean; reason?: string } {
  if (role === "ADMIN") return { allowed: true };

  const hoursPassed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursPassed <= 24) return { allowed: true };

  return {
    allowed: false,
    reason: "مرت أكتر من 24 ساعة على إنشاء التقرير — التعديل دلوقتي مقصور على Admin بس",
  };
}
