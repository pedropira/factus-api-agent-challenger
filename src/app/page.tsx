import { Sidebar } from "@/components/sidebar";
import { CoPilotChat } from "@/components/co-pilot-chat";
import { EntityWorkspace } from "@/components/entity-workspace";

export default function Home() {
  return (
    <div className="flex h-full">
      {/* Sidebar — navegación lateral */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Chat — interfaz agentiva principal */}
      <main className="flex flex-1 flex-col min-w-0">
        <CoPilotChat />
      </main>

      {/* Entity Workspace — panel de contexto dinámico */}
      <aside className="hidden xl:flex w-96 xl:w-[480px] shrink-0 flex-col">
        <EntityWorkspace />
      </aside>
    </div>
  );
}
