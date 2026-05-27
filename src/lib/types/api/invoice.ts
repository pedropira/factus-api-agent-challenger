// API Invoice types — raw Factus POST /v2/bills/validate
// DIFERENCIA CLAVE: price es SIN IVA (neto), taxes es array

import type {
  ApiAddress,
  ApiTax,
  ApiWithholdingTax,
  ApiPaymentDetail,
  ApiAllowanceCharge,
  ApiEstablishment,
  ApiBillingPeriod,
  ApiOrderReference,
  ApiRelatedDocument,
} from "./common";

/** Cliente en formato Factus API */
export interface ApiInvoiceCustomer {
  identification_document_code: string; // "CC", "NIT", etc.
  identification: string;
  dv?: string | null;           // dígito verificación (requerido si NIT)
  legal_organization_code: string;
  tribute_code?: string;        // por defecto "ZZ"
  company?: string | null;      // razón social
  trade_name?: string | null;
  names?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  municipality_code?: string | null;
}

/** Ítem de factura en formato API (price SIN IVA) */
export interface ApiInvoiceItem {
  code_reference: string;
  name: string;
  quantity: string;        // "2.00" — string con 2 decimales
  discount_rate: string;   // "0.00" (requerido, puede ser "0")
  price: string;           // SIN impuestos incluidos (neto)
  unit_measure_code: string;
  standard_code: string;
  taxes: ApiTax[];
  withholding_taxes?: ApiWithholdingTax[];
  note?: string | null;
}

/** Payload de creación de factura (API raw) */
export interface CreateInvoicePayload {
  reference_code: string;
  document?: string;           // "01"=factura electrónica
  numbering_range_id?: number;
  operation_type?: string;     // "10"=estándar
  send_email?: boolean;
  observation?: string | null;
  prepayment_details?: ApiPaymentDetail[];
  payment_details: ApiPaymentDetail[];
  cash_rounding_amount?: string;
  customer: ApiInvoiceCustomer;
  items: ApiInvoiceItem[];
  allowance_charges?: ApiAllowanceCharge[];
  establishment?: ApiEstablishment;
  billing_period?: ApiBillingPeriod;
  order_reference?: ApiOrderReference;
  related_documents?: ApiRelatedDocument[];
}

/** Respuesta de creación/listado de factura */
export interface InvoiceResponse {
  id?: number;
  reference_code: string;
  bill_number?: string;       // asignado por Factus (prefijo+consecutivo)
  status?: string;
  customer_id?: number;
  total?: number;
  cufe?: string;
  qr_code?: string;
  pdf_url?: string;
  xml_url?: string;
  created_at?: string;
}
