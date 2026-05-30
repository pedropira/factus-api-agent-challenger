"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useWorkspace, type EntityType } from "@/context/workspace-context";
import type { RecordType } from "@/lib/types";

// ── Entity Configuration ─────────────────────────────────────────────────

interface PromptTemplate {
  label: string;
  prompt: string;
}

interface EntityConfig {
  label: string;
  templates: PromptTemplate[];
  tools: { mcpName: string; label: string }[];
  dianGuide: string[];
  recordType?: RecordType;
}

const ENTITY_CONFIG: Record<string, EntityConfig> = {
  dashboard: {
    label: "Dashboard",
    templates: [],
    tools: [],
    dianGuide: [
      "Panel general de facturación electrónica",
      "Seleccioná una entidad del menú lateral para gestionar recursos",
    ],
  },
  customers: {
    label: "Clientes",
    templates: [
      {
        label: "➕ Registrar Cliente",
        prompt: "Creá un nuevo cliente. Necesito los datos completos: tipo de identificación (NIT/CC), número, nombre o razón social, email y dirección.",
      },
      {
        label: "🔍 Buscar Cliente",
        prompt: "Buscá un cliente por NIT, CC, nombre o email:",
      },
    ],
    tools: [
      { mcpName: "create_customer", label: "Crear Cliente" },
      { mcpName: "search_customers", label: "Buscar Cliente" },
      { mcpName: "get_customer", label: "Detalle Cliente" },
    ],
    dianGuide: [
      "NIT debe incluir DV (dígito de verificación)",
      "CC para personas naturales colombianas",
      "Email obligatorio para envío de facturas electrónicas",
      "Municipio DIAN requerido (ej: 11001 = Bogotá)",
    ],
    recordType: "customers",
  },
  products: {
    label: "Productos",
    templates: [
      {
        label: "➕ Registrar Producto",
        prompt: "Creá un nuevo producto. Necesito: código de referencia, nombre, precio CON IVA incluido, tasa de IVA (ej: 19.00), unidad de medida y si está exento.",
      },
      {
        label: "🔍 Buscar Producto",
        prompt: "Buscá un producto por nombre o código de referencia:",
      },
    ],
    tools: [
      { mcpName: "create_product", label: "Crear Producto" },
      { mcpName: "search_products", label: "Buscar Producto" },
      { mcpName: "get_product_by_code", label: "Detalle Producto" },
    ],
    dianGuide: [
      "Precio SIEMPRE con IVA incluido (valor bruto)",
      "Código de referencia único por producto",
      "Tasa de IVA: 19%, 5%, 0% o exento",
      "standard_code_id: 1 = código propio, 2 = UNSPSC",
    ],
    recordType: "products",
  },
  invoices: {
    label: "Facturas",
    templates: [
      {
        label: "📄 Emitir Factura",
        prompt: "Emití una factura electrónica. Necesito: cliente (buscálo primero), producto/servicio, cantidad y forma de pago.",
      },
      {
        label: "🔍 Buscar Factura",
        prompt: "Buscá una factura por número de factura o código de referencia:",
      },
    ],
    tools: [
      { mcpName: "create_invoice_with_numbering", label: "Emitir Factura" },
      { mcpName: "list_invoices", label: "Listar Facturas" },
      { mcpName: "get_invoice_by_number", label: "Detalle Factura" },
      { mcpName: "get_default_numbering_range", label: "Rango Numeración" },
    ],
    dianGuide: [
      "Usar create_invoice_with_numbering (numeración automática)",
      "Obtener numbering_range_id vía get_default_numbering_range",
      "Reference_code único por factura",
      "La factura se valida con DIAN automáticamente",
    ],
    recordType: "invoices",
  },
  credit_notes: {
    label: "Notas Crédito",
    templates: [
      {
        label: "📝 Crear Nota Crédito",
        prompt: "Creá una nota crédito. Necesito: el número de factura a corregir (bill_number), el concepto de corrección y los items a devolver.",
      },
      {
        label: "🔍 Buscar Nota Crédito",
        prompt: "Buscá una nota crédito por código de referencia:",
      },
    ],
    tools: [
      { mcpName: "create_credit_note", label: "Crear Nota Crédito" },
      { mcpName: "list_credit_notes", label: "Listar Notas Crédito" },
      { mcpName: "get_credit_note", label: "Detalle Nota Crédito" },
    ],
    dianGuide: [
      "Correction_concept_code: 1 = Devolución, 2 = Anulación",
      "Requiere bill_number de factura validada",
      "Solo aplica a facturas que ya fueron aceptadas por DIAN",
    ],
    recordType: "credit_notes",
  },
  support_documents: {
    label: "Docs. Soporte",
    templates: [
      {
        label: "📄 Crear Doc. Soporte",
        prompt: "Creá un documento soporte (DS). Necesito: datos del proveedor, items y forma de pago.",
      },
    ],
    tools: [
      { mcpName: "create_support_document", label: "Crear DS" },
      { mcpName: "list_support_documents", label: "Listar DS" },
      { mcpName: "get_support_document", label: "Detalle DS" },
    ],
    dianGuide: [
      "DS aplica a compras a no obligados a facturar",
      "Requiere datos completos del proveedor",
      "Numeración independiente de facturas",
    ],
    recordType: "support_documents",
  },
  adjustment_notes: {
    label: "Notas Ajuste",
    templates: [
      {
        label: "📝 Crear Nota Ajuste",
        prompt: "Creá una nota de ajuste. Necesito: el número del documento soporte a corregir, concepto de corrección y items.",
      },
    ],
    tools: [
      { mcpName: "create_adjustment_note", label: "Crear Nota Ajuste" },
      { mcpName: "list_adjustment_notes", label: "Listar Notas Ajuste" },
      { mcpName: "get_adjustment_note", label: "Detalle Nota Ajuste" },
    ],
    dianGuide: [
      "Corrige documentos soporte (DS) validados",
      "Correction_concept_code según la DIAN",
      "No confundir con Notas Crédito (aplica a facturas)",
    ],
    recordType: "adjustment_notes",
  },
  establishments: {
    label: "Establecimientos",
    templates: [
      {
        label: "🏢 Registrar Establecimiento",
        prompt: "Registrá un nuevo establecimiento. Necesito: nombre, dirección, teléfono, email y código de municipio DIAN.",
      },
    ],
    tools: [
      { mcpName: "create_establishment", label: "Crear Establecimiento" },
      { mcpName: "list_establishments", label: "Listar Establecimientos" },
      { mcpName: "get_establishment", label: "Detalle Establecimiento" },
    ],
    dianGuide: [
      "Código de municipio DIAN obligatorio (ej: 11001)",
      "El establecimiento principal se crea automáticamente",
      "Usar para sucursales o puntos de venta adicionales",
    ],
  },
};

