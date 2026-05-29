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
];

// Tools that list documents via Factus API (source of truth)
const MCP_LIST_TOOLS: Record<string, string> = {
  invoices: "list_invoices",
  credit_notes: "list_credit_notes",
  support_documents: "list_support_documents",
  adjustment_notes: "list_adjustment_notes",
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
    const base = {
      reference_code: doc.reference_code ?? "",
      status,
      total: doc.total != null ? Number(doc.total) : null,
      created_at: doc.created_at ?? "",
    };

    // Negative offset ensures MCP-sourced keys never collide with real DB IDs
    // and we never emit id: 0 (which would cause React key collisions).
    const id = typeof doc.id === "number" && doc.id !== 0
      ? doc.id
      : -(index + 1001);
    switch (type) {
      case "invoices":
        return { ...base, id, bill_number: doc.number ?? null };
      case "credit_notes":
        return { ...base, id, bill_number: doc.number ?? null };
      case "support_documents":
        return { ...base, id, number: doc.number ?? null };
      case "adjustment_notes":
        return { ...base, id, number: doc.number ?? null };
      default:
        return doc;
    }
  };
}
