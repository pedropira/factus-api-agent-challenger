# Design: LLM Integration & Chat Route

## Technical Approach

Three-layer AI module (`src/lib/ai/`) that separates model config, system
prompt, and pipeline orchestration. The route handler is a thin HTTP wrapper.
Client consumes the SSE stream with manual fetch + ReadableStream reader for
full control over rendering tool calls vs text.

## Architecture Decisions

### Decision: Layered AI module (model / prompt / pipeline)

| Option | Tradeoff |
|--------|----------|
| All-in-one route.ts | Simple but couples HTTP, model, prompt |
| **Three-layer separation** | More files, but each is testable and swappable |

**Choice**: Three-layer `src/lib/ai/{model, system-prompt, chat-pipeline}.ts`
**Rationale**: User requirement — swap model by editing one file, system prompt
reusable across models, pipeline independently testable.

### Decision: Manual fetch for client streaming

| Option | Tradeoff |
|--------|----------|
| `useChat` from ai/react | Fast setup but less control over tool call rendering |
| **Manual fetch + ReadableStream** | More code, but full control over UI rendering |

**Choice**: Manual fetch with `response.body.getReader()` + `TextDecoder`
**Rationale**: Agent-First UI needs to render tool calls visually (name, args,
result) alongside text. `useChat` abstracts this away.

### Decision: streamText with tools from mcpToolRegistry

**Choice**: Pass `mcpToolRegistry` directly to `streamText({ tools })`
**Rationale**: Already exists, already typed with `inputSchema` (v6 compat),
contains all 29 tools. No mapping layer needed.

## Data Flow

```
ChatShell (client)                    route.ts (server)
      │                                     │
      │  POST /api/chat                      │
      │  { messages: [...] }                 │
      └─────────────────────────────────────►│
                                             │
      │                          chat-pipeline.ts
      │                           ├─ createModel() → Gemini
      │                           ├─ systemPrompt  → agent persona
      │                           ├─ mcpToolRegistry → 29 tools
      │                           └─ streamText({...stopWhen:5})
      │                                     │
      │  SSE stream ← toUIMessageStreamResponse()
      │◄─────────────────────────────────────┘
      │
      │  ReadableStream reader
      │  Parse text/tool-call/tool-result parts
      │  Update React state → render
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/ai/model.ts` | Create | `createModel()` factory — `google('gemini-1.5-flash')` |
| `src/lib/ai/system-prompt.ts` | Create | System prompt: persona, reglas, contexto Factus |
| `src/lib/ai/chat-pipeline.ts` | Create | `runChatPipeline(messages)` → `streamText({...})` |
| `src/app/api/chat/route.ts` | Create | POST handler, maxDuration 30, error boundary |
| `src/components/chat/ChatShell.tsx` | Modify | Replace mock setTimeout with real fetch + stream reader |
| `.env` | Modify | Add `GOOGLE_GENERATIVE_AI_API_KEY` |

## Interfaces / Contracts

### model.ts

```typescript
import { google } from '@ai-sdk/google';

export function createModel() {
  return google('gemini-1.5-flash');
  // Swap: return openai('gpt-4o'); — only line to change
}
```

### system-prompt.ts

```typescript
export const systemPrompt = `
Eres un agente de facturación electrónica colombiana (Factus DIAN).
Usas herramientas MCP para crear y gestionar facturas, clientes, productos,
notas crédito, documentos soporte y notas de ajuste.

REGLAS:
- NUNCA inventes datos. Siempre busca clientes/productos existentes.
- Si no encuentras un cliente, pide al usuario los datos completos.
- Los precios en las tools incluyen IVA (bruto).
- Para crear facturas usa create_invoice_with_numbering con numbering_range_id.
- Responde siempre en el mismo idioma del usuario.
`;
```

### chat-pipeline.ts

```typescript
import { streamText, convertToModelMessages, isStepCount } from 'ai';
import { createModel } from './model';
import { systemPrompt } from './system-prompt';
import { mcpToolRegistry } from '@/lib/mcp-tools';

export async function runChatPipeline(messages: UIMessage[]) {
  return streamText({
    model: createModel(),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: mcpToolRegistry,
    stopWhen: isStepCount(5),
    onStepFinish: ({ toolResults, text }) => {
      console.log(`[Step] tools:${toolResults.length} text:${text?.length}`);
    },
  });
}
```

### route.ts

```typescript
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages?.length) {
      return Response.json({ error: 'messages required' }, { status: 400 });
    }
    const result = await runChatPipeline(messages);
    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error('[Chat]', e);
    return Response.json({ error: 'Chat unavailable' }, { status: 500 });
  }
}
```

### ChatShell client streaming

```typescript
const res = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages: allMessages }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE events: 0:text, 1:tool-call, 2:tool-result
  // Update state via onChunk callback
}
```

## Testing Strategy

No test runner configured. Verification via `tsc --noEmit` + manual curl:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola"}]}'
```

## Migration / Rollout

No migration required. New files only + one modified component.

## Open Questions

None
