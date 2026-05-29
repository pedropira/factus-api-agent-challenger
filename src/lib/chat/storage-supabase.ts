// ChatStorage — Supabase (PostgreSQL) implementation
//
// Stores chat messages per user so they persist across devices.
// Requires auth to be set up — the userId is the Supabase auth user id.

import type { ChatMessage } from "@/lib/types";
import type { ChatStorage } from "./storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export class SupabaseChatStorage implements ChatStorage {
  private supabase = createSupabaseBrowserClient();

  constructor(
    private userId: string,
    private conversationId?: string,
  ) {}

  async load(): Promise<ChatMessage[]> {
    // If no conversationId, get the latest conversation
    if (!this.conversationId) {
      const { data: conv } = await this.supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", this.userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (!conv) return [];
      this.conversationId = conv.id;
    }

    const { data } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", this.conversationId)
      .order("sequence_number", { ascending: true });

    return (data ?? []).map((m) => ({
      id: m.id,
      role: m.role as ChatMessage["role"],
      content: m.content,
      tool_calls: m.tool_calls ?? undefined,
    })) as ChatMessage[];
  }

  async save(messages: ChatMessage[]): Promise<void> {
    if (!this.conversationId) {
      const { data: conv } = await this.supabase
        .from("chat_conversations")
        .insert({ user_id: this.userId, title: "Nueva conversación" })
        .select("id")
        .single();
      if (!conv) throw new Error("Failed to create conversation");
      this.conversationId = conv.id;
    }

    // Prepare rows with explicit sequence numbers
    const rows = messages.map((m, i) => ({
      id: m.id,
      conversation_id: this.conversationId,
      user_id: this.userId,
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls ?? null,
      sequence_number: i,
    }));

    // ATOMIC UPSERT: Inserts or updates matching messages by ID.
    const { error } = await this.supabase
      .from("chat_messages")
      .upsert(rows, { onConflict: "id" });

    if (error) throw error;

    // Prune old messages that are no longer part of this chat session
    const activeIds = messages.map((m) => m.id);
    if (activeIds.length > 0) {
      await this.supabase
        .from("chat_messages")
        .delete()
        .eq("conversation_id", this.conversationId)
        .not("id", "in", `(${activeIds.join(",")})`);
    }

    // Update conversation timestamp
    await this.supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", this.conversationId);
  }

  async clear(): Promise<void> {
    if (!this.conversationId) return;
    await this.supabase
      .from("chat_messages")
      .delete()
      .eq("conversation_id", this.conversationId);
    this.conversationId = undefined;
  }
}
