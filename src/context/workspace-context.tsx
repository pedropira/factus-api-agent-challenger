"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ── Entity Types ─────────────────────────────────────────────────────────
// Mapeo 1:1 con los recursos del MCP y los endpoints de /api/records
export type EntityType =
  | "dashboard"
  | "customers"
  | "products"
  | "invoices"
  | "credit_notes"
  | "support_documents"
  | "adjustment_notes"
  | "establishments";

export const ENTITY_LIST: EntityType[] = [
  "dashboard",
  "customers",
  "products",
  "invoices",
  "credit_notes",
  "support_documents",
  "adjustment_notes",
  "establishments",
];

// ── Context Shape ────────────────────────────────────────────────────────
interface WorkspaceContextType {
  /** Entidad activa en el sidebar → workspace derecho */
  currentEntity: EntityType;
  setCurrentEntity: (entity: EntityType) => void;

  /**
   * Puente centro ↔ derecha: los templates del entity-workspace
   * escriben acá y el CoPilotChat lo consume para pre-llenar el input.
   */
  chatInputValue: string;
  setChatInputValue: (value: string) => void;

  /**
   * Contador incremental. El chat lo incrementa cuando la IA confirma
   * una operación CRUD. El entity-workspace lo escucha para recargar.
   */
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentEntity, setCurrentEntity] = useState<EntityType>("dashboard");
  const [chatInputValue, setChatInputValue] = useState("");
  const refreshRef = useRef(0);
  const [, setTick] = useState(0);

  const triggerRefresh = useCallback(() => {
    refreshRef.current += 1;
    setTick(refreshRef.current);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        currentEntity,
        setCurrentEntity,
        chatInputValue,
        setChatInputValue,
        refreshTrigger: refreshRef.current,
        triggerRefresh,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────
export function useWorkspace(): WorkspaceContextType {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  }
  return ctx;
}
