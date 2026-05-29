// Tool definitions for Vercel AI SDK — 1:1 mapping with MCP tools
// Used with streamText({ tools: mcpTools })

import { tool } from "ai";
import { z } from "zod";
import { callMcpTool } from "./mcp-client";

// Typed helper: force OUTPUT to a Record<string, unknown>
// so that tool() infers the correct type (not never) and doesn't fail overload resolution
async function execMcpTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  return callMcpTool(name, args);
}

// ── Customer Tools ──────────────────────────────────────────────────────

export const createCustomerTool = tool({
  description: "Create a new customer (buyer/adquiriente) in the local DB and mirror to Factus",
  inputSchema: z.object({
    identification_document_id: z.number().describe("Document type ID (e.g. 1 = NIT, 2 = CC, 3 = CE, etc.)"),
    identification: z.string().max(50).describe("Identification document number"),
    dv: z.string().max(2).nullish().describe("Verification digit (required only if identification document is NIT)"),
    company: z.string().max(200).nullish().describe("Business name / corporate name (for legal entities/companies)"),
    trade_name: z.string().max(200).nullish().describe("Trade name / commercial name"),
    names: z.string().max(200).nullish().describe("First and last names (for individuals/natural persons)"),
    address: z.string().max(200).nullish().describe("Physical address"),
    email: z.string().max(200).nullish().describe("Email address for invoicing"),
    phone: z.string().max(50).nullish().describe("Contact phone number"),
    legal_organization_id: z.string().max(5).nullish().describe("Legal organization ID code"),
    tribute_id: z.string().max(5).nullish().describe("Tribute ID code"),
    municipality_id: z.string().max(10).nullish().describe("DIAN municipality code (e.g. 11001 for Bogotá, 05001 for Medellín)"),
  }),
  execute: async (params) => execMcpTool("create_customer", params),
});

export const searchCustomersTool = tool({
  description: "Search existing customers by identification document, name, company name, or email. ALWAYS use this before creating an invoice to find the customer's ID.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query text (name, identification number, company name, or email)"),
    limit: z.number().min(1).max(100).default(20).describe("Maximum number of records to return"),
  }),
  execute: async ({ query, limit }) =>
    execMcpTool("search_customers", { query, limit }),
});

export const getCustomerTool = tool({
  description: "Get full details of a customer by their local database ID",
  inputSchema: z.object({
    id: z.number().describe("Customer local database ID"),
  }),
  execute: async ({ id }) => execMcpTool("get_customer", { id }),
});

// ── Product Tools ───────────────────────────────────────────────────────

export const createProductTool = tool({
  description: "Create a new product or service in the catalog. Price must INCLUDE VAT (gross price). Use after confirming details with the user.",
  inputSchema: z.object({
    code_reference: z.string().max(100).describe("Unique product reference code"),
    name: z.string().max(300).describe("Product/service name"),
    price: z.union([z.number(), z.string()]).describe("Unit price WITH VAT included (gross value)"),
    tax_rate: z.string().max(10).describe("VAT tax rate percentage (e.g., '19.00', '5.00', '0.00')"),
    unit_measure_id: z.number().describe("Unit of measure ID (e.g. 70 = Unit)"),
    standard_code_id: z.number().describe("Standard product scheme ID (1 = custom/company code, 2 = UNSPSC)"),
    tribute_id: z.number().describe("Tribute ID (1 = IVA/VAT, 2 = INC/Consumption tax)"),
    is_excluded: z.boolean().default(false).describe("True if product is tax-excluded, false otherwise"),
    note: z.string().max(500).nullish().describe("Optional product note or description"),
  }),
  execute: async (params) => execMcpTool("create_product", params),
});

export const searchProductsTool = tool({
  description: "Search existing products in the catalog by name or reference code. Try get_product_by_code first if you have the exact code.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query text (name or code reference)"),
    limit: z.number().min(1).max(100).default(20).describe("Maximum number of records to return"),
  }),
  execute: async ({ query, limit }) =>
    execMcpTool("search_products", { query, limit }),
});

