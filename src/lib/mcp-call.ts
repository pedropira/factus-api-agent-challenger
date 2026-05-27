// Raw JSON-RPC call helpers — wrappers tipados sobre callMcpTool
// Útiles para llamadas directas al MCP sin pasar por streamText

import { callMcpTool } from "./mcp-client";
import type {
  CreateInvoicePayload,
  InvoiceResponse,
} from "./types/api/invoice";
import type {
  CreateCreditNotePayload,
  CreditNoteResponse,
} from "./types/api/credit-note";
import type {
  CreateSupportDocumentPayload,
  SupportDocumentResponse,
} from "./types/api/support-document";
import type {
  CreateAdjustmentNotePayload,
  AdjustmentNoteResponse,
} from "./types/api/adjustment-note";

// ── Customers ───────────────────────────────────────────────────────────

export async function mcpCreateCustomer(
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return callMcpTool("create_customer", params);
}

export async function mcpSearchCustomers(
  query: string,
  limit = 20
): Promise<Record<string, unknown>[]> {
  const result = await callMcpTool<{ customers?: Record<string, unknown>[] }>(
    "search_customers",
    { query, limit }
  );
  return result.customers ?? [];
}

export async function mcpGetCustomer(
  id: number
): Promise<Record<string, unknown>> {
  return callMcpTool("get_customer", { id });
}

// ── Products ────────────────────────────────────────────────────────────

export async function mcpCreateProduct(
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return callMcpTool("create_product", params);
}

export async function mcpSearchProducts(
  query: string,
  limit = 20
): Promise<Record<string, unknown>[]> {
  const result = await callMcpTool<{ products?: Record<string, unknown>[] }>(
    "search_products",
    { query, limit }
  );
  return result.products ?? [];
}

export async function mcpGetProductByCode(
  code_reference: string
): Promise<Record<string, unknown>> {
  return callMcpTool("get_product_by_code", { code_reference });
}

// ── Invoices ────────────────────────────────────────────────────────────

export async function mcpCreateInvoice(
  payload: CreateInvoicePayload
): Promise<InvoiceResponse> {
  return callMcpTool<InvoiceResponse>("create_invoice", {
    params: payload,
  });
}

export async function mcpCreateInvoiceWithNumbering(
  params: Record<string, unknown>
): Promise<InvoiceResponse> {
  return callMcpTool<InvoiceResponse>(
    "create_invoice_with_numbering",
    params
  );
}

export async function mcpListInvoices(
  filters?: Record<string, unknown>
): Promise<InvoiceResponse[]> {
  const result = await callMcpTool<{ invoices?: InvoiceResponse[] }>(
    "list_invoices",
    filters ?? {}
  );
  return result.invoices ?? [];
}

export async function mcpGetInvoiceByReference(
  reference_code: string
): Promise<InvoiceResponse> {
  return callMcpTool("get_invoice_by_reference", { reference_code });
}

export async function mcpGetInvoiceByNumber(
  number: string
): Promise<InvoiceResponse> {
  return callMcpTool<InvoiceResponse>("get_invoice_by_number", { number });
}

// ── Credit Notes ────────────────────────────────────────────────────────

export async function mcpCreateCreditNote(
  payload: CreateCreditNotePayload
): Promise<CreditNoteResponse> {
  return callMcpTool<CreditNoteResponse>("create_credit_note", {
    params: payload,
  });
}

export async function mcpListCreditNotes(
  filters?: Record<string, unknown>
): Promise<CreditNoteResponse[]> {
  const result = await callMcpTool<{ credit_notes?: CreditNoteResponse[] }>(
    "list_credit_notes",
    filters ?? {}
  );
  return result.credit_notes ?? [];
}

export async function mcpGetCreditNote(
  factus_id: string
): Promise<CreditNoteResponse> {
  return callMcpTool<CreditNoteResponse>("get_credit_note", { factus_id });
}

// ── Support Documents ───────────────────────────────────────────────────

export async function mcpCreateSupportDocument(
  payload: CreateSupportDocumentPayload
): Promise<SupportDocumentResponse> {
  return callMcpTool<SupportDocumentResponse>("create_support_document", {
    params: payload,
  });
}

export async function mcpListSupportDocuments(
  filters?: Record<string, unknown>
): Promise<SupportDocumentResponse[]> {
  const result = await callMcpTool<{ support_documents?: SupportDocumentResponse[] }>(
    "list_support_documents",
    filters ?? {}
  );
  return result.support_documents ?? [];
}

export async function mcpGetSupportDocument(
  number: string
): Promise<SupportDocumentResponse> {
  return callMcpTool<SupportDocumentResponse>("get_support_document", { number });
}

// ── Adjustment Notes ────────────────────────────────────────────────────

export async function mcpCreateAdjustmentNote(
  payload: CreateAdjustmentNotePayload
): Promise<AdjustmentNoteResponse> {
  return callMcpTool<AdjustmentNoteResponse>("create_adjustment_note", {
    params: payload,
  });
}

export async function mcpListAdjustmentNotes(
  filters?: Record<string, unknown>
): Promise<AdjustmentNoteResponse[]> {
  const result = await callMcpTool<{ adjustment_notes?: AdjustmentNoteResponse[] }>(
    "list_adjustment_notes",
    filters ?? {}
  );
  return result.adjustment_notes ?? [];
}

export async function mcpGetAdjustmentNote(
  number: string
): Promise<AdjustmentNoteResponse> {
  return callMcpTool<AdjustmentNoteResponse>("get_adjustment_note", { number });
}

// ── Numbering Ranges ────────────────────────────────────────────────────

export async function mcpGetActiveNumberingRanges(
  document_type_id?: string
): Promise<Record<string, unknown>[]> {
  const result = await callMcpTool<{
    numbering_ranges?: Record<string, unknown>[];
  }>("get_active_numbering_ranges", { document_type_id });
  return result.numbering_ranges ?? [];
}

export async function mcpGetDefaultNumberingRange(
  document_type_id: string
): Promise<Record<string, unknown>> {
  return callMcpTool("get_default_numbering_range", { document_type_id });
}

// ── Company / Establishments ────────────────────────────────────────────

export async function mcpGetCompanyInfo(): Promise<Record<string, unknown>> {
  return callMcpTool("get_company_info", {});
}

export async function mcpListEstablishments(): Promise<
  Record<string, unknown>[]
> {
  const result = await callMcpTool<{
    establishments?: Record<string, unknown>[];
  }>("list_establishments", {});
  return result.establishments ?? [];
}

export async function mcpGetEstablishment(
  id: number
): Promise<Record<string, unknown>> {
  return callMcpTool("get_establishment", { id });
}

export async function mcpCreateEstablishment(
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return callMcpTool("create_establishment", params);
}

export async function mcpUpdateEstablishment(
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return callMcpTool("update_establishment", params);
}

export async function mcpDeleteEstablishment(
  id: number
): Promise<Record<string, unknown>> {
  return callMcpTool("delete_establishment", { id });
}
