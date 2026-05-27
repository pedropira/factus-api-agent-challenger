// Shared API types — raw Factus API V2 format
// These map 1:1 to developers.factus.com.co field definitions

/** Dirección con código de municipio DIAN */
export interface ApiAddress {
  address: string;
  municipality_code: string; // código DIAN ej: "11001"
}

/** Impuesto IVA/INC por ítem */
export interface ApiTax {
  code: string;       // "01"=IVA, "02"=INC, "03"=IVA+INC
  rate: string;       // "19.00"
  is_excluded?: boolean;
  is_reduce?: boolean;
}

/** Retención en la fuente por ítem */
export interface ApiWithholdingTax {
  code: string;       // código de retención
  rate: string;       // porcentaje
  amount?: string;    // valor calculado
}

/** Detalle de pago */
export interface ApiPaymentDetail {
  payment_method_code: string; // "10"=efectivo, "20"=transferencia
  amount: string;              // valor del pago
  payment_form?: string;       // "1"=contado, "2"=crédito
  due_date?: string | null;    // YYYY-MM-DD, requerido si crédito
  reference_code?: string | null;
}

/** Descuento/recargo global a nivel documento */
export interface ApiAllowanceCharge {
  concept_type: string;  // código tipo descuento/recargo
  is_surcharge: boolean;  // true=recargo, false=descuento
  reason: string;         // razón (max 500)
  base_amount: string;    // base de cálculo
  amount: string;         // valor monetario
}

/** Establecimiento (sucursal del emisor) */
export interface ApiEstablishment {
  id?: number;
  name: string;
  address: string;
  phone_number?: string | null;
  email?: string | null;
  municipality_id: string;
}

/** Período de facturación */
export interface ApiBillingPeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

/** Referencia a orden de compra */
export interface ApiOrderReference {
  order_number: string;
  issue_date?: string; // YYYY-MM-DD
}

/** Documento relacionado (para notas de ajuste, etc.) */
export interface ApiRelatedDocument {
  number: string;
  issue_date?: string;
  document_type_code?: string; // "01"=factura, "03"=DS, "04"=NA
}
