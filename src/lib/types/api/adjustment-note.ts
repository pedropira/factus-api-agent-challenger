// API Adjustment Note types — raw Factus POST /v2/adjustment-notes/validate
// DIFERENCIA CLAVE: support_document_number referencia al DS, usa provider

import type {
  ApiTax,
  ApiPaymentDetail,
  ApiEstablishment,
} from "./common";
import type { ApiProvider } from "./support-document";

/** Ítem de nota de ajuste (solo IVA code "01") */
export interface ApiAdjustmentNoteItem {
  code_reference: string;
  name: string;
  quantity: string;
  discount_rate: string;
  price: string;
  unit_measure_code: string;
  standard_code: string;
  taxes: ApiTax[];          // solo code "01"
  note?: string | null;
}

/** Payload de creación de nota de ajuste */
export interface CreateAdjustmentNotePayload {
  reference_code: string;
  created_time?: string;
  numbering_range_id?: number;
  support_document_number: string; // número del DS que referencia
  correction_concept_code: string;
  observation?: string | null;
  payment_details: ApiPaymentDetail[];
  cash_rounding_amount?: string;
  provider: ApiProvider;
  items: ApiAdjustmentNoteItem[];
  establishment?: ApiEstablishment;
}

/** Respuesta de creación/listado de nota de ajuste */
export interface AdjustmentNoteResponse {
  id?: number;
  reference_code: string;
  number?: string;
  status?: string;
  support_document_number?: string;
  total?: number;
  created_at?: string;
}
