// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageChatStorage } from "@/lib/chat/storage-local";

describe("LocalStorageChatStorage", () => {
  let storage: LocalStorageChatStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageChatStorage();
  });

  it("should return empty array when no messages saved", async () => {
    const messages = await storage.load();
    expect(messages).toEqual([]);
  });

  it("should save and load messages", async () => {
    const testMessages = [
      { id: "1", role: "user" as const, content: "Hola" },
      { id: "2", role: "assistant" as const, content: "¿En qué te ayudo?" },
    ];

    await storage.save(testMessages);
    const loaded = await storage.load();

    expect(loaded).toHaveLength(2);
    expect(loaded[0].content).toBe("Hola");
    expect(loaded[1].content).toBe("¿En qué te ayudo?");
  });

  it("should clear all messages", async () => {
    await storage.save([{ id: "1", role: "user" as const, content: "test" }]);
    await storage.clear();
    const loaded = await storage.load();
    expect(loaded).toEqual([]);
  });

  it("should use the correct storage key", async () => {
    await storage.save([{ id: "1", role: "user" as const, content: "test" }]);
    expect(localStorage.getItem("factus-chat-messages")).not.toBeNull();
  });
});
