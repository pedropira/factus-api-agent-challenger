# Tasks: Dashboard Records API

## Phase 1: Foundation

- [x] 1.1 Add `support_document` and `adjustment_note` models to `prisma/schema.prisma`
- [x] 1.2 Add API response types in `src/lib/types.ts` for all 6 entities

## Phase 2: API Endpoint

- [x] 2.1 Create `src/app/api/records/route.ts` with GET handler supporting `?type=` param
- [x] 2.2 Implement query logic: customers & products via Prisma, documents via MCP
- [x] 2.3 Add `normalizeDoc()` helper — maps MCP fields to Dashboard* types
- [x] 2.4 Add error handling for invalid/missing type, server errors

## Phase 3: Dashboard Components

- [x] 3.1 Rewrite `TopCustomers.tsx` — fetch from API + render table
- [x] 3.2 Rewrite `TopProducts.tsx` — fetch from API + render table
- [x] 3.3 Rewrite `RecentInvoices.tsx` — fetch from API + render table
- [x] 3.4 Rewrite `RecentCreditNotes.tsx` — fetch from API + render table
- [x] 3.5 Create `RecentSupportDocuments.tsx` — fetch + render table
- [x] 3.6 Create `RecentAdjustmentNotes.tsx` — fetch + render table
- [x] 3.7 Update `DashboardPanel.tsx` to include DS and NA components
