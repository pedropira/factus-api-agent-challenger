// POST /api/chat — streaming chat endpoint (authenticated)
//
// Accepts UIMessage[] from the client, verifies the session,
// and returns a streaming SSE response via the AI SDK.
// Authenticated users get persistent storage in Supabase.

import { runChatPipeline } from "@/lib/ai/chat-pipeline";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    // Verify session
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

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
