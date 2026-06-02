<div align="center">
  <img src="public/logo-agent.png" alt="Factus MCP Server Logo" width="1000"/>
</div>

# Factus Agent

**AI-powered Colombian electronic invoicing assistant.** Chat with an AI agent to create invoices, customers, products, and credit notes via the Factus DIAN API.

Built with Next.js 14+, Vercel AI SDK, Google Gemini 2.5 Flash, and an MCP server that orchestrates the Factus API.

---

## Architecture

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│  factus-agent (THIS REPO)       │     │  factus-mcp-server-challenge    │
│  Next.js + AI SDK + Gemini      │◄────│  Python (FastAPI) + Factus API  │
│  Render (Web Service)           │ MCP │  Render (Web Service)           │
└──────────────┬──────────────────┘     └─────────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │   Supabase   │
        │ (PostgreSQL) │
        └──────────────┘
```

### Two data paths — NEVER mix them

| Path               | What                     | Where                                   | Why                                            |
| ------------------ | ------------------------ | --------------------------------------- | ---------------------------------------------- |
| **Chat (MCP)**     | Create / search / modify | MCP server → Factus API → DIAN          | Single source of truth for operations          |
| **Dashboard (DB)** | Read-only Top 10 tables  | Direct Supabase (PostgreSQL) via Prisma | MCP has NO list tools for customers / products |

- Dashboard reads go DIRECTLY to Supabase, NEVER through the MCP server.
- Chat writes go through the MCP server, NEVER direct to DB.

---

## Prerequisites

- **Node.js** 20+
- **npm**
- **Supabase project** (PostgreSQL) — [supabase.com](https://supabase.com)
- **Google AI Studio API key** — [aistudio.google.com](https://aistudio.google.com)
- **MCP server** running — the project uses `https://factus-mcp-server-challenge.onrender.com/api` by default

---

## Environment variables

Create a `.env.local` file:

```bash
# Google AI Studio API key (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Supabase (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase (server-side — Prisma direct connection)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?sslmode=require

# MCP server URL (optional — defaults to the Render URL below)
# MCP_SERVER_URL=https://factus-mcp-server-challenge.onrender.com/api
```

---

## Local development

```bash
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment on Render

### 1. Docker image (recommended)

A `Dockerfile` and `.dockerignore` are already configured for Next.js standalone output.

**Render setup:**

1. Create a new **Web Service**
2. Connect your GitHub repo
3. **Runtime:** Docker
4. **Build Command:** (leave empty — Dockerfile handles it)
5. **Start Command:** (leave empty — Dockerfile handles it)
6. Add all **Environment Variables** from the table above
7. **Instance Type:** Free (enough for this app)

### 2. Environment variables in Render

Set these in Render Dashboard → Environment:

| Key                             | Value                            |
| ------------------------------- | -------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY`  | Your Google AI Studio key        |
| `NEXT_PUBLIC_SUPABASE_URL`      | https://your-project.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key           |
| `DATABASE_URL`                  | postgresql://...?sslmode=require |
| `NODE_ENV`                      | production                       |

> **Important:** Because the MCP client uses a singleton (it keeps session state in memory), Render's Web Service model (long-running process) is a better fit than serverless platforms like Vercel.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                 ← Chat + dashboard layout
│   ├── api/
│   │   ├── chat/route.ts        ← POST: streamText + MCP tool mapping
│   │   └── records/route.ts     ← GET: dashboard data from Supabase
├── lib/
│   ├── ai/
│   │   ├── model.ts             ← Gemini model configuration
│   │   ├── system-prompt.ts     ← AI system instructions
│   │   └── chat-pipeline.ts     ← streamText orchestration
│   ├── mcp-client.ts            ← MCP StreamableHTTP client (singleton)
│   ├── mcp-tools.ts             ← Tool definitions for AI SDK
│   ├── supabase/                ← Supabase client (client + server)
│   ├── db.ts                    ← Prisma client singleton
│   └── types.ts                 ← Shared types
├── components/
│   ├── chat/
│   │   ├── ChatShell.tsx        ← Main chat container
│   │   └── MessageBubble.tsx
│   └── dashboard/
│       ├── TopCustomers.tsx
│       ├── TopProducts.tsx
│       ├── RecentInvoices.tsx
│       └── RecentCreditNotes.tsx
```

---

## Partner MCP server

The MCP server is a **separate** Python project deployed on Render:

- **Transport:** Streamable HTTP (NOT SSE)
- **Session:** Auto-managed by the SDK (session ID in headers)
- **No auth required**
- **Cold start:** ~50s on first request after inactivity (Render free tier)
- **Health check:** The app includes `pingMcpServer()` — call every 4 min to keep warm

---

## Available MCP tools

| Category       | Tools                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customers      | `create_customer`, `get_customer`, `search_customers`, `update_customer`, `delete_customer`                                                                                               |
| Products       | `create_product`, `get_product`, `get_product_by_code`, `search_products`, `update_product`, `delete_product`                                                                             |
| Establishments | `create_establishment`, `get_establishment`, `list_establishments`, `update_establishment`, `delete_establishment`                                                                        |
| Numbering      | `create_numbering_range`, `get_active_numbering_ranges`, `get_default_numbering_range`, `fetch_numbering_ranges_from_factus`                                                              |
| Invoices       | `create_invoice`, `create_invoice_with_numbering`, `list_invoices`, `get_invoice_by_number`, `get_invoice_by_reference`, `delete_invoice`, `download_invoice_pdf`, `download_invoice_xml` |
| Credit Notes   | `create_credit_note`, `list_credit_notes`, `get_credit_note`, `delete_credit_note`, `download_credit_note_pdf`, `download_credit_note_xml`                                                |
| Adj. Notes     | `create_adjustment_note`, `list_adjustment_notes`, `get_adjustment_note`, `delete_adjustment_note`, `download_adjustment_note_pdf`, `download_adjustment_note_xml`                        |
| Support Docs   | `create_support_document`, `list_support_documents`, `get_support_document`, `delete_support_document`, `download_support_document_pdf`, `download_support_document_xml`                  |
| Company        | `get_company_info`                                                                                                                                                                        |

---

## Known test data

- **Product:** PROD-001 → Laptop Gamer, $5,500,000, IVA 19%, tribute_id: 1, standard_code_id: 999, unit_measure_id: 70
- **Customer:** ID 3 → Carlos Andrés Pérez, CC 123456789, identification_document_id: 13
- **Invoice:** SETP990004388 → Laptop Gamer x1, $6,545,000 total, validated with DIAN
- **Invoice warnings:** FAJ44b, FAJ43b are expected (invented company data for testing)

---

## Commands

```bash
npm run dev        # start development server
npx tsc --noEmit   # typecheck
npx next lint      # lint
npx prettier --write .  # format
```
