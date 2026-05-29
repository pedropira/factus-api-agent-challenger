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
  { entity: "support_documents", label: "Docs. Soporte", icon: FileSpreadsheet },
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
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-line-default">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-factus-primary">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-content-primary">
            Factus Agent
          </span>
          <span className="text-[10px] font-medium tracking-wider text-content-tertiary uppercase">
            Facturación Electrónica
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentEntity === item.entity;

          return (
            <button
              key={item.entity}
              type="button"
              onClick={() => setCurrentEntity(item.entity)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
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
      <div className="border-t border-line-default px-4 py-3 space-y-2">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-content-tertiary transition-all duration-150 hover:bg-overlay-hover hover:text-content-primary"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
        </button>

        <p className="text-[10px] text-content-tertiary/60 leading-relaxed px-3">
          Conectado a Factus API · DIAN
        </p>
      </div>
    </nav>
  );
}
