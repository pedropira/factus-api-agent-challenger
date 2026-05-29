// Chat Storage — abstraction layer for message persistence
//
// Usage:
//   const storage = createChatStorage(userId);
//   const messages = await storage.load();
//   await storage.save(messages);
//   await storage.clear();
//
// Backend selection:
//   - When userId is provided → Supabase (multi-device, persistent)
//   - When userId is omitted  → localStorage (anonymous, single-device)

import type { ChatMessage } from "@/lib/types";

export interface ChatStorage {
  /** Load persisted messages (returns empty array if none) */
  load(): Promise<ChatMessage[]>;

  /** Persist messages (full replacement — all or nothing) */
  save(messages: ChatMessage[]): Promise<void>;

  /** Delete all persisted messages */
  clear(): Promise<void>;
}

// ── Factory ──────────────────────────────────────────────────────────────

import { SupabaseChatStorage } from "./storage-supabase";
import { LocalStorageChatStorage } from "./storage-local";

let _localInstance: ChatStorage | null = null;

export function createChatStorage(
  userId?: string,
  conversationId?: string,
): ChatStorage {
  if (userId) {
    return new SupabaseChatStorage(userId, conversationId);
  }
  if (!_localInstance) {
    _localInstance = new LocalStorageChatStorage();
  }
  return _localInstance;
}
