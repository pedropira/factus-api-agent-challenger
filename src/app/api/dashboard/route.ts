import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callMcpTool } from "@/lib/mcp-client";

// ── Types ──────────────────────────────────────────────────────────────────

interface DocStats {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
}

interface DashboardData {
  customers: number;
  products: number;
  invoices: DocStats;
  credit_notes: DocStats;
  support_documents: number;
  adjustment_notes: number;
}

// ── MCP tool names ─────────────────────────────────────────────────────────

const MCP_LIST_TOOLS: Record<string, string> = {
  invoices: "list_invoices",
  credit_notes: "list_credit_notes",
  support_documents: "list_support_documents",
  adjustment_notes: "list_adjustment_notes",
};

// ── Fetch helpers ──────────────────────────────────────────────────────────

function countDocStats(docs: Record<string, unknown>[]): DocStats {
  let accepted = 0;
  let rejected = 0;
  let pending = 0;
  for (const doc of docs) {
    if (doc.is_validated && !doc.errors) {
      accepted++;
    } else if (doc.errors) {
      rejected++;
    } else {
      pending++;
    }
  }
  return { total: docs.length, accepted, rejected, pending };
}

async function fetchDocStats(
  toolName: string,
): Promise<{ stats: DocStats; error?: string }> {
  try {
    const raw = await callMcpTool<{ type: string; text: string }[]>(
      toolName,
      {},
    );
    const parsed = JSON.parse(raw[0].text);
    const docs: Record<string, unknown>[] =
      parsed?.data?.data?.data ?? [];
    return { stats: countDocStats(docs) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Dashboard] ${toolName} failed:`, msg);
    return { stats: { total: 0, accepted: 0, rejected: 0, pending: 0 }, error: msg };
  }
}

// ── GET /api/dashboard ─────────────────────────────────────────────────────

export async function GET() {
  try {
    // Fetch Prisma counts + all MCP doc stats in parallel
    // (MCP calls are internally serialized but Prisma runs concurrently)
    const [customers, products, invoices, creditNotes, supportDocs, adjNotes] =
      await Promise.all([
        prisma.customers.count().catch(() => 0),
        prisma.products.count().catch(() => 0),
        fetchDocStats(MCP_LIST_TOOLS.invoices),
        fetchDocStats(MCP_LIST_TOOLS.credit_notes),
        fetchDocStats(MCP_LIST_TOOLS.support_documents),
        fetchDocStats(MCP_LIST_TOOLS.adjustment_notes),
      ]);

    const data: DashboardData = {
      customers,
      products,
      invoices: invoices.stats,
      credit_notes: creditNotes.stats,
      support_documents: supportDocs.stats.total,
      adjustment_notes: adjNotes.stats.total,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Dashboard API] error:", error);
    return NextResponse.json(
      { error: "Error obteniendo dashboard" },
      { status: 500 },
    );
  }
}

export type { DashboardData, DocStats };