export const getProductByCodeTool = tool({
  description: "Get full product details by its exact reference code. Use when the user provides a specific code.",
  inputSchema: z.object({
    code_reference: z.string().describe("Exact product reference code"),
  }),
  execute: async ({ code_reference }) =>
    execMcpTool("get_product_by_code", { code_reference }),
});

// ── Invoice Tools ───────────────────────────────────────────────────────

export const createInvoiceTool = tool({
  description: "Create an electronic invoice via Factus API. Requires manual numbering_range_id. For standard Colombian auto-numbering, use create_invoice_with_numbering instead.",
  inputSchema: z.object({
    reference_code: z.string().max(100).describe("Unique custom invoice reference code"),
    document: z.string().default("01").describe("Document type code (01 = Invoice)"),
    operation_type: z.string().default("10").describe("Operation type code (10 = Standard Sale)"),
    observation: z.string().max(250).nullish().describe("Optional invoice comments or observations"),
    send_email: z.boolean().default(false).describe("Set true to automatically email the invoice to the customer"),
    payment_details: z.array(z.object({
      payment_method_code: z.string().describe("Payment method code (e.g. '1' = Cash, '10' = Bank Transfer)"),
      amount: z.string().describe("Total paid amount for this payment method"),
      due_date: z.string().nullish().describe("Due date for credit payments (YYYY-MM-DD)"),
      payment_form: z.string().default("1").describe("Payment form: '1' = Cash/Immediate, '2' = Credit"),
      reference_code: z.string().nullish().describe("Optional payment transaction reference code"),
    })),
    customer: z.record(z.unknown()).describe("Complete customer details payload"),
    items: z.array(z.object({
      code_reference: z.string().describe("Product reference code"),
      name: z.string().describe("Product name"),
      quantity: z.number().positive().describe("Quantity of items"),
      price: z.union([z.number(), z.string()]).describe("Unit price WITH VAT included (gross value)"),
      tax_rate: z.string().describe("VAT tax rate percentage (e.g. '19.00')"),
      unit_measure_id: z.number().describe("Unit of measure ID"),
      standard_code_id: z.number().describe("Standard product code ID"),
      tribute_id: z.number().describe("Tribute ID"),
      is_excluded: z.boolean().default(false).describe("True if item is tax-excluded"),
      discount_rate: z.union([z.number(), z.string()]).nullish().describe("Optional discount rate percentage"),
      note: z.string().nullish().describe("Optional item note"),
    })),
    allowance_charges: z.array(z.object({
      concept_type: z.string().describe("Allowance/charge concept type"),
      is_surcharge: z.boolean().describe("True if it is a surcharge, false if it is a discount"),
      reason: z.string().describe("Reason description"),
      base_amount: z.union([z.number(), z.string()]).describe("Base amount on which it is calculated"),
      amount: z.union([z.number(), z.string()]).describe("Total amount of allowance/charge"),
    })).nullish().describe("Optional general invoice allowances or surcharges"),
  }),
  execute: async (params) => execMcpTool("create_invoice", params),
});

