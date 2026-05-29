"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { createChatStorage } from "@/lib/chat/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWorkspace } from "@/context/workspace-context";
import { Bot, SendHorizonal, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "¡Hola! Soy tu agente de facturación electrónica. ¿En qué te ayudo hoy?",
};

function parseSSELine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) return null;

  const payload = trimmed.slice(6);
  if (payload === "[DONE]") return null;

  try {
    const parsed = JSON.parse(payload);
    if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
      return parsed.delta;
    }
    return null;
  } catch {
    return null;
  }
}

function getSSEError(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) return null;

  try {
    const parsed = JSON.parse(trimmed.slice(6));
    if (parsed.type === "error") return parsed.errorText ?? "Unknown error";
    return null;
  } catch {
    return null;
  }
}

function withoutWelcome(msgs: ChatMessage[]): ChatMessage[] {
  return msgs.filter((m) => m.id !== "welcome");
}

export function CoPilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  const storageRef = useRef(createChatStorage());
  const { user } = useAuth();

  // ── Context integration ────────────────────────────────────────────────
  const { chatInputValue, setChatInputValue, triggerRefresh } = useWorkspace();
  const prevInputRef = useRef(chatInputValue);
  const refreshFiredRef = useRef(false);

  messagesRef.current = messages;

  // Sync context chatInputValue → local input state
  useEffect(() => {
    if (chatInputValue && chatInputValue !== prevInputRef.current) {
      setInput(chatInputValue);
      prevInputRef.current = chatInputValue;
    }
  }, [chatInputValue]);

  // ── Storage ────────────────────────────────────────────────────────────
  useEffect(() => {
    storageRef.current = createChatStorage(user?.id);
    storageRef.current.load().then((saved) => {
      setMessages(saved.length > 0 ? saved : [WELCOME_MESSAGE]);
      setLoaded(true);
    });
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── New chat ──────────────────────────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    await storageRef.current.clear();
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setChatInputValue("");
  }, [setChatInputValue]);

  // ── Send message ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const currentMessages = messagesRef.current;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input,
      };

      const nextMessages = [...currentMessages, userMessage];

      setMessages(nextMessages);
      setInput("");
      setChatInputValue("");
      setIsLoading(true);
      refreshFiredRef.current = false;

      storageRef.current.save(withoutWelcome(nextMessages));

      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...currentMessages, userMessage].map((m) => ({
              id: m.id,
              role: m.role === "tool" ? "assistant" : m.role,
              content: m.content,
              parts: [{ type: "text" as const, text: m.content }],
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let lastError: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const err = getSSEError(line);
            if (err) lastError = err;

            const text = parseSSELine(line);
            if (text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + text }
                    : m,
                ),
              );
            }
          }
        }

        if (lastError) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId && !m.content
                ? { ...m, content: `Error: ${lastError}` }
                : m,
            ),
          );
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("[CoPilotChat]", error);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    m.content ||
                    `Error: ${(error as Error).message ?? "Chat no disponible"}`,
                }
              : m,
          ),
        );
      } finally {
        abortRef.current = null;
        setIsLoading(false);
        storageRef.current.save(withoutWelcome(messagesRef.current));

        // ── Trigger refresh on CRUD completion ─────────────────────────
        if (!refreshFiredRef.current) {
          refreshFiredRef.current = true;
          triggerRefresh();
        }
      }
    },
    [input, isLoading, setChatInputValue, triggerRefresh],
  );

  return (
    <div className="flex h-full flex-col bg-surface-panel">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-line-default px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-factus-primary/20">
            <Bot className="h-4 w-4 text-factus-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-content-primary">
              Agente Factus
            </h1>
            <p className="flex items-center gap-1 text-[10px] text-content-tertiary">
              <Sparkles className="h-3 w-3 text-factus-accent" />
              Gemini 1.5 Flash · Facturación Electrónica
            </p>
          </div>
        </div>
        {loaded && messages.length > 0 && messages[0].id !== "welcome" && (
          <button
            type="button"
            onClick={handleNewChat}
            disabled={isLoading}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium text-content-tertiary transition-colors hover:bg-overlay-hover hover:text-content-primary disabled:opacity-30"
          >
            ✕ Nuevo
          </button>
        )}
      </header>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!loaded && (
          <p className="pt-8 text-center text-xs italic text-content-tertiary">
            Cargando conversación...
          </p>
        )}
        {loaded &&
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        {isLoading && (
          <div className="flex items-center gap-2 px-4 text-sm text-content-tertiary">
            <span className="h-2 w-2 animate-bounce rounded-full bg-factus-accent/60" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-factus-accent/40 [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-factus-accent/20 [animation-delay:0.3s]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-line-default p-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-line-subtle bg-surface-input px-3 py-2 transition-colors focus-within:border-factus-accent/40 focus-within:ring-1 focus-within:ring-factus-accent/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu consulta..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-content-primary placeholder-content-tertiary outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-factus-primary text-white transition-colors hover:bg-factus-primary-hover disabled:opacity-40"
          >
            <SendHorizonal className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
