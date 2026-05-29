// ChatStorage — localStorage implementation
// Messages survive page reload but NOT across devices or browser resets.

import { z } from "zod";
import type { ChatMessage } from "@/lib/types";
import type { ChatStorage } from "./storage";

const STORAGE_KEY = "factus-chat-messages";

const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string(),
  tool_calls: z.array(
    z.object({
      name: z.string(),
      args: z.record(z.unknown()),
      result: z.string().optional(),
    })
  ).optional(),
});

const chatMessagesListSchema = z.array(chatMessageSchema);

export class LocalStorageChatStorage implements ChatStorage {
  async load(): Promise<ChatMessage[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const validation = chatMessagesListSchema.safeParse(parsed);
      if (!validation.success) {
        console.warn("[ChatStorage] Stale or invalid storage data schema. Cleaning chat history.");
        return [];
      }
      return validation.data;
    } catch (e) {
      console.warn("[ChatStorage] Failed to load messages:", e);
      return [];
    }
  }

  async save(messages: ChatMessage[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("[ChatStorage] Failed to save messages:", e);
    }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