export const createInvoiceWithNumberingTool = tool({
  description: "Create an invoice with Colombian auto-numbering (full DIAN flow). ALWAYS get numbering_range_id via get_default_numbering_range first. Preferred over create_invoice.",
  inputSchema: z.object({
    reference_code: z.string().max(100).describe("Unique custom invoice reference code"),
    observation: z.string().max(250).nullish().describe("Optional invoice comments or observations"),
    send_email: z.boolean().default(false).describe("Set true to automatically email the invoice to the customer"),
    payment_details: z.array(z.object({
      payment_method_code: z.string().describe("Payment method code (e.g. '1' = Cash, '10' = Bank Transfer)"),
      amount: z.string().describe("Total paid amount for this payment method"),
      due_date: z.string().nullish().describe("Due date for credit payments (YYYY-MM-DD)"),
      payment_form: z.string().default("1").describe("Payment form: '1' = Cash/Immediate, '2' = Credit"),
      reference_code: z.string().nullish().describe("Optional payment transaction reference code"),
    })),
    items: z.array(z.object({
      code_reference: z.string().describe("Product reference code"),
      name: z.string().describe("Product name"),
      quantity: z.number().positive().describe("Quantity of items"),
      price: z.union([z.number(), z.string()]).describe("Unit price WITH VAT included (gross value)"),
      tax_rate: z.string().describe("VAT tax rate percentage (e.g. '19.00')"),
      unit_measure_id: z.number().describe("Unit of measure ID"),
      standard_code_id: z.number().describe("Standard product code ID"),
      tribute_id: z.number().describe("Tribute ID"),
      is_excluded: z.boolean().default(false).describe("True if item is tax-excluded"),
      discount_rate: z.union([z.number(), z.string()]).nullish().describe("Optional discount rate percentage"),
      note: z.string().nullish().describe("Optional item note"),
    })),
    allowance_charges: z.array(z.object({
      concept_type: z.string().describe("Concept type"),
      is_surcharge: z.boolean().describe("True if surcharge, false if discount"),
      reason: z.string().describe("Reason for charge or discount"),
      base_amount: z.union([z.number(), z.string()]).describe("Base amount for calculations"),
      amount: z.union([z.number(), z.string()]).describe("Total charge or discount amount"),
    })).nullish().describe("Optional general invoice allowances or surcharges"),
    customer_id: z.number().describe("Local database ID of the customer (retrieved via search_customers/get_customer)"),
    numbering_range_id: z.number().describe("Local database ID of the numbering range (retrieved via get_default_numbering_range)"),
    establishment_id: z.number().nullish().describe("Optional establishment ID"),
  }),
  execute: async (params) =>
    execMcpTool("create_invoice_with_numbering", params),
});

export const listInvoicesTool = tool({
  description: "List electronic invoices with optional filtering. Used by the dashboard to show recent sales.",
  inputSchema: z.object({
    status: z.string().nullish().describe("Filter by status"),
    reference_code: z.string().nullish().describe("Filter by custom reference code"),
    offset: z.number().min(0).default(0).describe("Pagination offset"),
    limit: z.number().min(1).max(100).default(20).describe("Pagination limit"),
  }),
  execute: async (params) => execMcpTool("list_invoices", params),
});

export const getInvoiceByNumberTool = tool({
  description: "Get full details of a validated electronic invoice by its Factus-assigned invoice number (e.g., 'SETP990003793').",
  inputSchema: z.object({
    number: z.string().describe("Factus electronic invoice number (e.g. SETP990003793)"),
  }),
  execute: async ({ number }) =>
    execMcpTool("get_invoice_by_number", { number }),
});

export const getInvoiceByReferenceTool = tool({
  description: "Get electronic invoice details by its custom reference code.",
  inputSchema: z.object({
    reference_code: z.string().describe("Custom reference code of the invoice"),
  }),
  execute: async ({ reference_code }) =>
    execMcpTool("get_invoice_by_reference", { reference_code }),
});

// ── Credit Note Tools ───────────────────────────────────────────────────

export const createCreditNoteTool = tool({
  description: "Create an electronic credit note referencing a validated invoice. Confirm the invoice bill_number and reason with the user first.",
  inputSchema: z.object({
    reference_code: z.string().max(100).describe("Unique custom reference code for the credit note"),
    correction_concept_code: z.string().describe("Credit note correction concept: '1' = Return of goods, '2' = Cancellation"),
    bill_number: z.string().describe("Invoice number being corrected (e.g. SETP990003793)"),
    numbering_range_id: z.number().describe("Local database ID of the credit note numbering range"),
    observation: z.string().max(250).nullish().describe("Optional comments or observations"),
    send_email: z.boolean().default(false).describe("Set true to email the credit note to the customer"),
    payment_details: z.array(z.object({
      payment_method_code: z.string().describe("Payment method code (e.g. '1' = Cash)"),
      amount: z.string().describe("Amount being returned/credited"),
      due_date: z.string().nullish().describe("Due date"),
      payment_form: z.string().default("1").describe("Payment form"),
      reference_code: z.string().nullish().describe("Payment transaction reference"),
    })),
    customer: z.record(z.unknown()).describe("Complete customer details payload"),
    items: z.array(z.object({
      code_reference: z.string().describe("Product reference code"),
      name: z.string().describe("Product name"),
      quantity: z.number().positive().describe("Quantity of items to credit"),
      price: z.union([z.number(), z.string()]).describe("Unit price WITH VAT included (gross value)"),
      tax_rate: z.string().describe("VAT tax rate percentage"),
      unit_measure_id: z.number().describe("Unit of measure ID"),
      standard_code_id: z.number().describe("Standard product code ID"),
      tribute_id: z.number().describe("Tribute ID"),
      is_excluded: z.boolean().default(false).describe("True if item is tax-excluded"),
      discount_rate: z.union([z.number(), z.string()]).nullish().describe("Discount rate"),
      note: z.string().nullish().describe("Optional item comment"),
    })),
  }),
  execute: async (params) => execMcpTool("create_credit_note", params),
});

