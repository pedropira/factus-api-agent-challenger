// POST /api/chat — streaming chat endpoint
//
// Accepts UIMessage[] from the client and returns a streaming SSE response
// via the AI SDK's toUIMessageStreamResponse().

import { runChatPipeline } from "@/lib/ai/chat-pipeline";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages as
      | Array<{ id: string; role: string; content?: string; parts?: unknown }>
      | undefined;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array is required" }, { status: 400 });
    }

    const result = await runChatPipeline(messages);
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Chat Route]", error);
    const message =
      error instanceof Error ? error.message : "Chat service unavailable";
    return Response.json({ error: message }, { status: 500 });
  }
}
