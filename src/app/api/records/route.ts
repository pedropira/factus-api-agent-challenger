import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callMcpTool } from "@/lib/mcp-client";
import type { RecordType } from "@/lib/types";

const VALID_TYPES: RecordType[] = [
  "customers",
  "products",
  "invoices",
  "credit_notes",
  "support_documents",
  "adjustment_notes",
  "establishments",
];

// Tools that list documents via Factus API (source of truth)
const MCP_LIST_TOOLS: Record<string, string> = {
  invoices: "list_invoices",
  credit_notes: "list_credit_notes",
  support_documents: "list_support_documents",
  adjustment_notes: "list_adjustment_notes",
  establishments: "list_establishments",
};

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") as RecordType | null;

    if (!type) {
      return NextResponse.json(
        { error: "Missing required query parameter: type" },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid type: "${type}". Must be one of: ${VALID_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const data = await queryRecords(type);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Records API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function queryRecords(type: RecordType) {
  const mcpTool = MCP_LIST_TOOLS[type];

  if (mcpTool) {
    // ── Electronic documents: fetch from Factus via MCP ─────────────
    const raw = await callMcpTool<{ type: string; text: string }[]>(
      mcpTool,
      {},
    );
    const parsed = JSON.parse(raw[0].text);
    const docs: Record<string, unknown>[] = parsed?.data?.data?.data ?? [];
    // Establishments and other non-document entities don't have is_validated/errors
    if (type === "establishments") {
      return docs.map((doc, i) => ({
        id: typeof doc.id === "number" && doc.id !== 0 ? doc.id : -(i + 1001),
        ...doc,
      })).slice(0, 10);
    }
    return docs.map(normalizeDoc(type)).slice(0, 10);
  }

  // ── Customers & Products: read from Supabase via Prisma ──────────
  try {
    switch (type) {
      case "customers":
        return await prisma.customers.findMany({
          take: 10,
        });

      case "products":
        return await prisma.products.findMany({
          take: 10,
        });

      default:
        return [];
    }
  } catch (err) {
    console.error(`[Records API] Error querying ${type}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

function normalizeDoc(type: RecordType) {
  return (doc: Record<string, unknown>, index: number) => {
    const status =
      doc.is_validated && !doc.errors ? "ACCEPTED" : "PENDIENTE";

    // Negative offset ensures MCP-sourced keys never collide with real DB IDs
    // and we never emit id: 0 (which would cause React key collisions).
    const id = typeof doc.id === "number" && doc.id !== 0
      ? doc.id
      : -(index + 1001);

    // Pass through ALL fields from Factus + computed ones
    // Computed fields come LAST so they override anything from doc
    return {
      ...doc,
      id,
      status,
      reference_code: doc.reference_code ?? doc["codigo_referencia"] ?? "",
      total: doc.total != null ? Number(doc.total) : null,
      created_at: doc.created_at ?? doc["fecha_creacion"] ?? doc["fecha_emision"] ?? "",
      // Factus returns "número" (Spanish) but we normalize to "number"
      number: doc.number ?? doc["número"] ?? doc["numero"] ?? null,
      bill_number: doc.number ?? doc["número"] ?? doc["numero"] ?? null,
      // Customer info: Factus may return "nombre_cliente_api" or customer.names
      customer_name:
        (doc.customer as Record<string, unknown> | undefined)?.names as string
        ?? doc["nombre_cliente_api"] as string
        ?? null,
      customer_identification:
        (doc.customer as Record<string, unknown> | undefined)?.identification as string
        ?? null,
      payment_details: doc.payment_details ?? null,
      items: doc.items ?? null,
      cufe: doc.cufe ?? null,
      pdf_url: doc.pdf_url ?? null,
      xml_url: doc.xml_url ?? null,
      observation: doc.observation ?? null,
      errors: doc.errors ?? null,
      is_validated: doc.is_validated ?? null,
    };
  };
}
