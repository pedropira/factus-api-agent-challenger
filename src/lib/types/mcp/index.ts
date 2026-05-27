// MCP Schemas — tipos simplificados que expone el factus-mcp-server
// DIFIEREN de los API raw en:
//   - price: CON IVA incluido (bruto), NO neto
//   - tax_rate: flat string en vez de array taxes[]
//   - quantity: number (integer) en vez de string
//   - IDs: locales (_id) en vez de códigos DIAN (_code)

import type {
  ApiPaymentDetail,
  ApiAllowanceCharge,
} from "../api/common";
import type { CreateInvoicePayload } from "../api/invoice";
import type { CreateCreditNotePayload } from "../api/credit-note";
import type { CreateSupportDocumentPayload } from "../api/support-document";
import type { CreateAdjustmentNotePayload } from "../api/adjustment-note";
import type { InvoiceResponse } from "../api/invoice";
import type { CreditNoteResponse } from "../api/credit-note";
import type { SupportDocumentResponse } from "../api/support-document";
import type { AdjustmentNoteResponse } from "../api/adjustment-note";

// ── Customer (MCP simplificado) ──────────────────────────────────────────

export interface McpCustomerInput {
  identification_document_id: number;
  identification: string;
  dv?: string | null;
  company?: string | null;
  trade_name?: string | null;
  names?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  legal_organization_id?: string | null;
  tribute_id?: string | null;
  municipality_id?: string | null;
}

// ── Item (MCP: price CON IVA, tax_rate flat) ────────────────────────────

export interface McpInvoiceItemInput {
  code_reference: string;
  name: string;
  quantity: number;        // integer — MCP acepta number
  price: number | string;  // CON IVA incluido (difiere de API)
  tax_rate: string;        // flat "19.00" (difiere de API taxes[])
  unit_measure_id: number;
  standard_code_id: number;
  tribute_id: number;
  is_excluded?: boolean;
  discount_rate?: number | string | null;
  note?: string | null;
}

// ── Payment Detail (MCP) ─────────────────────────────────────────────────

export type McpPaymentDetailInput = ApiPaymentDetail;

// ── Allowance Charge (MCP) ──────────────────────────────────────────────

export type McpAllowanceChargeInput = ApiAllowanceCharge;

// ── Document inputs (MCP) ───────────────────────────────────────────────

export interface McpCreateInvoiceInput {
  reference_code: string;
  observation?: string | null;
  send_email?: boolean;
  payment_details: McpPaymentDetailInput[];
  items: McpInvoiceItemInput[];
  allowance_charges?: McpAllowanceChargeInput[];
  customer_id: number;
  numbering_range_id: number;
  establishment_id?: number | null;
}

export interface McpCreateCreditNoteInput {
  reference_code: string;
  correction_concept_code: string;
  bill_number: string;
  numbering_range_id: number;
  observation?: string | null;
  send_email?: boolean;
  payment_details: McpPaymentDetailInput[];
  customer: McpCustomerInput;
  items: McpInvoiceItemInput[];
}

export interface McpCreateSupportDocumentInput {
  reference_code: string;
  observation?: string | null;
  send_email?: boolean;
  payment_details: McpPaymentDetailInput[];
  provider: McpCustomerInput;
  items: McpInvoiceItemInput[];
}

export interface McpCreateAdjustmentNoteInput {
  reference_code: string;
  support_document_number: string;
  correction_concept_code: string;
  observation?: string | null;
  payment_details: McpPaymentDetailInput[];
  provider: McpCustomerInput;
  items: McpInvoiceItemInput[];
}

// ── Re-exports para backward compat ─────────────────────────────────────

export type {
  CreateInvoicePayload,
  InvoiceResponse,
  CreateCreditNotePayload,
  CreditNoteResponse,
  CreateSupportDocumentPayload,
  CreateAdjustmentNotePayload,
  SupportDocumentResponse,
  AdjustmentNoteResponse,
};
