# Proposal: Dashboard Records API

## Intent

El dashboard lateral muestra placeholders "API de datos pendiente". Necesitamos conectar los componentes del panel a datos reales desde Supabase (PostgreSQL) vía Prisma, exponiendo un endpoint REST que devuelva Top 10 de clientes, productos, facturas recientes, notas crédito, documentos soporte y notas de ajuste.

## Scope

### In Scope
- Agregar modelos `support_document` y `adjustment_note` al schema de Prisma
- Crear `src/app/api/records/route.ts` con GET que consulta Supabase direct (NUNCA vía MCP)
- Endpoints: Top 10 customers, products, recent invoices, credit notes, support documents, adjustment notes
- Conectar `TopCustomers`, `TopProducts`, `RecentInvoices`, `RecentCreditNotes` al endpoint
- Agregar componentes faltantes: `RecentSupportDocuments`, `RecentAdjustmentNotes`
- Tipos compartidos en `src/lib/types.ts` para las respuestas del API
- Manejo de errores y estado vacío en los componentes

### Out of Scope
- Paginación (solo Top 10)
- Mutaciones vía dashboard (solo lectura)
- Historial de conversaciones
- Tests (no hay test runner configurado)

## Capabilities

### New Capabilities
- `dashboard-records`: API REST de solo lectura que expone los registros de Supabase (clientes, productos, facturas, NC, DS, NA) para consumo del frontend.

### Modified Capabilities
- None

## Approach

Arquitectura de tres capas:

```
Supabase (PostgreSQL) ──▶ Prisma ──▶ /api/records ──▶ Dashboard Components
                                                          (fetch client-side)
```

- `GET /api/records?type=customers` → JSON con Top 10 clientes
- `GET /api/records?type=products` → JSON con Top 10 productos
- `GET /api/records?type=invoices` → JSON con últimas 10 facturas
- `GET /api/records?type=credit_notes` → JSON con últimas 10 NC
- `GET /api/records?type=support_documents` → JSON con últimos 10 DS
- `GET /api/records?type=adjustment_notes` → JSON con últimas 10 NA

Cada componente dashboard hace fetch a `fetch(/api/records?type=...)` en el cliente y renderiza una tabla o tarjeta.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Agregar modelos support_document y adjustment_note |
| `src/app/api/records/route.ts` | New | GET handler con query params |
| `src/lib/types.ts` | New | Tipos compartidos API response |
| `src/components/dashboard/TopCustomers.tsx` | Modified | Fetch real + tabla |
| `src/components/dashboard/TopProducts.tsx` | Modified | Fetch real + tabla |
| `src/components/dashboard/RecentInvoices.tsx` | Modified | Fetch real + tabla |
| `src/components/dashboard/RecentCreditNotes.tsx` | Modified | Fetch real + tabla |
| `src/components/dashboard/RecentSupportDocuments.tsx` | New | Componente DS |
| `src/components/dashboard/RecentAdjustmentNotes.tsx` | New | Componente NA |
| `src/components/dashboard/DashboardPanel.tsx` | Modified | Agregar DS + NA |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cambio en schema de Supabase | Low | Usar Prisma como capa de abstracción |
| Timeout en consultas grandes | Low | LIMIT 10, índices en DB |

## Rollback Plan

`git revert HEAD` — los cambios son puramente aditivos (archivos nuevos) más modificaciones a componentes existentes.

## Dependencies

- `DATABASE_URL` en `.env` (ya debería existir para Prisma)
- Prisma generado (`npx prisma generate`)

## Success Criteria

- [ ] `GET /api/records?type=customers` devuelve JSON con clientes
- [ ] `GET /api/records?type=products` devuelve JSON con productos
- [ ] `GET /api/records?type=invoices` devuelve JSON con facturas
- [ ] Dashboard muestra datos reales en lugar de "API de datos pendiente"
- [ ] `tsc --noEmit` sin errores
