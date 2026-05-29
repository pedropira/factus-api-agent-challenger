# Proposal: Backend Completion

## Intent

Cero tests, sin auth, chat persistence en localStorage (se pierde al limpiar), sin Dockerfile, sin build verificado. El backend tiene que estar sólido antes de tocar el frontend.

## Scope

### In Scope
- Supabase Auth: login, middleware, session management, API route protection
- Supabase chat persistence: uncomentar storage-supabase.ts, wire factory, create DB tables
- Test infrastructure: Vitest + tests para core backend modules (model, pipeline, MCP, types)
- Dockerfile multistage para Next.js 16 standalone output
- Build verification: `next build` pasa sin errores

### Out of Scope
- UI polish (Dashboard, login page design)
- Social login providers (solo email/password)
- E2E tests (Playwright/Cypress)
- CI/CD pipeline
- Rate limiting

## Capabilities

### New Capabilities
- `user-auth`: Autenticación con Supabase Auth (email/password), protección de rutas vía middleware, sesión persistente con cookies, contexto de usuario en React.
- `backend-testing`: Test runner con Vitest, tests unitarios para mcp-client, mcp-tools, chat-pipeline, model, storage.

### Modified Capabilities
- `chat-agent`: Nueva requirement — cuando el usuario está autenticado, los mensajes se persisten en Supabase vía `SupabaseChatStorage`. Cuando no, se usa localStorage (fallback actual). La factory `createChatStorage()` acepta un `userId` opcional.

## Approach

Cinco workstreams paralelos:

1. **Auth**: `@supabase/supabase-js` + `@supabase/ssr`. Server client + browser client factory. Middleware que redirige a `/login` si no hay sesión. Login page básica. API routes protegidas.
2. **Chat persistence**: Crear tabla `chat_conversations` + `chat_messages` en Supabase. Uncomentar `storage-supabase.ts`. Modificar factory `storage.ts` para aceptar `userId`.
3. **Tests**: `vitest` + `@vitejs/plugin-react`. Tests para model.ts, chat-pipeline.ts, mcp-tools.ts, mcp-client.ts, storage-local.ts. Config en `vitest.config.ts`.
4. **Dockerfile**: Multistage con `node:22-alpine`, standalone output, healthcheck.
5. **Build**: Fix errores que surjan de `next build`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Agregar supabase, vitest |
| `src/lib/chat/storage-supabase.ts` | Modified | Uncomentar + implementar |
| `src/lib/chat/storage.ts` | Modified | Factory acepta userId |
| `src/middleware.ts` | New | Auth middleware |
| `src/lib/supabase/` | New | Server + browser clients |
| `src/app/(auth)/login/page.tsx` | New | Login page |
| `src/app/api/auth/` | New | Auth API routes |
| `vitest.config.ts` | New | Test config |
| `tests/` | New | Test files |
| `Dockerfile` | New | Multistage build |
| `.dockerignore` | New | Docker ignore |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| next build rompe por tipos o imports | Medium | Fix incremental, probar temprano |
| Supabase schema no coincide con Prisma | Low | Usar SQL directo para chat tables |
| Render cold start en tests de integración | Low | Tests unitarios, no de integración |

## Rollback Plan

`git revert HEAD` — workstreams son aditivos (archivos nuevos + modificaciones aisladas).

## Dependencies

- Cuenta Supabase (ya configurada, DATABASE_URL en .env)
- `@supabase/supabase-js` + `@supabase/ssr` (instalar)
- `vitest` + `@vitejs/plugin-react` (instalar)

## Success Criteria

- [ ] Login con email/password funciona y redirige al home
- [ ] Middleware protege rutas autenticadas
- [ ] API routes verifican sesión
- [ ] Chat messages persisten en Supabase post-login
- [ ] Chat messages usan localStorage pre-login
- [ ] `vitest run` pasa con al menos 5 tests
- [ ] `next build` pasa sin errores (0 errores TypeScript)
- [ ] Dockerfile produce imagen funcional
