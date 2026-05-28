// Chat pipeline — orchestrates streamText with tools and multi-step calling
//
// Wires together:
//   - Model provider (model.ts)
//   - Agent persona (system-prompt.ts)
//   - MCP tool definitions (mcp-tools.ts)
//   - AI SDK v6 streamText with multi-step support

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
function normalizeParts(
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

export async function runChatPipeline(
  messages: Array<{ id: string; role: string; content?: string; parts?: unknown }>,
) {
  return streamText({
    model: createModel(),
    system: systemPrompt,
    messages: await convertToModelMessages(normalizeParts(messages)),
    tools: mcpToolRegistry,
    stopWhen: stepCountIs(5),
    onStepFinish: ({ toolResults, text }) => {
      console.log(
        `[Chat] Step finished — tools: ${toolResults.length}, text: ${text?.length ?? 0} chars`,
      );
    },
  });
}
