import { Sidebar } from "./sidebar";
import { NotificationBell } from "@/components/notification-bell";

export function AppShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-5 min-h-screen">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {action}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
