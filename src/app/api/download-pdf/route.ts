// GET /api/download-pdf?type=invoice&number=SETP990004459
//
// Proxea la descarga de PDF desde el MCP server.
// Devuelve el PDF listo para descargar (Content-Type: application/pdf).

import { NextRequest } from "next/server";
import {
  mcpDownloadInvoicePdf,
  mcpDownloadCreditNotePdf,
  mcpDownloadSupportDocumentPdf,
  mcpDownloadAdjustmentNotePdf,
} from "@/lib/mcp-call";

type DocType = "invoice" | "credit_note" | "support_document" | "adjustment_note";

const VALID_TYPES: DocType[] = [
  "invoice",
  "credit_note",
  "support_document",
  "adjustment_note",
];

const DOWNLOAD_FN: Record<DocType, (number: string) => Promise<string>> = {
  invoice: mcpDownloadInvoicePdf,
  credit_note: mcpDownloadCreditNotePdf,
  support_document: mcpDownloadSupportDocumentPdf,
  adjustment_note: mcpDownloadAdjustmentNotePdf,
};

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") as DocType | null;
    const number = request.nextUrl.searchParams.get("number");

    if (!type || !number) {
      return Response.json(
        { error: "Faltan parámetros requeridos: type y number" },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return Response.json(
        {
          error: `Tipo inválido: "${type}". Debe ser uno de: ${VALID_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const base64Pdf = await DOWNLOAD_FN[type](number);
    const pdfBuffer = Buffer.from(base64Pdf, "base64");

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${number}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        // Cache por 5 min para evitar recargar el mismo PDF seguido
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Download PDF API error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
