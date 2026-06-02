// Chat pipeline — orchestrates streamText with tools and multi-step calling
//
// Wires together:
//   - Model provider (model.ts)
//   - Agent persona (system-prompt.ts)
//   - MCP tool definitions (mcp-tools.ts)
//   - AI SDK v6 streamText with multi-step support
//
// Persistence is handled client-side in ChatShell (both localStorage
// for anonymous users and Supabase for authenticated users).

import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { createModel } from "./model";
import { systemPrompt } from "./system-prompt";
import { mcpToolRegistry } from "@/lib/mcp-tools";

/**
 * Incoming UIMessage[] from client may have `content` (string) but v6
 * requires `parts` (UIMessagePart[]).  Normalize so convertToModelMessages
 * doesn't crash on undefined `parts`.
 */
export function normalizeParts(
  msgs: Array<{ id: string; role: string; content?: string; parts?: unknown }>,
): UIMessage[] {
  return msgs.map((m) => {
    if (m.parts) return m as unknown as UIMessage;
    return {
      id: m.id,
      role: (["system", "user", "assistant"].includes(m.role)
        ? m.role
        : "user") as "user" | "assistant" | "system",
      parts: [{ type: "text" as const, text: m.content ?? "" }],
    } as UIMessage;
  });
}

/**
 * Keep only the last N full exchanges (user → assistant pairs).
 * Ensures we never cut mid-exchange.
 */
const MAX_EXCHANGES = 8;

export function trimHistory(
  msgs: UIMessage[],
  maxExchanges = MAX_EXCHANGES,
): UIMessage[] {
  const userIndices = msgs
    .map((m, i) => (m.role === "user" ? i : -1))
    .filter((i) => i !== -1);

  if (userIndices.length <= maxExchanges) return msgs;

  // Keep from the (last maxExchanges)th user message onward
  return msgs.slice(userIndices[userIndices.length - maxExchanges]);
}

export async function runChatPipeline(
  messages: Array<{ id: string; role: string; content?: string; parts?: unknown }>,
) {
  const normalized = normalizeParts(messages);
  const trimmed = trimHistory(normalized);

  return streamText({
    model: createModel(),
    system: systemPrompt,
    messages: await convertToModelMessages(trimmed),
    tools: mcpToolRegistry,
    // Stop after 5 rounds of tool calls to prevent infinite loops.
    // The model MUST call tools to answer — if it produces 5 steps
    // with zero tool calls, that's a hallucination signal.
    stopWhen: stepCountIs(5),
    onError: ({ error }) => {
      console.error("[Chat] Error:", error);
    },
    onStepFinish: ({ toolResults, toolCalls, text, stepNumber }) => {
      const calledTools = toolCalls.map((tc) => `${tc.toolName}`);
      console.log(
        `[Chat] Step ${stepNumber} — tools called: ${calledTools.length}`,
      );
      if (calledTools.length > 0) {
        console.log(`  tools: [${calledTools.join(", ")}]`);
        console.log(`  results: ${toolResults.length} successful`);
      } else {
        console.warn(
          `[Chat] ⚠️  Step ${stepNumber} produced NO tool calls — possible hallucination risk`,
        );
      }
    },
  });
}
