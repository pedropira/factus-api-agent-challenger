"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, FileText, User, Package, Receipt } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface RecordModalProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  type: string;
}

// ── Field display config ─────────────────────────────────────────────────

type FieldFormat =
  | "currency"
  | "date"
  | "uppercase"
  | "status"
  | "items"
  | "payment";

interface FieldDef {
  key: string;
  label: string;
  format?: FieldFormat;
  wide?: boolean;
}

const DOC_TYPES = new Set([
  "invoices",
  "credit_notes",
  "support_documents",
  "adjustment_notes",
]);

const TYPE_LABEL: Record<string, string> = {
  customers: "Cliente",
  products: "Producto",
  invoices: "Factura",
  credit_notes: "Nota Crédito",
  support_documents: "Doc. Soporte",
  adjustment_notes: "Nota Ajuste",
};

const TYPE_ICON: Record<string, typeof User> = {
  customers: User,
  products: Package,
};

const PAYMENT_METHODS: Record<string, string> = {
  "10": "Efectivo",
  "20": "Transferencia",
  "42": "Consignación",
  "47": "Tarjeta Débito",
  "48": "Tarjeta Crédito",
  "49": "Otro Electrónico",
  "1": "Contado",
  "2": "Crédito",
};

const TYPE_FIELDS: Record<string, FieldDef[]> = {
  customers: [
    { key: "identification", label: "Identificación" },
    { key: "dv", label: "DV" },
    { key: "names", label: "Nombres" },
    { key: "company", label: "Empresa" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Teléfono" },
    { key: "address", label: "Dirección", wide: true },
    { key: "created_at", label: "Creado", format: "date" },
  ],
  products: [
    { key: "code_reference", label: "Código Ref." },
    { key: "name", label: "Nombre", wide: true },
    { key: "price", label: "Precio", format: "currency" },
    { key: "tax_rate", label: "IVA", format: "uppercase" },
    { key: "unit_measure_id", label: "Unidad Medida" },
    { key: "is_excluded", label: "Exento" },
    { key: "note", label: "Nota", wide: true },
  ],
  invoices: [
    { key: "reference_code", label: "Referencia" },
    { key: "bill_number", label: "Número Factura" },
    { key: "status", label: "Estado", format: "status" },
    { key: "customer_name", label: "Cliente", wide: true },
    { key: "customer_identification", label: "ID Cliente" },
    { key: "total", label: "Total", format: "currency" },
    { key: "cufe", label: "CUFE", wide: true },
    {
      key: "payment_details",
      label: "Método de Pago",
      format: "payment",
      wide: true,
    },
    { key: "items", label: "Items", format: "items", wide: true },
    { key: "observation", label: "Observación", wide: true },
    { key: "created_at", label: "Emitido", format: "date" },
  ],
  credit_notes: [
    { key: "reference_code", label: "Referencia" },
    { key: "bill_number", label: "Número NC" },
    { key: "status", label: "Estado", format: "status" },
    { key: "customer_name", label: "Cliente", wide: true },
    { key: "total", label: "Total", format: "currency" },
    { key: "cufe", label: "CUFE", wide: true },
    {
      key: "payment_details",
      label: "Método de Pago",
      format: "payment",
      wide: true,
    },
    { key: "items", label: "Items", format: "items", wide: true },
    { key: "observation", label: "Observación", wide: true },
    { key: "created_at", label: "Creado", format: "date" },
  ],
  support_documents: [
    { key: "reference_code", label: "Referencia" },
    { key: "number", label: "Número DS" },
    { key: "status", label: "Estado", format: "status" },
    { key: "customer_name", label: "Proveedor", wide: true },
    { key: "total", label: "Total", format: "currency" },
    { key: "items", label: "Items", format: "items", wide: true },
    { key: "observation", label: "Observación", wide: true },
    { key: "created_at", label: "Creado", format: "date" },
  ],
  adjustment_notes: [
    { key: "reference_code", label: "Referencia" },
    { key: "number", label: "Número NA" },
    { key: "status", label: "Estado", format: "status" },
    { key: "customer_name", label: "Proveedor", wide: true },
    { key: "total", label: "Total", format: "currency" },
    { key: "items", label: "Items", format: "items", wide: true },
    { key: "observation", label: "Observación", wide: true },
    { key: "created_at", label: "Creado", format: "date" },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────

function extractString(val: unknown, fallback = "—"): string {
  if (val == null) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    return String(obj.name ?? obj.code ?? obj.value ?? JSON.stringify(val));
  }
  return String(val);
}

function parseDateSafe(value: string): Date | null {
  // Try native parsing first
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;

  // DD/MM/YYYY or D/M/YYYY (Latin American common format)
  const parts = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (parts) {
    const [, day, month, year, hh, mm, ss] = parts;
    const d2 = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hh ?? 0),
      Number(mm ?? 0),
      Number(ss ?? 0),
    );
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
}

function formatValue(val: unknown, fmt?: string): string {
  if (val == null || val === "") return "—";

  switch (fmt) {
    case "currency": {
      const n = Number(val);
      return isNaN(n) ? extractString(val) : `$${n.toLocaleString("es-CO")}`;
    }
    case "date": {
      const parsed = parseDateSafe(String(val));
      if (!parsed) return extractString(val);
      return parsed.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    case "uppercase":
      return String(val).toUpperCase();
    case "status":
      return String(val).toUpperCase();
    default:
      return extractString(val);
  }
}

function statusColor(status: string): string {
  const s = status.toUpperCase();
  if (s === "ACCEPTED" || s === "ACEPTADA")
    return "bg-factus-accent/15 text-factus-accent";
  if (s === "PENDIENTE" || s === "PENDING")
    return "bg-yellow-500/10 text-yellow-500";
  if (s === "REJECTED" || s === "RECHAZADA")
    return "bg-red-500/10 text-red-400";
  return "bg-surface-elevated text-content-tertiary";
}

function renderItems(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="mt-1 space-y-1">
      {items.map((item: Record<string, unknown>, i: number) => (
        <li
          key={i}
          className="flex items-center justify-between rounded-md bg-surface-elevated/40 px-2.5 py-1.5 text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-factus-primary/40" />
            <span className="truncate text-content-primary font-medium">
              {String(item.name ?? item.code_reference ?? "—")}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <span className="text-content-tertiary">
              x{String(item.quantity ?? "1")}
            </span>
            <span className="text-content-secondary font-mono">
              ${Number(item.price ?? 0).toLocaleString("es-CO")}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function getPaymentMethodLabel(pmt: Record<string, unknown>): string {
  // Try direct code (payment_method_code or metodo_pago)
  const code =
    pmt.payment_method_code ??
    pmt["metodo_pago"] ??
    null;
  if (code != null) {
    if (typeof code === "string" && PAYMENT_METHODS[code]) {
      return PAYMENT_METHODS[code];
    }
    if (typeof code === "object") {
      const obj = code as Record<string, unknown>;
      if (typeof obj.name === "string") return obj.name;
      if (typeof obj.code === "string" && PAYMENT_METHODS[obj.code]) {
        return PAYMENT_METHODS[obj.code];
      }
      return extractString(obj);
    }
    if (PAYMENT_METHODS[String(code)]) return PAYMENT_METHODS[String(code)];
    return `Código ${String(code)}`;
  }

  // Try payment_method (object: {code, name})
  const method = pmt.payment_method ?? null;
  if (method != null && typeof method === "object") {
    const obj = method as Record<string, unknown>;
    if (typeof obj.name === "string") return obj.name;
    if (typeof obj.code === "string" && PAYMENT_METHODS[obj.code]) {
      return PAYMENT_METHODS[obj.code];
    }
    return extractString(obj);
  }

  return "—";
}

function getPaymentFormLabel(pmt: Record<string, unknown>): string | null {
  const form = pmt.payment_form ?? null;
  if (form == null) return null;

  if (typeof form === "string") {
    if (form === "") return null;
    return PAYMENT_METHODS[form] ?? form;
  }

  if (typeof form === "object") {
    const obj = form as Record<string, unknown>;
    if (typeof obj.name === "string") return obj.name;
    if (typeof obj.code === "string" && PAYMENT_METHODS[obj.code]) {
      return PAYMENT_METHODS[obj.code];
    }
    return extractString(obj);
  }

  return String(form);
}

function renderPaymentDetails(payments: unknown) {
  if (!Array.isArray(payments) || payments.length === 0) return null;
  return (
    <ul className="mt-1 space-y-1">
      {payments.map((pmt: Record<string, unknown>, i: number) => {
        const methodLabel = getPaymentMethodLabel(pmt);
        const formLabel = getPaymentFormLabel(pmt);
        const amount =
          pmt.amount ?? pmt["valor"] ?? pmt["total"] ?? null;

        return (
          <li
            key={i}
            className="flex items-center justify-between rounded-md bg-surface-elevated/40 px-2.5 py-1.5 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-factus-accent/60" />
              <span className="text-content-primary font-medium">
                {methodLabel}
              </span>
              {formLabel && (
                <span className="text-content-tertiary">({formLabel})</span>
              )}
            </div>
            <span className="font-mono text-content-secondary">
              ${Number(amount ?? 0).toLocaleString("es-CO")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Component ────────────────────────────────────────────────────────────

export function RecordModal({ open, onClose, record, type }: RecordModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const fields = TYPE_FIELDS[type] ?? [];
  const isDoc = DOC_TYPES.has(type);
  const typeLabel = TYPE_LABEL[type] ?? "Registro";
  const Icon = TYPE_ICON[type] ?? Receipt;

  // ── PDF Download ───────────────────────────────────────────────────
  const handleDownloadPdf = useCallback(async () => {
    if (!record || downloading) return;

    // Resolve the number field for this doc type
    const numberKey =
      type === "invoices" || type === "credit_notes" ? "bill_number" : "number";
    const docNumber = record[numberKey];
    if (!docNumber || docNumber === "") return;

    // Map plural type → singular MCP type
    const typeMap: Record<string, string> = {
      invoices: "invoice",
      credit_notes: "credit_note",
      support_documents: "support_document",
      adjustment_notes: "adjustment_note",
    };

    setDownloading(true);
    setDlError(null);

    try {
      const res = await fetch(
        `/api/download-pdf?type=${encodeURIComponent(typeMap[type])}&number=${encodeURIComponent(String(docNumber))}`,
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDlError(err instanceof Error ? err.message : String(err));
    } finally {
      setDownloading(false);
    }
  }, [record, type, downloading]);

  if (!open || !record) return null;

  const statusVal = record.status ? String(record.status) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-2xl border border-line-default bg-surface-panel shadow-2xl shadow-black/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-line-default px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-factus-primary/15">
              <Icon className="h-4 w-4 text-factus-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-content-primary">
                Detalle de {typeLabel}
              </h3>
              {statusVal && (
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mt-0.5",
                    statusColor(statusVal),
                  )}
                >
                  {statusVal}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-overlay-hover hover:text-content-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="scrollbar-custom max-h-[60vh] overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((field) => {
              const val = record[field.key];
              if (val == null || val === "" || val === false) return null;

              // ── Special formats (arrays / complex) ──────────
              if (field.format === "items") {
                if (!Array.isArray(val) || val.length === 0) return null;
                return (
                  <div key={field.key} className="col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-content-tertiary/70 mb-1">
                      {field.label} ({(val as unknown[]).length})
                    </p>
                    {renderItems(val)}
                  </div>
                );
              }

              if (field.format === "payment") {
                return (
                  <div key={field.key} className="col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-content-tertiary/70 mb-1">
                      {field.label}
                    </p>
                    {renderPaymentDetails(val)}
                  </div>
                );
              }

              // ── Standard fields ─────────────────────────────
              return (
                <div
                  key={field.key}
                  className={cn(field.wide ? "col-span-2" : "col-span-1")}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-content-tertiary/70">
                    {field.label}
                  </p>
                  {field.format === "status" ? (
                    <span
                      className={cn(
                        "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        statusColor(formatValue(val, field.format)),
                      )}
                    >
                      {formatValue(val, field.format)}
                    </span>
                  ) : (
                    <p className="mt-0.5 font-mono text-xs text-content-primary break-words">
                      {formatValue(val, field.format)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-line-default px-5 py-3">
          <div className="text-[10px] text-content-tertiary/60">
            {(type === "invoices" || type === "credit_notes") &&
            record.bill_number
              ? `Nro: ${record.bill_number}`
              : record.number
                ? `Nro: ${record.number}`
                : record.reference_code
                  ? `Ref: ${record.reference_code}`
                  : " "}
          </div>
          <div className="flex items-center gap-2">
            {dlError && (
              <span
                className="max-w-[200px] truncate text-[10px] text-red-400"
                title={dlError}
              >
                {dlError}
              </span>
            )}
            {isDoc && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-lg bg-factus-primary/10 px-3 py-1.5 text-xs font-medium text-factus-primary transition-colors hover:bg-factus-primary/20 disabled:opacity-40"
              >
                {downloading ? (
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                {downloading ? "Descargando..." : "Descargar PDF"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
