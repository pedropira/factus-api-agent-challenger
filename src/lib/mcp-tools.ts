// Tool definitions for Vercel AI SDK — mapeo 1:1 con herramientas MCP
// Se usan con streamText({ tools: mcpTools })

import { tool } from "ai";
import { z } from "zod";
import { callMcpTool } from "./mcp-client";

// Helper tipado: force OUTPUT a Record<string, unknown>
// para que tool() infiera el tipo correcto (no never) y no falle el overload
async function execMcpTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  return callMcpTool(name, args);
}

// ── Customer Tools ──────────────────────────────────────────────────────

export const createCustomerTool = tool({
  description: "Crear un nuevo cliente (adquiriente) en la base de datos local",
  inputSchema: z.object({
    identification_document_id: z.number().describe("ID del tipo de documento (1-11)"),
    identification: z.string().max(50).describe("Número de identificación"),
    dv: z.string().max(2).nullish().describe("Dígito de verificación (requerido si NIT)"),
    company: z.string().max(200).nullish().describe("Razón social (persona jurídica)"),
    trade_name: z.string().max(200).nullish().describe("Nombre comercial"),
    names: z.string().max(200).nullish().describe("Nombres del cliente (persona natural)"),
    address: z.string().max(200).nullish().describe("Dirección"),
    email: z.string().max(200).nullish().describe("Correo electrónico"),
    phone: z.string().max(50).nullish().describe("Teléfono"),
    legal_organization_id: z.string().max(5).nullish(),
    tribute_id: z.string().max(5).nullish(),
    municipality_id: z.string().max(10).nullish().describe("Código DIAN (11001, 05001)"),
  }),
  execute: async (params) => execMcpTool("create_customer", params),
});

export const searchCustomersTool = tool({
  description: "Buscar clientes por identificación, nombre, empresa o email",
  inputSchema: z.object({
    query: z.string().min(1).describe("Texto de búsqueda"),
    limit: z.number().min(1).max(100).default(20),
  }),
  execute: async ({ query, limit }) =>
    execMcpTool("search_customers", { query, limit }),
});

export const getCustomerTool = tool({
  description: "Obtener un cliente por su ID local",
  inputSchema: z.object({
    id: z.number().describe("ID del cliente"),
  }),
  execute: async ({ id }) => execMcpTool("get_customer", { id }),
});

// ── Product Tools ───────────────────────────────────────────────────────

export const createProductTool = tool({
  description: "Crear un nuevo producto en el catálogo local",
  inputSchema: z.object({
    code_reference: z.string().max(100).describe("Código de referencia único"),
    name: z.string().max(300).describe("Nombre del producto"),
    price: z.union([z.number(), z.string()]).describe("Precio unitario CON IVA incluido"),
    tax_rate: z.string().max(10).describe("Porcentaje de IVA (ej: 19.00)"),
    unit_measure_id: z.number().describe("ID unidad de medida (70=unidad)"),
    standard_code_id: z.number().describe("ID estándar (1=contribuyente, 2=UNSPSC)"),
    tribute_id: z.number().describe("ID tributo (1=IVA, 2=INC)"),
    is_excluded: z.boolean().default(false).describe("Excluido de IVA"),
    note: z.string().max(500).nullish(),
  }),
  execute: async (params) => execMcpTool("create_product", params),
});

export const searchProductsTool = tool({
  description: "Buscar productos por nombre o código de referencia",
  inputSchema: z.object({
    query: z.string().min(1).describe("Texto de búsqueda"),
    limit: z.number().min(1).max(100).default(20),
  }),
  execute: async ({ query, limit }) =>
    execMcpTool("search_products", { query, limit }),
});

export const getProductByCodeTool = tool({
  description: "Obtener un producto por su código de referencia",
  inputSchema: z.object({
    code_reference: z.string().describe("Código de referencia del producto"),
  }),
  execute: async ({ code_reference }) =>
    execMcpTool("get_product_by_code", { code_reference }),
});

// ── Invoice Tools ───────────────────────────────────────────────────────

