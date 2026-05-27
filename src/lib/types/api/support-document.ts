// API Support Document types — raw Factus POST /v2/support-documents/validate
// DIFERENCIA CLAVE: usa provider en lugar de customer, NO tiene allowance_charges

import type {
  ApiTax,
  ApiWithholdingTax,
  ApiPaymentDetail,
  ApiEstablishment,
} from "./common";

/** Proveedor en formato Factus API (para DS y NA) */
export interface ApiProvider {
  identification_document_code: string;
  identification: string;
  dv?: string | null;
  trade_name?: string | null;
  names: string;              // obligatorio en DS
  address: string;            // obligatorio en DS
  country_code: string;       // código país
  municipality_code: string;  // código DIAN
  email?: string | null;
  phone?: string | null;
}

/** Ítem de documento soporte */
export interface ApiSupportDocumentItem {
  code_reference: string;
  name: string;
  quantity: string;
  discount_rate: string;
  price: string;           // SIN impuestos
  unit_measure_code: string;
  standard_code: string;
  taxes: ApiTax[];          // solo code "01" (IVA)
  withholding_taxes?: ApiWithholdingTax[]; // retenciones AL PROVEEDOR
  note?: string | null;
}

/** Payload de creación de documento soporte */
export interface CreateSupportDocumentPayload {
  reference_code: string;
  numbering_range_id?: number;
  created_time?: string;
  observation?: string | null;
  payment_details: ApiPaymentDetail[];
  cash_rounding_amount?: string;
  provider: ApiProvider;
  items: ApiSupportDocumentItem[];
  establishment?: ApiEstablishment;
}

/** Respuesta de creación/listado de documento soporte */
export interface SupportDocumentResponse {
  id?: number;
  reference_code: string;
  number?: string;          // asignado por Factus
  status?: string;
  total?: number;
  cufe?: string;
  created_at?: string;
}