export const listCreditNotesTool = tool({
  description: "List electronic credit notes with optional filtering.",
  inputSchema: z.object({
    status: z.string().nullish().describe("Filter by status"),
    reference_code: z.string().nullish().describe("Filter by custom reference code"),
    offset: z.number().min(0).default(0).describe("Pagination offset"),
    limit: z.number().min(1).max(100).default(20).describe("Pagination limit"),
  }),
  execute: async (params) => execMcpTool("list_credit_notes", params),
});

export const getCreditNoteTool = tool({
  description: "Get full details of a credit note by its Factus internal ID (not custom reference_code).",
  inputSchema: z.object({
    factus_id: z.string().min(1).describe("Factus internal ID"),
  }),
  execute: async ({ factus_id }) =>
    execMcpTool("get_credit_note", { factus_id }),
});

// ── Support Document Tools ──────────────────────────────────────────────

export const createSupportDocumentTool = tool({
  description: "Create an electronic support document (Documento Soporte - DS) for purchases from suppliers not obligated to issue electronic invoices.",
  inputSchema: z.object({
    reference_code: z.string().max(100).describe("Unique custom reference code for this document"),
    observation: z.string().max(250).nullish().describe("Optional observations"),
    send_email: z.boolean().default(false).describe("Set true to email the document to the supplier"),
    payment_details: z.array(z.object({
      payment_method_code: z.string().describe("Payment method code"),
      amount: z.string().describe("Amount paid"),
      due_date: z.string().nullish().describe("Due date"),
      payment_form: z.string().default("1").describe("Payment form"),
      reference_code: z.string().nullish().describe("Payment transaction reference"),
    })),
    provider: z.record(z.unknown()).describe("Complete supplier/provider details payload"),
    items: z.array(z.object({
      code_reference: z.string().describe("Product reference code"),
      name: z.string().describe("Product name"),
      quantity: z.number().positive().describe("Quantity of items purchased"),
      price: z.union([z.number(), z.string()]).describe("Unit price WITH VAT included (gross value)"),
      tax_rate: z.string().describe("VAT tax rate percentage"),
      unit_measure_id: z.number().describe("Unit of measure ID"),
      standard_code_id: z.number().describe("Standard product code ID"),
      tribute_id: z.number().describe("Tribute ID"),
      is_excluded: z.boolean().default(false).describe("True if item is tax-excluded"),
      discount_rate: z.union([z.number(), z.string()]).nullish().describe("Discount rate"),
      note: z.string().nullish().describe("Item note"),
    })),
  }),
  execute: async (params) =>
    execMcpTool("create_support_document", params),
});

export const listSupportDocumentsTool = tool({
  description: "List electronic support documents with optional filtering.",
  inputSchema: z.object({
    status: z.string().nullish().describe("Filter by status"),
    reference_code: z.string().nullish().describe("Filter by custom reference code"),
    offset: z.number().min(0).default(0).describe("Pagination offset"),
    limit: z.number().min(1).max(100).default(20).describe("Pagination limit"),
  }),
  execute: async (params) => execMcpTool("list_support_documents", params),
});

