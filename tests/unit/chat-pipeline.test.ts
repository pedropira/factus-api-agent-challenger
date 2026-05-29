import { describe, it, expect } from "vitest";
import { normalizeParts, trimHistory } from "@/lib/ai/chat-pipeline";
import type { UIMessage } from "ai";

describe("normalizeParts", () => {
  it("should add parts to messages that lack them", () => {
    const result = normalizeParts([
      { id: "1", role: "user", content: "hello" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].parts).toBeDefined();
    expect(Array.isArray(result[0].parts)).toBe(true);
    // The normalized parts should include the text
    const firstPart = result[0].parts?.[0];
    expect(firstPart).toBeDefined();
    if (firstPart && "text" in firstPart) {
      expect(firstPart.text).toBe("hello");
    }
  });

  it("should keep existing parts intact", () => {
    const result = normalizeParts([
      {
        id: "1",
        role: "user",
        parts: [{ type: "text" as const, text: "hey" }],
      },
    ]);
    expect(result[0].parts).toHaveLength(1);
  });

  it("should normalize role to valid values", () => {
    const result = normalizeParts([
      { id: "1", role: "system", content: "beep" },
    ]);
    expect(["system", "user", "assistant"]).toContain(result[0].role);
  });
});

describe("trimHistory", () => {
  function makeMsg(
    id: string,
    role: "user" | "assistant",
  ): UIMessage {
    // Return only the parts that UIMessage expects
    return {
      id,
      role,
      parts: [{ type: "text" as const, text: id }],
    } as unknown as UIMessage;
  }

  it("should keep messages when under max exchanges", () => {
    const msgs = [makeMsg("1", "user"), makeMsg("2", "assistant")];
    const trimmed = trimHistory(msgs, 4);
    expect(trimmed).toHaveLength(2);
  });

  it("should trim when over max exchanges", () => {
    const msgs = [
      makeMsg("q1", "user"),
      makeMsg("a1", "assistant"),
      makeMsg("q2", "user"),
      makeMsg("a2", "assistant"),
      makeMsg("q3", "user"),
      makeMsg("a3", "assistant"),
    ];
    const trimmed = trimHistory(msgs, 2);
    expect(trimmed).toHaveLength(4); // 2 exchanges = 4 messages (2 user + 2 assistant)
  });

  it("should return full array when exactly at limit", () => {
    const msgs = [makeMsg("q1", "user"), makeMsg("a1", "assistant")];
    const trimmed = trimHistory(msgs, 2);
    expect(trimmed).toHaveLength(2);
  });
});
