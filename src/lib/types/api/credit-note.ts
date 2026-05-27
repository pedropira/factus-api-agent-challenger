// API Credit Note types — raw Factus POST /v2/credit-notes/validate
// DIFERENCIA CLAVE: bill_id es el ID INTERNO de Factus, NO bill_number

import type {
  ApiTax,
  ApiWithholdingTax,
  ApiPaymentDetail,
  ApiAllowanceCharge,
  ApiEstablishment,
  ApiBillingPeriod,
} from "./common";
import type { ApiInvoiceCustomer } from "./invoice";

/** Información de salud (sector salud, opcional) */
export interface ApiHealthInfo {
  type?: string;
  contract_code?: string;
  authorization_code?: string;
  provider_code?: string;
  provider_name?: string;
}

/** Ítem de nota crédito en formato API */
export interface ApiCreditNoteItem {
  code_reference: string;
  name: string;
  quantity: string;
  discount_rate: string;
  price: string;           // SIN impuestos
  unit_measure_code: string;
  standard_code: string;
  taxes: ApiTax[];
  withholding_taxes?: ApiWithholdingTax[];
  note?: string | null;
  additional_properties?: Record<string, unknown>; // para transporte
}

/** Payload de creación de nota crédito */
export interface CreateCreditNotePayload {
  reference_code: string;
  correction_concept_code: string; // "1"=devolución, "2"=anulación, etc.
  customization_id?: string;       // "20" por defecto
  bill_id?: number;                // ID interno de Factus (opcional si se envía customer)
  numbering_range_id?: number;
  observation?: string | null;
  payment_details: ApiPaymentDetail[];
  customer?: ApiInvoiceCustomer;   // puede omitirse si se envía bill_id
  items: ApiCreditNoteItem[];
  allowance_charges?: ApiAllowanceCharge[];
  health?: ApiHealthInfo;
  establishment?: ApiEstablishment;
  billing_period?: ApiBillingPeriod;
}

/** Respuesta de creación/listado de nota crédito */
export interface CreditNoteResponse {
  id?: number;
  reference_code: string;
  bill_number?: string;
  status?: string;
  invoice_number?: string;  // factura que referencia
  total?: number;
  cufe?: string;
  created_at?: string;
}