// ── Types for records ────────────────────────────────────────────────────
interface RecordRow {
  id: number;
  [key: string]: unknown;
}

// ── EntityWorkspace Component ────────────────────────────────────────────
export function EntityWorkspace() {
  const { currentEntity, setChatInputValue, refreshTrigger } = useWorkspace();
  const config = ENTITY_CONFIG[currentEntity] ?? ENTITY_CONFIG.dashboard;

  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch records when entity changes or refreshTrigger increments
  const fetchRecords = useCallback(async () => {
    if (!config.recordType) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/records?type=${config.recordType}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRecords(json.data ?? []);
    } catch (err) {
      console.error("[EntityWorkspace] fetch error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [config.recordType]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, refreshTrigger]);

  // ── Inline Table ───────────────────────────────────────────────────
  function renderTable() {
    if (loading) {
      return (
        <div className="space-y-2 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-7 animate-pulse rounded bg-overlay-hover"
            />
          ))}
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <p className="py-8 text-center text-xs text-content-tertiary/60">
          Sin registros
        </p>
      );
    }

    // Dynamic columns: pick first 4 keys (skip id)
    const columns = records.length > 0
      ? Object.keys(records[0]).filter((k) => k !== "id").slice(0, 4)
      : [];

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line-default">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-1.5 text-left font-mono font-medium text-content-tertiary uppercase tracking-wider"
                >
                  {col === "reference_code"
                    ? "Ref."
                    : col === "bill_number"
                      ? "Número"
                      : col === "identification"
                        ? "Ident."
                        : col === "names"
                          ? "Nombre"
                          : col === "company"
                            ? "Empresa"
                            : col === "name"
                              ? "Nombre"
                              : col === "price"
                                ? "Precio"
                                : col === "status"
                                  ? "Estado"
                                  : col === "total"
                                    ? "Total"
                                    : col === "created_at"
                                      ? "Creado"
                                      : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr
                key={row.id}
                className="border-b border-line-subtle hover:bg-overlay-hover transition-colors"
              >
                {columns.map((col) => {
                  const val = row[col];
                  const display = val != null ? String(val) : "—";

                  // Truncate long strings
                  const truncated =
                    display.length > 28
                      ? `${display.slice(0, 25)}...`
                      : display;

                  // Special status badge
                  if (col === "status") {
                    const isAccepted =
                      display === "ACCEPTED" || display === "accepted";
                    return (
                      <td key={col} className="px-2 py-1.5">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            isAccepted
                              ? "bg-factus-accent/15 text-factus-accent"
                              : "bg-yellow-500/10 text-yellow-500",
                          )}
                        >
                          {isAccepted ? "✅" : "⏳"} {display}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col}
                      className="max-w-[140px] truncate px-2 py-1.5 font-mono text-content-secondary"
                      title={display}
                    >
                      {truncated}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-panel border-l border-line-default">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="border-b border-line-default px-4 py-3 shrink-0">
        <h2 className="text-sm font-semibold tracking-tight text-content-primary">
          {config.label}
        </h2>
      </header>

      {/* ── Content: fills remaining height ────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ── Section 1: Prompt Templates ─────────────────────────────── */}
        {config.templates.length > 0 && (
          <section className="border-b border-line-default px-3 py-3 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {config.templates.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => setChatInputValue(tmpl.prompt)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface-elevated px-2.5 py-1.5 text-xs font-mono font-medium text-content-secondary transition-all duration-150 hover:border-factus-primary/40 hover:text-factus-primary hover:bg-factus-primary/5"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 2: Live Ledger — scroll solo en la tabla ────────── */}
        {config.recordType && (
          <section className="border-b border-line-default flex flex-col min-h-0 flex-1">
            {/* Ledger header — fixed */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1.5 shrink-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
                Live Ledger
              </h3>
              <span className="text-[10px] text-content-tertiary/60">
                Top 10 · {config.label.toLowerCase()}
              </span>
            </div>

            {/* Table area — only this scrolls */}
            <div className="overflow-y-auto min-h-0 flex-1 px-3 pb-3">
              {renderTable()}
            </div>
          </section>
        )}

        {/* ── Section 3: Support Panel — flex-1 cuando NO hay ledger ──── */}
        <section
          className={cn(
            "px-3 py-3",
            config.recordType ? "shrink-0" : "flex-1 flex flex-col justify-center",
          )}
        >
          {config.recordType ? (
            /* Full layout when ledger exists */
            <div className="grid grid-cols-2 gap-3">
              {/* Left: DIAN Guide */}
              <div>
                <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-content-tertiary/70">
                  DIAN
                </h4>
                <ul className="space-y-1">
                  {config.dianGuide.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[10px] leading-relaxed text-content-tertiary/80"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: Active Tools */}
              <div>
                <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-content-tertiary/70">
                  Herramientas
                </h4>
                <ul className="space-y-1">
                  {config.tools.length === 0 ? (
                    <li className="text-[10px] text-content-tertiary/50 italic">
                      Sin tools específicas
                    </li>
                  ) : (
                    config.tools.map((tool) => (
                      <li
                        key={tool.mcpName}
                        className="inline-flex items-center gap-1 rounded-md border border-line-subtle bg-surface-elevated/50 px-2 py-0.5 text-[10px] text-content-secondary mr-1 mb-1"
                        title={tool.mcpName}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-factus-muted/60" />
                        {tool.label}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ) : (
            /* Centered minimal view for dashboard / non-record entities */
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              {config.dianGuide.length > 0 && (
                <ul className="space-y-1.5">
                  {config.dianGuide.map((tip, i) => (
                    <li
                      key={i}
                      className="text-xs leading-relaxed text-content-tertiary/80"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
