import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", toneClasses[tone])}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="text-lg font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
