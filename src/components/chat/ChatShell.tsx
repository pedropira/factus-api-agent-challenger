"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "@/lib/types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy tu agente de facturación electrónica.\n\nPuedes pedirme cosas como:\n- *Crear un cliente* → \"Crea un cliente nuevo\"\n- *Facturar* → \"Crea una factura para Carlos Pérez con un Laptop Gamer\"\n- *Consultar* → \"Búscame el producto PROD-001\"\n- *Listar* → \"Muéstrame las últimas facturas\"\n\n¿En qué te ayudo hoy?",
};

/**
 * Parse a single SSE line from the UI message stream.
 * Format: "data: {"type":"text-delta","id":"txt-0","delta":"text"}"
 * Other types: start, start-step, text-start, text-end, finish-step, finish, error
 */
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

/** Check if an SSE line signals an error. */
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

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

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

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

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
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
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
            // Check for errors first
            const err = getSSEError(line);
            if (err) lastError = err;

            // Accumulate text deltas
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

        // If we got no text at all but there was an error, show it
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
        console.error("[ChatShell]", error);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    m.content || `Error: ${(error as Error).message ?? "Chat unavailable"}`,
                }
              : m,
          ),
        );
      } finally {
        abortRef.current = null;
        setIsLoading(false);
      }
    },
    [input, isLoading],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          Factus Agent
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Facturación electrónica colombiana
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-zinc-400 px-4">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse delay-150">●</span>
            <span className="animate-pulse delay-300">●</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200 dark:border-zinc-700 p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Crea una factura para Carlos Pérez..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