export const createInvoiceTool = tool({
  description: "Crear factura electrónica vía Factus API (POST /v2/bills/validate)",
  inputSchema: z.object({
    reference_code: z.string().max(100).describe("Código único de referencia"),
    document: z.string().default("01"),
    operation_type: z.string().default("10"),
    observation: z.string().max(250).nullish(),
    send_email: z.boolean().default(false),
    payment_details: z.array(z.object({
      payment_method_code: z.string(),
      amount: z.string(),
      due_date: z.string().nullish(),
      payment_form: z.string().default("1"),
      reference_code: z.string().nullish(),
    })),
    customer: z.record(z.unknown()),
    items: z.array(z.object({
      code_reference: z.string(),
      name: z.string(),
      quantity: z.number().positive(),
      price: z.union([z.number(), z.string()]),
      tax_rate: z.string(),
      unit_measure_id: z.number(),
      standard_code_id: z.number(),
      tribute_id: z.number(),
      is_excluded: z.boolean().default(false),
      discount_rate: z.union([z.number(), z.string()]).nullish(),
      note: z.string().nullish(),
    })),
    allowance_charges: z.array(z.object({
      concept_type: z.string(),
      is_surcharge: z.boolean(),
      reason: z.string(),
      base_amount: z.union([z.number(), z.string()]),
      amount: z.union([z.number(), z.string()]),
    })).nullish(),
  }),
  execute: async (params) => execMcpTool("create_invoice", params),
});

export const createInvoiceWithNumberingTool = tool({
  description:
    "Crear factura con numeración automática (flujo colombiano completo)",
  inputSchema: z.object({
    reference_code: z.string().max(100),
    observation: z.string().max(250).nullish(),
    send_email: z.boolean().default(false),
    payment_details: z.array(z.object({
      payment_method_code: z.string(),
      amount: z.string(),
      due_date: z.string().nullish(),
      payment_form: z.string().default("1"),
      reference_code: z.string().nullish(),
    })),
    items: z.array(z.object({
      code_reference: z.string(),
      name: z.string(),
      quantity: z.number().positive(),
      price: z.union([z.number(), z.string()]),
      tax_rate: z.string(),
      unit_measure_id: z.number(),
      standard_code_id: z.number(),
      tribute_id: z.number(),
      is_excluded: z.boolean().default(false),
      discount_rate: z.union([z.number(), z.string()]).nullish(),
      note: z.string().nullish(),
    })),
    allowance_charges: z.array(z.object({
      concept_type: z.string(),
      is_surcharge: z.boolean(),
      reason: z.string(),
      base_amount: z.union([z.number(), z.string()]),
      amount: z.union([z.number(), z.string()]),
    })).nullish(),
    customer_id: z.number().describe("ID del cliente en DB local"),
    numbering_range_id: z.number().describe("ID del rango de numeración"),
    establishment_id: z.number().nullish(),
  }),
  execute: async (params) =>
    execMcpTool("create_invoice_with_numbering", params),
});

export const listInvoicesTool = tool({
  description: "Listar facturas electrónicas con filtros opcionales",
  inputSchema: z.object({
    status: z.string().nullish(),
    reference_code: z.string().nullish(),
    offset: z.number().min(0).default(0),
    limit: z.number().min(1).max(100).default(20),
  }),
  execute: async (params) => execMcpTool("list_invoices", params),
});

export const getInvoiceByNumberTool = tool({
  description:
    "Obtener una factura por su número asignado por Factus (prefijo + consecutivo)",
  inputSchema: z.object({
    number: z.string().describe("Número de factura (ej: SETP990003793)"),
  }),
  execute: async ({ number }) =>
    execMcpTool("get_invoice_by_number", { number }),
});

export const getInvoiceByReferenceTool = tool({
  description: "Obtener una factura por su código de referencia único",
  inputSchema: z.object({
    reference_code: z.string().describe("Código de referencia de la factura"),
  }),
  execute: async ({ reference_code }) =>
    execMcpTool("get_invoice_by_reference", { reference_code }),
});

// ── Credit Note Tools ───────────────────────────────────────────────────

