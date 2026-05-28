# Tasks: LLM Integration & Chat Route

## Phase 1: AI Foundation Layer

- [x] 1.1 Create `src/lib/ai/` directory and `src/lib/ai/model.ts` with `createModel()` factory exporting `google('gemini-1.5-flash')`
- [x] 1.2 Create `src/lib/ai/system-prompt.ts` with `systemPrompt` string — agent persona, Factus rules, tool usage guidelines
- [x] 1.3 Create `src/lib/ai/chat-pipeline.ts` with `runChatPipeline(messages)` — imports `model`, `systemPrompt`, `mcpToolRegistry` and calls `streamText` with `stopWhen: stepCountIs(5)`

## Phase 2: API Route

- [x] 2.1 Create `src/app/api/chat/route.ts` with `POST` handler — parse body, validate `messages`, call `runChatPipeline`, return `result.toUIMessageStreamResponse()`, error boundary with 400/500
- [x] 2.2 Verify: `npx tsc --noEmit` passes with new files

## Phase 3: Client Integration

- [x] 3.1 Rewrite `ChatShell.tsx` `handleSubmit` — replace `setTimeout` mock with `fetch('/api/chat', { method: 'POST', body: JSON.stringify })` and `response.body.getReader()` for SSE streaming
- [x] 3.2 Implement stream parser in `ChatShell` — parse `0:` text deltas from the SSE stream and update messages state in real-time
- [x] 3.3 Update `MessageBubble.tsx` — tool role handling already present

## Phase 4: Config & Verify

- [ ] 4.1 Add `GOOGLE_GENERATIVE_AI_API_KEY=your_key_here` to `.env`
- [ ] 4.2 Final verification: `npx tsc --noEmit`, start dev server, test with curl `POST /api/chat` with a test message
- [ ] 4.3 Commit: `feat: integrate Gemini LLM with MCP tool calling via AI SDK v6`
