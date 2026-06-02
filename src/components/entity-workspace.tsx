"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useWorkspace, type EntityType } from "@/context/workspace-context";
import { RecordModal } from "@/components/entity/RecordModal";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
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
      "💡 Usá lenguaje natural — decime qué querés hacer y lo ejecuto",
      "📦 Primero creá productos antes de emitir facturas",
      "👤 Los clientes se crean con CC o NIT + dígito de verificación",
      "📄 Las facturas necesitan un rango de numeración activo",
      "🔍 Siempre buscá antes de crear para evitar duplicados",
    ],
  },
  customers: {
    label: "Clientes",
    templates: [
      {
        label: "➕ Registrar Cliente",
        prompt: `Creá un nuevo cliente en el sistema. Con los siguientes datos uno por uno y no inventes información:

- Tipo de identificación (CC / NIT / NIT + DV): __________
- Número de identificación: __________
- Nombre(s) o Razón Social: __________
- Email: __________
- Dirección: __________
- Teléfono: __________
- Municipio: __________`,
      },
      {
        label: "🔍 Buscar Cliente",
        prompt: `Buscá un cliente existente por NIT, CC, nombre o email. Si hay múltiples resultados, mostralos y pedime que elija cuál es el correcto.
          Parametro de búsqueda: __________`,
      },
    ],
    tools: [
      { mcpName: "create_customer", label: "Crear Cliente" },
      { mcpName: "search_customers", label: "Buscar Cliente" },
      { mcpName: "get_customer", label: "Detalle Cliente" },
    ],
    dianGuide: [
      "👤 CC para persona natural, NIT + DV para persona jurídica",
      "📧 El email es obligatorio para enviar facturas electrónicas",
      "📍 Decime el nombre del municipio y lo resuelvo automáticamente",
      "🔍 Buscá siempre por NIT/CC antes de crear un cliente nuevo",
      "🏷️ trade_name es el nombre comercial, company es la razón social",
    ],
    recordType: "customers",
  },
  products: {
    label: "Productos",
    templates: [
      {
        label: "➕ Registrar Producto",
        prompt: `Creá un nuevo producto en el catálogo. Con los siguientes datos uno por uno y no inventes información:

- Código de referencia único (ej: PROD-001): __________
- Nombre del producto: __________
- Precio CON IVA incluido: __________
- Tasa de IVA (19% / 5% / 0%): __________
- Unidad de medida (Unidad / Servicio / Hora): __________
- ¿Está exento de IVA? (sí / no): __________`,
      },
      {
        label: "🔍 Buscar Producto",
        prompt: `Buscá un producto por nombre, código de referencia o parte del nombre. Mostrá los resultados con código de referencia, nombre, precio con IVA y tasa de IVA.
          Parametro de búsqueda: __________`,
      },
    ],
    tools: [
      { mcpName: "create_product", label: "Crear Producto" },
      { mcpName: "search_products", label: "Buscar Producto" },
      { mcpName: "get_product_by_code", label: "Detalle Producto" },
    ],
    dianGuide: [
      "💰 El precio es CON IVA incluido (valor bruto, no base)",
      "🔑 Código de referencia único por producto — ej: PROD-001",
      "📊 IVA estándar 19%, también 5% o 0% (excluido)",
      "📏 unit_measure_id: 70 = Unidad, 94 = Servicios, 98 = Horas",
      "🏷️ standard_code_id: 1 = código propio, 2 = UNSPSC",
    ],
    recordType: "products",
  },
  invoices: {
    label: "Facturas",
    templates: [
      {
        label: "📄 Factura Contado",
        prompt: `Emití una factura electrónica de contado. Con los siguientes datos uno por uno y no inventes información:

- Cliente (nombre o NIT): __________
- Producto(s) (nombre o código): __________
- Cantidad(es): __________
- Método de pago (efectivo / transferencia / tarjeta): __________`,
      },
      {
        label: "💳 Factura Electrónico",
        prompt: `Emití una factura electrónica con pago por transferencia o tarjeta. Con los siguientes datos uno por uno y no inventes información:

- Cliente (nombre o NIT): __________
- Producto(s) (nombre o código): __________
- Cantidad(es): __________
- Método de pago (transferencia / tarjeta débito / tarjeta crédito): __________`,
      },
      {
        label: "🔍 Buscar Factura",
        prompt: `Buscá una factura ya emitida por número de factura (bill_number) o código de referencia. Mostrá el estado DIAN, el total, la fecha de emisión y si está aceptada o pendiente.
          Parametro de búsqueda: __________`,
      },
    ],
    tools: [
      { mcpName: "create_invoice_with_numbering", label: "Emitir Factura" },
      { mcpName: "list_invoices", label: "Listar Facturas" },
      { mcpName: "get_invoice_by_number", label: "Detalle Factura" },
      { mcpName: "get_default_numbering_range", label: "Rango Numeración" },
    ],
    dianGuide: [
      "📄 Necesito: cliente + productos + rango de numeración activo",
      "💳 Contado ≤ $4.7M → factura normal con numbering",
      "💳 Electrónico > $4.7M → factura sin numbering (evita ReteGMF 4x1000)",
      "🔢 reference_code único por factura — ej: FAC-001-2026",
      "✅ La factura se valida con DIAN automáticamente al crearla",
    ],
    recordType: "invoices",
  },
  credit_notes: {
    label: "Notas Crédito",
    templates: [
      {
        label: "📝 Crear Nota Crédito",
        prompt: `Creá una nota crédito para corregir una factura ya emitida. Con los siguientes datos uno por uno y no inventes información:

- Número de factura a corregir (bill_number): __________
- Concepto (1 = devolución, 2 = anulación, 3 = rebaja): __________
- Producto(s) a corregir (nombre o código): __________
- Cantidad(es) a corregir: __________`,
      },
      {
        label: "🔍 Buscar Nota Crédito",
        prompt: `Buscá una nota crédito existente por código de referencia o número. Mostrá el estado, el total y la factura asociada.
          Parametro de búsqueda: __________`,
      },
    ],
    tools: [
      { mcpName: "create_credit_note", label: "Crear Nota Crédito" },
      { mcpName: "list_credit_notes", label: "Listar Notas Crédito" },
      { mcpName: "get_credit_note", label: "Detalle Nota Crédito" },
    ],
    dianGuide: [
      "📝 Las notas crédito CORRIGEN facturas ya aceptadas por DIAN",
      "🔢 Necesito el bill_number de la factura a corregir (no el reference_code)",
      "📋 Conceptos: 1 = Devolución parcial, 2 = Anulación total, 3 = Rebaja",
      "📎 Los mismos items de la factura original con cantidades a corregir",
      "🔍 Verificá que la factura esté ACEPTADA antes de crear la NC",
    ],
    recordType: "credit_notes",
  },
  support_documents: {
    label: "Docs. Soporte",
    templates: [
      {
        label: "📄 Crear Doc. Soporte",
        prompt: `Creá un documento soporte electrónico (DS) para una compra. Con los siguientes datos uno por uno y no inventes información:

Proveedor:
- Tipo de identificación (CC / NIT): __________
- Número de identificación: __________
- Nombre o Razón Social: __________
- Dirección: __________
- Municipio (ej: Bogotá, Medellín): __________
- Email: __________

Producto(s):
- Nombre o código: __________
- Cantidad: __________
- Valor unitario CON IVA incluido: __________
- Tasa de IVA (19% / 5% / 0%): __________
- Unidad de medida (Unidad / Servicio / Hora): __________

Pago:
- Método de pago (efectivo / transferencia / tarjeta): __________`,
      },
      {
        label: "🔍 Buscar Doc. Soporte",
        prompt: `Buscá un documento soporte por código de referencia o número. Mostrá el estado DIAN, total y fecha.
          Parametro de búsqueda: __________`,
      },
    ],
    tools: [
      { mcpName: "create_support_document", label: "Crear DS" },
      { mcpName: "list_support_documents", label: "Listar DS" },
      { mcpName: "get_support_document", label: "Detalle DS" },
    ],
    dianGuide: [
      "📄 DS es para compras a proveedores NO obligados a facturar electrónicamente",
      "👤 Proveedor necesita: tipo doc, NIT, nombre, dirección, municipio, email",
      "🔢 La numeración la asigna Factus — no necesito rango local",
      "💳 Los montos de pago son OBLIGATORIOS (a diferencia de facturas)",
      "📦 Productos: nombre, cantidad, valor CON IVA, tasa IVA, unidad medida",
    ],
    recordType: "support_documents",
  },
  adjustment_notes: {
    label: "Notas Ajuste",
    templates: [
      {
        label: "📝 Crear Nota Ajuste",
        prompt: `Creá una nota de ajuste para corregir un documento soporte ya emitido. Con los siguientes datos uno por uno y no inventes información:

- Número del documento soporte a corregir: __________
- Concepto de ajuste: __________
- Producto(s) a ajustar (nombre o código): __________
- Cantidad(es) ajustada(s): __________
- Motivo del ajuste: __________`,
      },
      {
        label: "🔍 Buscar Nota Ajuste",
        prompt: `Buscá una nota de ajuste por código de referencia o número. Mostrá el estado, total y documento asociado.
          Parametro de búsqueda: __________`,
      },
    ],
    tools: [
      { mcpName: "create_adjustment_note", label: "Crear Nota Ajuste" },
      { mcpName: "list_adjustment_notes", label: "Listar Notas Ajuste" },
      { mcpName: "get_adjustment_note", label: "Detalle Nota Ajuste" },
    ],
    dianGuide: [
      "🔄 Corrige Documentos Soporte (DS), NO facturas — eso es Nota Crédito",
      "🔗 Necesito el número del DS a corregir (el asignado por Factus)",
      "📋 correction_concept_code: según la DIAN para el tipo de ajuste",
      "📎 Incluí SOLO los items que están siendo ajustados, no todos",
      "📝 observation es obligatorio — explicá el motivo del ajuste",
    ],
    recordType: "adjustment_notes",
  },
  establishments: {
    label: "Establecimientos",
    templates: [
      {
        label: "🏢 Registrar Establecimiento",
        prompt: `Registrá un nuevo establecimiento comercial (sucursal). Con los siguientes datos uno por uno y no inventes información:

- Nombre del establecimiento: __________
- Dirección completa: __________
- Teléfono: __________
- Email: __________
- Municipio: __________`,
      },
    ],
    tools: [
      { mcpName: "create_establishment", label: "Crear Establecimiento" },
      { mcpName: "list_establishments", label: "Listar Establecimientos" },
      { mcpName: "get_establishment", label: "Detalle Establecimiento" },
    ],
    dianGuide: [
      "🏢 Creá sucursales o puntos de venta adicionales",
      "📍 Decime el nombre del municipio y lo resuelvo automáticamente",
      "📞 Teléfono y email recomendados para datos fiscales",
      "🏗️ El establecimiento principal se crea automáticamente",
      "📋 Se usa en facturación para indicar punto de emisión",
    ],
    recordType: "establishments",
  },
};

