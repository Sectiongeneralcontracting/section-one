const styles: Record<string, string> = {
  ONGOING: "bg-success/10 text-success",
  READY_TO_CLOSE: "bg-secondary/10 text-secondary",
  CLOSED: "bg-neutral-100 text-neutral-500",
  DELAYED: "bg-danger/10 text-danger",
};

const labels: Record<string, string> = {
  ONGOING: "جارية",
  READY_TO_CLOSE: "جاهزة للإغلاق",
  CLOSED: "مغلقة",
  DELAYED: "متأخرة",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] ?? "bg-neutral-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}
