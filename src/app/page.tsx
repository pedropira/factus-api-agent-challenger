import { Sidebar } from "@/components/sidebar";
import { CoPilotChat } from "@/components/co-pilot-chat";
import { EntityWorkspace } from "@/components/entity-workspace";

export default function Home() {
  return (
    <div className="flex h-full gap-2">
      {/* Sidebar — navegación lateral */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col rounded-2xl border border-line-subtle bg-surface-panel">
        <Sidebar />
      </aside>

      {/* Chat — interfaz agentiva principal */}
      <main className="flex flex-1 flex-col min-w-0 rounded-2xl border border-line-subtle bg-surface-panel">
        <CoPilotChat />
      </main>

      {/* Entity Workspace — panel de contexto dinámico */}
      <aside className="hidden xl:flex w-[580px] xl:w-[600px] shrink-0 flex-col rounded-2xl border border-line-subtle bg-surface-panel">
        <EntityWorkspace />
      </aside>
    </div>
  );
}
