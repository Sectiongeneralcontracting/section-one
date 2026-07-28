import { Sidebar } from "./sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";

export function AppShell({
  title,
  action,
  children,
  hideTitle = false,
  hideBell = false,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  hideTitle?: boolean;
  hideBell?: boolean;
}) {
  return (
    <div className="flex">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="flex-1 p-6 space-y-5 min-h-screen print:p-0 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
          {!hideTitle ? (
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {!hideBell && <NotificationBell />}
            <UserMenu />
            {action}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
