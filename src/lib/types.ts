// Shared Factus-related types

export interface Customer {
  id: number;
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

export interface Product {
  id: number;
  code_reference: string;
  name: string;
  price: number;
  tax_rate: string;
  unit_measure_id: number;
  standard_code_id: number;
  tribute_id: number;
  is_excluded: boolean;
  note?: string | null;
}

export interface InvoiceItemInput {
  code_reference: string;
  name: string;
  quantity: number;
  price: number | string;
  tax_rate: string;
  unit_measure_id: number;
  standard_code_id: number;
  tribute_id: number;
  is_excluded?: boolean;
  discount_rate?: number | string | null;
  note?: string | null;
}

export interface PaymentDetail {
  payment_method_code: string;
  amount: string;
  due_date?: string | null;
  payment_form?: string;
  reference_code?: string | null;
}

export interface AllowanceCharge {
  concept_type: string;
  is_surcharge: boolean;
  reason: string;
  base_amount: number | string;
  amount: number | string;
}

export interface NumberingRange {
  id: number;
  prefix: string;
  from_number: number;
  to_number: number;
  resolution_number: string;
  document_type_id: string;
  is_active: boolean;
  current_number?: number | null;
}

export interface Invoice {
  id?: number;
  reference_code: string;
  bill_number?: string;
  status?: string;
  customer_id?: number;
  total?: number;
  created_at?: string;
  cufe?: string;
}

export interface CreditNote {
  id?: number;
  reference_code: string;
  bill_number?: string;
  status?: string;
  invoice_number?: string;
  total?: number;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: string;
  }>;
}