// ── Types for records ────────────────────────────────────────────────────
interface RecordRow {
  id: number;
  [key: string]: unknown;
}

// ── Explicit table columns per entity ─────────────────────────────────────
const TABLE_COLUMNS: Record<string, { key: string; label: string }[]> = {
  customers: [
    { key: "identification", label: "Ident." },
    { key: "names", label: "Nombre" },
    { key: "email", label: "Email" },
    { key: "created_at", label: "Creado" },
  ],
  products: [
    { key: "code_reference", label: "Código" },
    { key: "name", label: "Nombre" },
    { key: "price", label: "Precio" },
    { key: "tax_rate", label: "IVA" },
  ],
  invoices: [
    { key: "number", label: "Número" },
    { key: "customer_name", label: "Cliente" },
    { key: "total", label: "Total" },
    { key: "status", label: "Estado" },
  ],
  credit_notes: [
    { key: "number", label: "Número" },
    { key: "customer_name", label: "Cliente" },
    { key: "total", label: "Total" },
    { key: "status", label: "Estado" },
  ],
  support_documents: [
    { key: "number", label: "Número" },
    { key: "provider_name", label: "Proveedor" },
    { key: "total", label: "Total" },
    { key: "status", label: "Estado" },
  ],
  adjustment_notes: [
    { key: "number", label: "Número" },
    { key: "provider_name", label: "Proveedor" },
    { key: "total", label: "Total" },
    { key: "status", label: "Estado" },
  ],
  establishments: [
    { key: "name", label: "Nombre" },
    { key: "address", label: "Dirección" },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Email" },
  ],
};