export const createCreditNoteTool = tool({
  description: "Crear nota crédito que referencia una factura existente",
  inputSchema: z.object({
    reference_code: z.string().max(100),
    correction_concept_code: z.string().describe("1=devolución, 2=anulación"),
    bill_number: z.string().describe("Número de factura que referencia"),
    numbering_range_id: z.number(),
    observation: z.string().max(250).nullish(),
    send_email: z.boolean().default(false),
    payment_details: z.array(z.object({
      payment_method_code: z.string(),
      amount: z.string(),
      due_date: z.string().nullish(),
      payment_form: z.string().default("1"),
      reference_code: z.string().nullish(),
    })),
    customer: z.record(z.unknown()),
    items: z.array(z.object({
      code_reference: z.string(),
      name: z.string(),
      quantity: z.number().positive(),
      price: z.union([z.number(), z.string()]),
      tax_rate: z.string(),
      unit_measure_id: z.number(),
      standard_code_id: z.number(),
      tribute_id: z.number(),
      is_excluded: z.boolean().default(false),
      discount_rate: z.union([z.number(), z.string()]).nullish(),
      note: z.string().nullish(),
    })),
  }),
  execute: async (params) => execMcpTool("create_credit_note", params),
});

export const listCreditNotesTool = tool({
  description: "Listar notas crédito con filtros opcionales",
  inputSchema: z.object({
    status: z.string().nullish(),
    reference_code: z.string().nullish(),
    offset: z.number().min(0).default(0),
    limit: z.number().min(1).max(100).default(20),
  }),
  execute: async (params) => execMcpTool("list_credit_notes", params),
});

export const getCreditNoteTool = tool({
  description: "Obtener una nota crédito por su ID interno de Factus",
  inputSchema: z.object({
    factus_id: z.string().min(1).describe("ID interno de Factus"),
  }),
  execute: async ({ factus_id }) =>
    execMcpTool("get_credit_note", { factus_id }),
});

// ── Support Document Tools ──────────────────────────────────────────────

export const createSupportDocumentTool = tool({
  description:
    "Crear documento soporte para transacciones con proveedores sin factura electrónica",
  inputSchema: z.object({
    reference_code: z.string().max(100),
    observation: z.string().max(250).nullish(),
    send_email: z.boolean().default(false),
    payment_details: z.array(z.object({
      payment_method_code: z.string(),
      amount: z.string(),
      due_date: z.string().nullish(),
      payment_form: z.string().default("1"),
      reference_code: z.string().nullish(),
    })),
    provider: z.record(z.unknown()),
    items: z.array(z.object({
      code_reference: z.string(),
      name: z.string(),
      quantity: z.number().positive(),
      price: z.union([z.number(), z.string()]),
      tax_rate: z.string(),
      unit_measure_id: z.number(),
      standard_code_id: z.number(),
      tribute_id: z.number(),
      is_excluded: z.boolean().default(false),
      discount_rate: z.union([z.number(), z.string()]).nullish(),
      note: z.string().nullish(),
    })),
  }),
  execute: async (params) =>
    execMcpTool("create_support_document", params),
});

export const listSupportDocumentsTool = tool({
  description: "Listar documentos soporte con filtros opcionales",
  inputSchema: z.object({
    status: z.string().nullish(),
    reference_code: z.string().nullish(),
    offset: z.number().min(0).default(0),
    limit: z.number().min(1).max(100).default(20),
  }),
  execute: async (params) => execMcpTool("list_support_documents", params),
});

export const getSupportDocumentTool = tool({
  description: "Obtener un documento soporte por su número asignado por Factus",
  inputSchema: z.object({
    number: z.string().min(1).describe("Número de documento (prefijo + consecutivo)"),
  }),
  execute: async ({ number }) =>
    execMcpTool("get_support_document", { number }),
});

// ── Adjustment Note Tools ───────────────────────────────────────────────

export const createAdjustmentNoteTool = tool({
  description: "Crear nota de ajuste que corrige un documento soporte",
  inputSchema: z.object({
    reference_code: z.string().max(100),
    support_document_number: z.string().describe("Número del DS que corrige"),
    correction_concept_code: z.string(),
    observation: z.string().max(250).nullish(),
    payment_details: z.array(z.object({
      payment_method_code: z.string(),
      amount: z.string(),
      due_date: z.string().nullish(),
      payment_form: z.string().default("1"),
      reference_code: z.string().nullish(),
    })),
    provider: z.record(z.unknown()),
    items: z.array(z.object({
      code_reference: z.string(),
      name: z.string(),
      quantity: z.number().positive(),
      price: z.union([z.number(), z.string()]),
      tax_rate: z.string(),
      unit_measure_id: z.number(),
      standard_code_id: z.number(),
      tribute_id: z.number(),
      is_excluded: z.boolean().default(false),
      discount_rate: z.union([z.number(), z.string()]).nullish(),
      note: z.string().nullish(),
    })),
  }),
  execute: async (params) =>
    execMcpTool("create_adjustment_note", params),
});

