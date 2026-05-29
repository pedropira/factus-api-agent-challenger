# Tasks: Backend Completion

## Phase 1: Foundation

- [ ] 1.1 Install deps: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] 1.2 Install devDeps: `npm install -D vitest @vitejs/plugin-react`
- [ ] 1.3 Create `src/lib/supabase/server.ts` — server-side SSR client con `createServerClient`
- [ ] 1.4 Create `src/lib/supabase/client.ts` — browser client con `createBrowserClient`
- [ ] 1.5 Run SQL en Supabase: tablas `chat_conversations` y `chat_messages` con RLS policies
- [ ] 1.6 Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` al `.env` y documentar

## Phase 2: Auth

- [ ] 2.1 Create `src/middleware.ts` — session check, redirect /login si no autenticado
- [ ] 2.2 Create `src/app/(auth)/login/page.tsx` — login form con email/password + error display
- [ ] 2.3 Create `src/app/(auth)/layout.tsx` — layout minimal sin dashboard sidebar
- [ ] 2.4 Create `src/app/api/auth/login/route.ts` — POST login con `supabase.auth.signInWithPassword`
- [ ] 2.5 Create `src/app/api/auth/logout/route.ts` — POST logout con `supabase.auth.signOut`
- [ ] 2.6 Create `src/app/api/auth/session/route.ts` — GET devuelve `{ user }` o `{ user: null }`
- [ ] 2.7 Create `src/components/auth/AuthProvider.tsx` — React context: user, session, isLoading, signIn, signOut

## Phase 3: Chat Persistence

- [ ] 3.1 Modify `src/lib/chat/storage-supabase.ts` — uncomentar TODO el archivo (es implementación completa)
- [ ] 3.2 Modify `src/lib/chat/storage.ts` — factory acepta `userId?: string`, retorna SupabaseChatStorage cuando hay userId
- [ ] 3.3 Modify `src/app/api/chat/route.ts` — verificar session con server client, pasar userId + conversationId al pipeline
- [ ] 3.4 Modify `src/lib/ai/chat-pipeline.ts` — aceptar `userId` opcional, persistir mensajes post-step via storage.save()
- [ ] 3.5 Modify `src/app/layout.tsx` — envolver en `<AuthProvider>`
- [ ] 3.6 Modify `src/components/chat/ChatShell.tsx` — usar `useAuth()` para userId, pasarlo a createChatStorage, actualizar persistencia post-stream

## Phase 4: Testing

- [ ] 4.1 Create `vitest.config.ts` — config con plugin-react, path alias @/
- [ ] 4.2 Create `tests/unit/model.test.ts` — test `createModel()` returns non-null
- [ ] 4.3 Create `tests/unit/mcp-tools.test.ts` — test all 25+ tools have valid Zod schemas
- [ ] 4.4 Create `tests/unit/storage-local.test.ts` — test save/load/clear lifecycle + Zod validation
- [ ] 4.5 Create `tests/unit/mcp-client.test.ts` — test transport init (mock StreamableHTTPClientTransport)
- [ ] 4.6 Create `tests/unit/chat-pipeline.test.ts` — test empty messages validation

## Phase 5: Ops

- [ ] 5.1 Create `Dockerfile` — multistage: node:22-alpine, `next build`, `next start` standalone
- [ ] 5.2 Create `.dockerignore` — node_modules, .next, .git, etc.

## Phase 6: Integration & Build

- [ ] 6.1 Run `npx tsc --noEmit` y fix errores de tipos
- [ ] 6.2 Run `npm run build` y fix errores de build
- [ ] 6.3 Run `npx vitest run` — todos los tests pasan