export const getSupportDocumentTool = tool({
  description: "Get support document details by its Factus-assigned document number (prefix + consecutive).",
  inputSchema: z.object({
    number: z.string().min(1).describe("Factus support document number (prefix + consecutive)"),
  }),
  execute: async ({ number }) =>
    execMcpTool("get_support_document", { number }),
});

// ── Adjustment Note Tools ───────────────────────────────────────────────

export const createAdjustmentNoteTool = tool({
  description: "Create an electronic adjustment note correcting a previously validated support document (DS).",
  inputSchema: z.object({
    reference_code: z.string().max(100).describe("Unique custom reference code for the adjustment note"),
    support_document_number: z.string().describe("Support document (DS) number being corrected"),
    correction_concept_code: z.string().describe("Adjustment note correction concept code"),
    observation: z.string().max(250).nullish().describe("Optional observations"),
    payment_details: z.array(z.object({
      payment_method_code: z.string().describe("Payment method code"),
      amount: z.string().describe("Credited amount"),
      due_date: z.string().nullish().describe("Due date"),
      payment_form: z.string().default("1").describe("Payment form"),
      reference_code: z.string().nullish().describe("Payment reference"),
    })),
    provider: z.record(z.unknown()).describe("Complete supplier/provider details payload"),
    items: z.array(z.object({
      code_reference: z.string().describe("Product reference code"),
      name: z.string().describe("Product name"),
      quantity: z.number().positive().describe("Quantity of items corrected"),
      price: z.union([z.number(), z.string()]).describe("Unit price WITH VAT included (gross value)"),
      tax_rate: z.string().describe("VAT tax rate percentage"),
      unit_measure_id: z.number().describe("Unit of measure ID"),
      standard_code_id: z.number().describe("Standard product code ID"),
      tribute_id: z.number().describe("Tribute ID"),
      is_excluded: z.boolean().default(false).describe("True if item is tax-excluded"),
      discount_rate: z.union([z.number(), z.string()]).nullish().describe("Discount rate"),
      note: z.string().nullish().describe("Item note"),
    })),
  }),
  execute: async (params) =>
    execMcpTool("create_adjustment_note", params),
});

export const listAdjustmentNotesTool = tool({
  description: "List electronic adjustment notes with optional filtering.",
  inputSchema: z.object({
    status: z.string().nullish().describe("Filter by status"),
    reference_code: z.string().nullish().describe("Filter by custom reference code"),
    offset: z.number().min(0).default(0).describe("Pagination offset"),
    limit: z.number().min(1).max(100).default(20).describe("Pagination limit"),
  }),
  execute: async (params) => execMcpTool("list_adjustment_notes", params),
});

export const getAdjustmentNoteTool = tool({
  description: "Get adjustment note details by its Factus document number.",
  inputSchema: z.object({
    number: z.string().min(1).describe("Factus adjustment note number"),
  }),
  execute: async ({ number }) =>
    execMcpTool("get_adjustment_note", { number }),
});

// ── Company / Establishments ────────────────────────────────────────────

export const getCompanyInfoTool = tool({
  description: "Get company/taxpayer information registered in Factus (NIT, trade name, address, etc.)",
  inputSchema: z.object({}),
  execute: async () => execMcpTool("get_company_info"),
});

export const listEstablishmentsTool = tool({
  description: "List all registered business establishments (branches/physical offices).",
  inputSchema: z.object({
    offset: z.number().min(0).default(0).describe("Pagination offset"),
    limit: z.number().min(1).max(100).default(20).describe("Pagination limit"),
  }),
  execute: async (params) => execMcpTool("list_establishments", params),
});

export const getEstablishmentTool = tool({
  description: "Get full establishment details by its local database ID.",
  inputSchema: z.object({
    id: z.number().describe("Establishment local database ID"),
  }),
  execute: async ({ id }) => execMcpTool("get_establishment", { id }),
});

