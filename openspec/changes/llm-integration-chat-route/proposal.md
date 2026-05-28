# Proposal: LLM Integration & Chat Route

## Intent

Conectar el agente de facturación electrónica con Gemini 1.5 Flash via AI SDK v6
para que el chat funcione con lenguaje natural. Hoy las MCP tools existen pero
nadie las llama — el chat simula respuestas con un `setTimeout`.

## Scope

### In Scope

- Crear `src/lib/ai/model.ts` — factory del modelo Gemini (desacoplado)
- Crear `src/lib/ai/system-prompt.ts` — system prompt del agente
- Crear `src/lib/ai/chat-pipeline.ts` — orquestación streamText + tools
- Crear `src/app/api/chat/route.ts` — POST handler con streaming
- Modificar `ChatShell.tsx` — conectar al endpoint real
- Configurar `.env` con `GOOGLE_GENERATIVE_AI_API_KEY`
- `tsc --noEmit` pasando

### Out of Scope

- Dashboard records route (otro cambio)
- Health-check cron (otro cambio)
- Tests (no hay test runner configurado)
- Historial de conversaciones en DB

## Capabilities

### New Capabilities

- `chat-agent`: Conversación con IA que entiende facturación colombiana, infiere
  intención del usuario, y llama MCP tools para crear/buscar clientes, productos,
  facturas, notas crédito, documentos soporte y notas de ajuste.

### Modified Capabilities

- None

## Approach

Arquitectura en capas con separación de responsabilidades:

```
src/lib/ai/
  model.ts          ← Factory: export google('gemini-1.5-flash')
  system-prompt.ts  ← System prompt: persona, reglas, contexto
  chat-pipeline.ts  ← Orquesta streamText + tools + steps

src/app/api/chat/route.ts  ← Thin HTTP: recibe → llama pipeline → stream
```

El pipeline usa `stopWhen: isStepCount(5)` para multi-step tool calling
automático. El cliente (ChatShell) recibe un SSE stream via
`toUIMessageStreamResponse()`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/ai/model.ts` | New | Factory del modelo Gemini |
| `src/lib/ai/system-prompt.ts` | New | System prompt del agente |
| `src/lib/ai/chat-pipeline.ts` | New | Orquestación streamText |
| `src/app/api/chat/route.ts` | New | POST handler con streaming |
| `src/components/chat/ChatShell.tsx` | Modified | Conectar endpoint real |
| `.env` | New | GOOGLE_GENERATIVE_AI_API_KEY |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| MCP cold start ~50s | High | Timeout largo + mensaje de "calentando servidor" |
| Rate limit Gemini free | Medium | Cache de respuestas + fallback instructivo |
| AI SDK v6 API sutil | Low | Ya validamos `inputSchema` funciona |

## Rollback Plan

Revertir commit: `git revert HEAD` elimina todos los archivos nuevos y
restaura ChatShell.tsx a su estado anterior.

## Dependencies

- `GOOGLE_GENERATIVE_AI_API_KEY` en `.env` (el usuario debe proveerla)
- MCP server disponible (factus-mcp-server-challenge.onrender.com)

## Success Criteria

- [ ] `tsc --noEmit` sin errores
- [ ] POST `/api/chat` responde con SSE streaming
- [ ] ChatShell recibe y renderiza respuestas del endpoint
- [ ] El agente llama MCP tools automáticamente (ej: "busca el producto PROD-001")
