import { ChatShell } from "@/components/chat/ChatShell";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";

export default function Home() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Chat panel — primary interface */}
      <div className="flex-1 min-w-0 border-r border-zinc-200 dark:border-zinc-700">
        <ChatShell />
      </div>

      {/* Dashboard panel — secondary, read-only Top 10 tables */}
      <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
        <DashboardPanel />
      </aside>
    </div>
  );
}