export const createEstablishmentTool = tool({
  description: "Register a new business establishment (sucursal/physical branch) for your company.",
  inputSchema: z.object({
    name: z.string().max(200).describe("Name of the establishment"),
    address: z.string().max(200).describe("Physical address"),
    phone_number: z.string().max(50).nullish().describe("Contact phone number"),
    email: z.string().max(200).nullish().describe("Email address"),
    municipality_id: z
      .string()
      .max(10)
      .describe("DIAN municipality code of the establishment (e.g. 11001, 05001)"),
  }),
  execute: async (params) => execMcpTool("create_establishment", params),
});

export const updateEstablishmentTool = tool({
  description: "Update one or more fields of an existing establishment. Only fields provided are modified.",
  inputSchema: z.object({
    id: z.number().describe("Local database ID of the establishment to update"),
    name: z.string().max(200).nullish().describe("Updated name"),
    address: z.string().max(200).nullish().describe("Updated address"),
    phone_number: z.string().max(50).nullish().describe("Updated phone number"),
    email: z.string().max(200).nullish().describe("Updated email"),
    municipality_id: z.string().max(10).nullish().describe("Updated DIAN municipality code"),
  }),
  execute: async (params) => execMcpTool("update_establishment", params),
});

export const deleteEstablishmentTool = tool({
  description: "Delete a registered establishment by its local database ID.",
  inputSchema: z.object({
    id: z.number().describe("Local database ID of the establishment to delete"),
  }),
  execute: async ({ id }) => execMcpTool("delete_establishment", { id }),
});

// ── Numbering Ranges ────────────────────────────────────────────────────

export const getActiveNumberingRangesTool = tool({
  description: "Get active numbering resolution ranges, optionally filtered by document type (21 = Invoice, 22 = Credit Note, 24 = Support Document).",
  inputSchema: z.object({
    document_type_id: z
      .string()
      .nullish()
      .describe("Document type filter code (21 = Invoice, 22 = Credit Note, 24 = Support Document)"),
  }),
  execute: async (params) =>
    execMcpTool("get_active_numbering_ranges", params),
});

export const getDefaultNumberingRangeTool = tool({
  description: "Get the first active numbering range for a document type. ALWAYS call this to obtain numbering_range_id before creating invoices, credit notes, or support documents.",
  inputSchema: z.object({
    document_type_id: z.string().describe("Document type code (21 = Invoice, 22 = Credit Note, 24 = Support Document)"),
  }),
  execute: async ({ document_type_id }) =>
    execMcpTool("get_default_numbering_range", { document_type_id }),
});

// ── Registry ────────────────────────────────────────────────────────────

/** Map of all tools to be used with streamText({ tools: mcpToolRegistry }) */
export const mcpToolRegistry = {
  create_customer: createCustomerTool,
  search_customers: searchCustomersTool,
  get_customer: getCustomerTool,
  create_product: createProductTool,
  search_products: searchProductsTool,
  get_product_by_code: getProductByCodeTool,
  create_invoice: createInvoiceTool,
  create_invoice_with_numbering: createInvoiceWithNumberingTool,
  list_invoices: listInvoicesTool,
  get_invoice_by_number: getInvoiceByNumberTool,
  get_invoice_by_reference: getInvoiceByReferenceTool,
  create_credit_note: createCreditNoteTool,
  list_credit_notes: listCreditNotesTool,
  get_credit_note: getCreditNoteTool,
  create_support_document: createSupportDocumentTool,
  list_support_documents: listSupportDocumentsTool,
  get_support_document: getSupportDocumentTool,
  create_adjustment_note: createAdjustmentNoteTool,
  list_adjustment_notes: listAdjustmentNotesTool,
  get_adjustment_note: getAdjustmentNoteTool,
  get_company_info: getCompanyInfoTool,
  list_establishments: listEstablishmentsTool,
  get_establishment: getEstablishmentTool,
  create_establishment: createEstablishmentTool,
  update_establishment: updateEstablishmentTool,
  delete_establishment: deleteEstablishmentTool,
  get_active_numbering_ranges: getActiveNumberingRangesTool,
  get_default_numbering_range: getDefaultNumberingRangeTool,
} as const;

export type McpToolName = keyof typeof mcpToolRegistry;
