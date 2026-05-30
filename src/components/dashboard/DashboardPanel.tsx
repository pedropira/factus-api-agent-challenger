"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Users,
  Package,
  FileText,
  Receipt,
  FileSpreadsheet,
  FileEdit,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
} from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

// ── Types ──────────────────────────────────────────────────────────────────

interface DashboardCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  breakdown?: { accepted: number; rejected: number; pending: number };
}

// ── Component ──────────────────────────────────────────────────────────────

export function DashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Get display name from user metadata or email
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Usuario";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 px-3 py-3">
        {/* Welcome skeleton */}
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-overlay-hover" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-overlay-hover"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-3 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-xs text-content-tertiary">{error}</p>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-3 py-12 text-center">
        <TrendingUp className="h-8 w-8 text-content-tertiary/50" />
        <p className="text-xs text-content-tertiary/60">Sin datos</p>
      </div>
    );
  }

  // ── Cards ────────────────────────────────────────────────────────────
  const cards: DashboardCard[] = [
    {
      label: "Clientes",
      value: data.customers,
      icon: Users,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      label: "Productos",
      value: data.products,
      icon: Package,
      color: "text-sky-400",
      bgColor: "bg-sky-400/10",
    },
    {
      label: "Facturas",
      value: data.invoices.total,
      icon: FileText,
      color: "text-violet-400",
      bgColor: "bg-violet-400/10",
      breakdown: data.invoices,
    },
    {
      label: "Notas Crédito",
      value: data.credit_notes.total,
      icon: Receipt,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      breakdown: data.credit_notes,
    },
  ];

  const totalDocs =
    data.invoices.total +
    data.credit_notes.total +
    data.support_documents +
    data.adjustment_notes;

  return (
    <div className="space-y-10 px-3 py-3">
      {/* ── Welcome Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-line-subtle bg-gradient-to-br from-factus-primary/5 to-transparent px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-factus-primary/15">
          <Sparkles className="h-4.5 w-4.5 text-factus-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-content-primary truncate">
            Bienvenido, {displayName}
          </h2>
          <p className="text-[11px] text-content-tertiary/70">
            Panel general de facturación electrónica
          </p>
        </div>
      </div>

      {/* ── Status legend ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 rounded-lg border border-line-subtle bg-surface-elevated/30 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary/70">
          Estados
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-content-tertiary/80">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Aprobadas
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-content-tertiary/80">
            <Clock className="h-3 w-3 text-yellow-500" />
            Pendientes
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-content-tertiary/80">
            <XCircle className="h-3 w-3 text-red-400" />
            Rechazadas
          </span>
        </div>
      </div>

      {/* ── Main stat grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-line-subtle bg-surface-elevated/50 p-3.5"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  card.bgColor,
                )}
              >
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
              <span
                className={cn("text-xl font-bold tracking-tight", card.color)}
              >
                {card.value.toLocaleString("es-CO")}
              </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary/80">
              {card.label}
            </p>

            {/* 3-way breakdown bar */}
            {card.breakdown && card.value > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(card.breakdown.accepted / card.value) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-yellow-500/70 transition-all duration-500"
                    style={{
                      width: `${(card.breakdown.pending / card.value) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-400/70 transition-all duration-500"
                    style={{
                      width: `${(card.breakdown.rejected / card.value) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <StatusBadge
                    icon={CheckCircle2}
                    count={card.breakdown.accepted}
                    color="text-emerald-400"
                  />
                  <StatusBadge
                    icon={Clock}
                    count={card.breakdown.pending}
                    color="text-yellow-500"
                  />
                  <StatusBadge
                    icon={XCircle}
                    count={card.breakdown.rejected}
                    color="text-red-400"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Secondary stats row ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Docs. Soporte",
            value: data.support_documents,
            icon: FileSpreadsheet,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
          },
          {
            label: "Notas Ajuste",
            value: data.adjustment_notes,
            icon: FileEdit,
            color: "text-rose-400",
            bg: "bg-rose-400/10",
          },
          {
            label: "Total Docs.",
            value: totalDocs,
            icon: TrendingUp,
            color: "text-content-primary",
            bg: "bg-overlay-hover",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface-elevated/30 p-3"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                card.bg,
              )}
            >
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-content-tertiary/70 truncate">
                {card.label}
              </p>
              <p className={cn("text-base font-bold", card.color)}>
                {card.value.toLocaleString("es-CO")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({
  icon: Icon,
  count,
  color,
}: {
  icon: React.ElementType;
  count: number;
  color: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <Icon className={cn("h-3 w-3", color)} />
      <span className={cn("font-semibold", color)}>{count}</span>
    </span>
  );
}
