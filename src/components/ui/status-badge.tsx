"use client";

import { useLocale } from "@/lib/use-locale";

const styles: Record<string, string> = {
  ONGOING: "bg-success/10 text-success",
  READY_TO_CLOSE: "bg-secondary/10 text-secondary",
  CLOSED: "bg-neutral-100 text-neutral-500",
  DELAYED: "bg-danger/10 text-danger",
};

const labels: Record<string, { ar: string; en: string }> = {
  ONGOING: { ar: "جارية", en: "Ongoing" },
  READY_TO_CLOSE: { ar: "جاهزة للإغلاق", en: "Ready to Close" },
  CLOSED: { ar: "مغلقة", en: "Closed" },
  DELAYED: { ar: "متأخرة", en: "Delayed" },
};

export function StatusBadge({ status }: { status: string }) {
  const locale = useLocale();
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] ?? "bg-neutral-100"}`}>
      {labels[status]?.[locale] ?? status}
    </span>
  );
}