export const listAdjustmentNotesTool = tool({
  description: "Listar notas de ajuste con filtros opcionales",
  inputSchema: z.object({
    status: z.string().nullish(),
    reference_code: z.string().nullish(),
    offset: z.number().min(0).default(0),
    limit: z.number().min(1).max(100).default(20),
  }),
  execute: async (params) => execMcpTool("list_adjustment_notes", params),
});

export const getAdjustmentNoteTool = tool({
  description: "Obtener una nota de ajuste por su número de documento",
  inputSchema: z.object({
    number: z.string().min(1).describe("Número de documento de Factus"),
  }),
  execute: async ({ number }) =>
    execMcpTool("get_adjustment_note", { number }),
});

// ── Company / Establishments ────────────────────────────────────────────

export const getCompanyInfoTool = tool({
  description: "Obtener información de la empresa desde Factus",
  inputSchema: z.object({}),
  execute: async () => execMcpTool("get_company_info"),
});

export const listEstablishmentsTool = tool({
  description: "Listar establecimientos (sucursales)",
  inputSchema: z.object({
    offset: z.number().min(0).default(0),
    limit: z.number().min(1).max(100).default(20),
  }),
  execute: async (params) => execMcpTool("list_establishments", params),
});

export const getEstablishmentTool = tool({
  description: "Obtener un establecimiento por su ID local",
  inputSchema: z.object({
    id: z.number().describe("ID del establecimiento"),
  }),
  execute: async ({ id }) => execMcpTool("get_establishment", { id }),
});

export const createEstablishmentTool = tool({
  description: "Crear un nuevo establecimiento (sucursal)",
  inputSchema: z.object({
    name: z.string().max(200).describe("Nombre del establecimiento"),
    address: z.string().max(200).describe("Dirección"),
    phone_number: z.string().max(50).nullish().describe("Teléfono"),
    email: z.string().max(200).nullish().describe("Correo electrónico"),
    municipality_id: z
      .string()
      .max(10)
      .describe("Código DIAN del municipio (11001, 05001)"),
  }),
  execute: async (params) => execMcpTool("create_establishment", params),
});

export const updateEstablishmentTool = tool({
  description: "Actualizar un establecimiento existente (solo campos provistos)",
  inputSchema: z.object({
    id: z.number().describe("ID del establecimiento"),
    name: z.string().max(200).nullish(),
    address: z.string().max(200).nullish(),
    phone_number: z.string().max(50).nullish(),
    email: z.string().max(200).nullish(),
    municipality_id: z.string().max(10).nullish(),
  }),
  execute: async (params) => execMcpTool("update_establishment", params),
});

export const deleteEstablishmentTool = tool({
  description: "Eliminar un establecimiento por su ID local",
  inputSchema: z.object({
    id: z.number().describe("ID del establecimiento a eliminar"),
  }),
  execute: async ({ id }) => execMcpTool("delete_establishment", { id }),
});

// ── Numbering Ranges ────────────────────────────────────────────────────

export const getActiveNumberingRangesTool = tool({
  description:
    "Obtener rangos de numeración activos, opcionalmente filtrados por tipo",
  inputSchema: z.object({
    document_type_id: z
      .string()
      .nullish()
      .describe("21=factura, 22=NC, 24=DS"),
  }),
  execute: async (params) =>
    execMcpTool("get_active_numbering_ranges", params),
});

export const getDefaultNumberingRangeTool = tool({
  description:
    "Obtener el primer rango de numeración activo para un tipo de documento",
  inputSchema: z.object({
    document_type_id: z.string().describe("21=factura, 22=NC, 24=DS"),
  }),
  execute: async ({ document_type_id }) =>
    execMcpTool("get_default_numbering_range", { document_type_id }),
});

// ── Registry ────────────────────────────────────────────────────────────

/** Mapa de todas las tools para usar con streamText({ tools: mcpToolRegistry }) */
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