// ── EntityWorkspace Component ────────────────────────────────────────────
export function EntityWorkspace() {
  const { currentEntity, setChatInputValue, refreshTrigger } = useWorkspace();
  const config = ENTITY_CONFIG[currentEntity] ?? ENTITY_CONFIG.dashboard;

  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

    // Explicit columns per entity type (not dynamic — avoids rendering objects)
    const cols = TABLE_COLUMNS[config.recordType!] ?? TABLE_COLUMNS.invoices;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line-default">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-1.5 text-left font-mono font-medium text-content-tertiary uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr
                key={row.id}
                onClick={() => {
                  setSelectedRecord(row);
                  setModalOpen(true);
                }}
                className="cursor-pointer border-b border-line-subtle hover:bg-overlay-hover transition-colors"
              >
                {cols.map((col) => {
                  const raw = row[col.key];
                  // If the value is an object or array, skip it (use fallback)
                  const val =
                    typeof raw === "object" && raw !== null ? null : raw;
                  const display = val != null ? String(val) : "—";

                  // Truncate long strings
                  const truncated =
                    display.length > 28
                      ? `${display.slice(0, 25)}...`
                      : display;

                  // Special status badge
                  if (col.key === "status") {
                    const isAccepted =
                      display === "ACCEPTED" || display === "accepted";
                    return (
                      <td key={col.key} className="px-2 py-1.5">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            isAccepted
                              ? "bg-factus-accent/15 text-factus-accent"
                              : "bg-yellow-500/10 text-yellow-500",
                          )}
                        >
                          {display}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col.key}
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
    <div className="flex h-full flex-col bg-surface-panel">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="border-b border-line-default px-4 py-3 shrink-0">
        <h2 className="text-base font-semibold tracking-tight text-content-primary">
          {config.label}
        </h2>
      </header>

      {/* ── Content: fills remaining height ────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ── Section 1: Prompt Templates ─────────────────────────────── */}
        {config.templates.length > 0 && (
          <section className="px-3 pt-3 pb-2 shrink-0">
            <div className="flex flex-wrap gap-2">
              {config.templates.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => setChatInputValue(tmpl.prompt)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface-elevated px-3 py-2 text-xs font-semibold text-content-secondary transition-all duration-150 hover:border-factus-primary/40 hover:text-factus-primary hover:bg-factus-primary/5 shadow-sm"
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                Registros
              </h3>
              <span className="text-[10px] text-content-tertiary/60">
                Top 10 · {config.label.toLowerCase()}
              </span>
            </div>

            {/* Table area — only this scrolls */}
            <div className="scrollbar-custom overflow-y-auto min-h-0 flex-1 px-3 pb-3">
              {renderTable()}
            </div>
          </section>
        )}

        {/* ── Section 3: Support Panel — flex-1 cuando NO hay ledger ──── */}
        <section
          className={cn(
            "px-3 py-3",
            config.recordType
              ? "shrink-0"
              : "flex-1 flex flex-col justify-center",
          )}
        >
          {config.recordType ? (
            /* Full layout when ledger exists */
            <div className="grid grid-cols-5 gap-3">
              {/* Left (3 cols): Tools / Options — bigger buttons */}
              <div className="col-span-3">
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-content-tertiary/70">
                  Opciones
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {config.tools.length === 0 ? (
                    <p className="text-[10px] text-content-tertiary/50 italic">
                      Sin tools específicas
                    </p>
                  ) : (
                    config.tools.map((tool) => (
                      <button
                        key={tool.mcpName}
                        type="button"
                        onClick={() =>
                          setChatInputValue(
                            `Ejecutá la herramienta ${tool.mcpName} para ${config.label.toLowerCase()}`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface-elevated/60 px-2.5 py-2 text-xs font-medium text-content-secondary transition-all duration-150 hover:border-factus-primary/40 hover:text-factus-primary hover:bg-factus-primary/5"
                        title={tool.mcpName}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-factus-accent/60" />
                        {tool.label}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right (2 cols): Key Data for Creation */}
              <div className="col-span-2">
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-content-tertiary/70">
                  Tips de Creación
                </h4>
                <ul className="space-y-1">
                  {config.dianGuide.length === 0 ? (
                    <li className="text-[10px] text-content-tertiary/50 italic">
                      Sin datos
                    </li>
                  ) : (
                    config.dianGuide.map((tip, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-[10px] leading-relaxed text-content-tertiary/80"
                      >
                        <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-factus-primary/40" />
                        {tip}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ) : currentEntity === "dashboard" ? (
            <DashboardPanel />
          ) : (
            /* Centered minimal view for entities without ledger yet */
            <div className="flex flex-col items-center justify-center gap-10 text-center">
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

      {/* ── Record Detail Modal ───────────────────────────────────── */}
      <RecordModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        type={config.recordType ?? ""}
      />
    </div>
  );
}
