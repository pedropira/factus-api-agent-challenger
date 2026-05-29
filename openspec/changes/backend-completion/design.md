# Design: Backend Completion

## Technical Approach

Cinco workstreams independientes que convergen en un backend sólido:

1. **Auth**: Supabase SSR con server/browser client factories + middleware + login page
2. **Chat persistence**: Uncomentar storage-supabase.ts, inyectar userId desde el contexto auth
3. **API protection**: Middleware redirect + route-level session check en /api/chat
4. **Tests**: Vitest con tests unitarios para módulos core
5. **Ops**: Dockerfile multistage + .dockerignore

## Architecture Decisions

### Decision: Supabase SSR client pattern

| Option | Tradeoff |
|--------|----------|
| Single client | No distingue server/browser context |
| **Server + Browser factories** | Más archivos, pero cada uno usa el helper correcto (cookies vs localStorage) |

**Choice**: `src/lib/supabase/server.ts` + `src/lib/supabase/client.ts`, siguiendo la guía oficial de Supabase SSR para Next.js App Router.

**Rationale**: El server client necesita `cookies()` de next/headers para leer la session cookie. El browser client usa `localStorage` del browser. Mezclarlos causa errores de hidratación y runtime.

### Decision: Middleware route protection

| Option | Tradeoff |
|--------|----------|
| Per-route check | Simple pero repetitivo |
| **Middleware + route check** | Dos capas: middleware para redirect, route para API 401 |

**Choice**: Middleware que redirige a `/login` para páginas protegidas, más verificación de sesión en API routes.

**Rationale**: UX limpio — el usuario ve login en vez de JSON 401. Las API routes necesitan su propia verificación porque el middleware no puede retornar JSON fácilmente.

### Decision: Vitest over Jest

| Option | Tradeoff |
|--------|----------|
| Jest | Legacy, necesita ts-jest, más lento |
| **Vitest** | ESM nativo, compatible con Next.js, mismo API que Jest |

**Choice**: Vitest con `@vitejs/plugin-react`.

**Rationale**: Works out of the box with Next.js, faster, same API.

## Data Flow

```
                    ┌─────────────────────────────────┐
                    │         Supabase Auth            │
                    │  (email/password + SSR cookies)   │
                    └────────┬────────────────────────┘
                             │ session
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐          ┌─────────▼─────────┐
     │  middleware.ts   │          │  API route handler │
     │  (page redirect) │          │  (session verify)  │
     └────────┬─────────┘          └─────────┬─────────┘
              │ redirect to /login           │ 401 if no session
              │ if no session                │
              │                              │
     ┌────────▼────────┐                     │
     │  /login page    │                     │
     │  email/pass form│                     │
     └─────────────────┘                     │
                                             │
              ┌──────────────────────────────┘
              │
     ┌────────▼──────────────────────────────┐
     │        chat-pipeline.ts               │
     │  createChatStorage(userId)            │
     └────────┬──────────────────────────────┘
              │
     ┌────────▼────────┐        ┌─────────────────┐
     │ SupabaseChatSt. │        │ LocalStorageChSt │
     │ (authed)        │        │ (anonymous)      │
     └────────┬────────┘        └─────────────────┘
              │
     ┌────────▼────────┐
     │  Supabase DB    │
     │  chat_messages  │
     │  chat_conv       │
     └─────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/supabase/server.ts` | Create | Server-side Supabase client (cookies-based SSR) |
| `src/lib/supabase/client.ts` | Create | Browser-side Supabase client (anon key) |
| `src/middleware.ts` | Create | Auth middleware: redirect /login si no hay session |
| `src/app/(auth)/login/page.tsx` | Create | Login page con email/password form |
| `src/app/(auth)/layout.tsx` | Create | Auth layout (sin sidebar) |
| `src/app/api/auth/login/route.ts` | Create | POST login handler |
| `src/app/api/auth/logout/route.ts` | Create | POST logout handler |
| `src/app/api/auth/session/route.ts` | Create | GET session checker |
| `src/components/auth/AuthProvider.tsx` | Create | React context: user, session, isLoading, signIn, signOut |
| `src/lib/chat/storage-supabase.ts` | Modify | Uncomentar (solo quitar comentarios) |
| `src/lib/chat/storage.ts` | Modify | Factory acepta `userId?: string` |
| `src/app/api/chat/route.ts` | Modify | Verificar session antes de procesar |
| `src/lib/ai/chat-pipeline.ts` | Modify | Aceptar userId opcional, guardar tras cada step |
| `src/components/chat/ChatShell.tsx` | Modify | Envolver en AuthProvider, pasar userId a storage |
| `src/app/layout.tsx` | Modify | Envolver en AuthProvider |
| `src/app/page.tsx` | Modify | (potencial) Mostrar login si no autenticado |
| `vitest.config.ts` | Create | Config Vitest |
| `tests/unit/model.test.ts` | Create | Test model factory |
| `tests/unit/mcp-tools.test.ts` | Create | Test tool schemas |
| `tests/unit/storage-local.test.ts` | Create | Test localStorage storage |
| `tests/unit/mcp-client.test.ts` | Create | Test client init |
| `Dockerfile` | Create | Multistage, node:22-alpine, standalone |
| `.dockerignore` | Create | Docker ignore |
| `package.json` | Modify | Agregar deps: supabase, vitest |

## Interfaces / Contracts

### storage.ts — factory signature change

```typescript
// Before
export function createChatStorage(): ChatStorage

// After
export function createChatStorage(userId?: string, conversationId?: string): ChatStorage
// authed → SupabaseChatStorage(userId, conversationId)
// anon → LocalStorageChatStorage()
```

### chat-pipeline.ts — auth-aware persistence

El pipeline debe persistir mensajes después del primer step (no al final) para que no se pierdan en cold starts. El userId se pasa desde route.ts después de verificar la session.

### AuthProvider context

```typescript
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | model.ts | `createModel()` returns non-null |
| Unit | mcp-tools.ts | Each tool has valid Zod schema |
| Unit | storage-local.ts | Save/load/clear lifecycle |
| Unit | mcp-client.ts | Transport initialization |
| Unit | chat-pipeline.ts | Empty messages validation |

## Migration / Rollout

1. Instalar `@supabase/supabase-js` + `@supabase/ssr` + `vitest` + `@vitejs/plugin-react`
2. Crear tablas `chat_conversations` + `chat_messages` en Supabase (SQL directo, no Prisma migration)
3. Implementar auth (server/browser clients, middleware, login page)
4. Wire up SupabaseChatStorage y modificar factory
5. Agregar tests
6. Crear Dockerfile
7. Verificar `next build`

## Open Questions

None
