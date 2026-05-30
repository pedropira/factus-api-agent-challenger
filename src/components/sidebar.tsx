"use client";

import { cn } from "@/lib/utils";
import { useWorkspace, type EntityType } from "@/context/workspace-context";
import { useTheme } from "@/context/theme-context";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ScrollText,
  FileSpreadsheet,
  FilePenLine,
  Building2,
  Sun,
  Moon,
  type LucideIcon,
  Bot,
} from "lucide-react";

// ── Config ───────────────────────────────────────────────────────────────
interface SidebarItem {
  entity: EntityType;
  label: string;
  icon: LucideIcon;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { entity: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { entity: "customers", label: "Clientes", icon: Users },
  { entity: "products", label: "Productos", icon: Package },
  { entity: "invoices", label: "Facturas", icon: FileText },
  { entity: "credit_notes", label: "Notas Crédito", icon: ScrollText },
  {
    entity: "support_documents",
    label: "Docs. Soporte",
    icon: FileSpreadsheet,
  },
  { entity: "adjustment_notes", label: "Notas Ajuste", icon: FilePenLine },
  { entity: "establishments", label: "Establecimientos", icon: Building2 },
];

// ── Component ────────────────────────────────────────────────────────────
export function Sidebar() {
  const { currentEntity, setCurrentEntity } = useWorkspace();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="flex h-full flex-col bg-factus-sidebar border-r border-line-default">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-2 mt-8 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-factus-primary/20">
          <Bot className="h-4 w-4 text-factus-primary" />
        </div>
        <div className="flex flex-col -space-1">
          <span className="text-sm font-semibold tracking-tight text-content-primary">
            Factus-API Agent
          </span>
          <span className="text-[10px] -mt-0.5 text-content-tertiary">
            Factus Challenge
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 gap-0.5 overflow-y-auto px-3 py-2">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentEntity === item.entity;

          return (
            <button
              key={item.entity}
              type="button"
              onClick={() => setCurrentEntity(item.entity)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 my-3 text-sm font-mono transition-all duration-150",
                isActive
                  ? "bg-factus-primary/15 text-factus-primary shadow-sm border border-factus-primary/20"
                  : "text-content-tertiary hover:bg-overlay-hover hover:text-content-primary",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-factus-primary" : "text-content-tertiary",
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-factus-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-line-default px-3 py-3 space-y-2">
        {/* Theme Toggle — segmented control */}
        <div className="flex items-center rounded-xl bg-surface-elevated p-0.5 shadow-inner mb-5">
          <button
            type="button"
            onClick={() => theme !== "light" && toggleTheme()}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200 ${
              theme === "light"
                ? "bg-white text-factus-deep shadow-sm shadow-factus-deep/10"
                : "text-content-tertiary hover:text-content-primary"
            }`}
          >
            <Sun
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                theme === "light" ? "scale-110" : "scale-100"
              }`}
            />
            Claro
          </button>
          <button
            type="button"
            onClick={() => theme !== "dark" && toggleTheme()}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200 ${
              theme === "dark"
                ? "bg-surface-app text-content-primary shadow-sm shadow-black/20"
                : "text-content-tertiary hover:text-content-primary"
            }`}
          >
            <Moon
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                theme === "dark" ? "scale-110" : "scale-100"
              }`}
            />
            Oscuro
          </button>
        </div>

        <p className="text-[10px] text-content-tertiary/60 leading-relaxed px-1">
          Conectado a Factus API · DIAN
        </p>
      </div>
    </nav>
  );
}
