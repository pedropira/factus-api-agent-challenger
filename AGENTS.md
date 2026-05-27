# factus-agent

Colombian electronic invoicing Agent-First app. Chat with an AI to create invoices, customers, products, and credit notes via the Factus DIAN API.

## Architecture

```
factus-agent/                ← THIS REPO (Next.js)
factus-mcp-server-challenge   ← SEPARATE Python project (Render, Streamable HTTP)
```

### Two data paths — NEVER mix them

| Path | What | Where | Why |
|------|------|-------|-----|
| **Chat (MCP)** | Create / search / modify | MCP server → Factus API → DIAN | Single source of truth for operations |
| **Dashboard (DB)** | Read-only Top 10 tables | Direct Supabase (PostgreSQL) via Prisma/Drizzle | MCP has NO `list_customers` or `list_products` tools |

- Dashboard reads go DIRECTLY to Supabase, NEVER through the MCP server.
- Chat writes go through the MCP server, NEVER direct to DB.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| AI SDK | `ai` (`streamText`) + `@ai-sdk/google` |
| Model | Gemini 1.5 Flash (via Google AI Studio) |
| MCP Client | `@modelcontextprotocol/sdk` |
| ORM | Prisma or Drizzle (for Supabase reads only) |
| DB | Supabase (PostgreSQL) — already migrated from SQLite |

## Partner MCP Server (CRITICAL)

The MCP server lives at a SEPARATE URL and has specific quirks.

### Transport: Streamable HTTP (NOT SSE)

```typescript
// ✅ CORRECT
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport({
  url: "https://factus-mcp-server-challenge.onrender.com/api",
  headers: { "Content-Type": "application/json", "Accept": "application/json" }
});

// ❌ WRONG — this server does NOT use SSE
import { SseClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
```

### Session flow

1. `initialize` → server responds with `mcp-session-id` header
2. All subsequent requests MUST include that session ID
3. The SDK's `StreamableHTTPClientTransport` handles this automatically

### No auth needed

The MCP server does NOT require API keys, Bearer tokens, or any authentication headers.

### Render free tier spin-down

- Server spins down after ~15 minutes of inactivity
- First request after idle takes **~50 seconds** (cold start)
- Solution: implement a health-check cron (every 4 min) to keep it warm

### Available MCP tools

```
✅ create_customer, search_customers, get_customer, update_customer, delete_customer
✅ create_product, search_products, get_product_by_code, update_product, delete_product
✅ create_invoice, create_invoice_with_numbering, list_invoices
✅ create_credit_note, create_adjustment_note
✅ get_company_info
✅ list_establishments, get_establishment
✅ get_active_numbering_ranges, get_default_numbering_range
❌ list_customers     → does NOT exist (use Supabase direct)
❌ list_products      → does NOT exist (use Supabase direct)
```

### Factus API → your reference codes

- `reference_code`: a unique string YOU set (e.g. "FACT-001-2026"). Use this to look up documents later.
- Invoice creation returns a `bill_number` assigned by Factus (e.g. "SETP990004388").
- Credit notes reference invoices by `bill_number`.
- For `numbering_range_id`: pass your LOCAL DB ID; the MCP resolves it to the Factus API ID.

## UI conventions

- **Agent-First**: the chat IS the primary interface. No traditional forms, no multi-step wizards.
- **Dashboard panel**: secondary, shows Top 10 tables (customers, products, recent invoices).
- The agent infers intent from natural language and calls the appropriate MCP tools.

## Project structure (planned)

```
src/
  app/
    page.tsx               ← main chat + dashboard layout
    api/
      chat/route.ts        ← POST: streamText + MCP tool mapping
      records/route.ts     ← GET: dashboard data from Supabase
  lib/
    mcp-client.ts          ← StreamableHTTPClientTransport singleton + session init
    mcp-tools.ts           ← tool definitions mapped to Vercel AI SDK
    mcp-call.ts            ← raw JSON-RPC call helper (for non-tool calls)
    db.ts                  ← Prisma/Drizzle client for Supabase reads
    types.ts               ← shared Factus-related types
  components/
    chat/
      ChatShell.tsx        ← main chat container
      MessageBubble.tsx
    dashboard/
      TopCustomers.tsx
      TopProducts.tsx
      RecentInvoices.tsx
      RecentCreditNotes.tsx
```

## Commands

```bash
# dev
npm run dev

# typecheck
npx tsc --noEmit

# lint
npx next lint

# format
npx prettier --write .
```

## Verifying MCP connectivity

```bash
# Quick health test (wakes up Render if sleeping)
curl -X POST "https://factus-mcp-server-challenge.onrender.com/api" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"ping"}'
```

Wait ~60s if server is cold-starting. First response establishes the session.

## Known test data

- **Product**: PROD-001 → Laptop Gamer, $5,500,000, IVA 19%, tribute_id: 1
- **Customer**: ID 3 → Carlos Andrés Pérez, CC 123456789
- **Invoice**: SETP990004388 → Laptop Gamer x1, $6,545,000 total, validated with DIAN
- **Invoice warnings**: FAJ44b, FAJ43b are expected (invented company data for testing)
