"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "@/lib/types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy tu agente de facturación electrónica.\n\nPuedes pedirme cosas como:\n- *Crear un cliente* → \"Crea un cliente nuevo\"\n- *Facturar* → \"Crea una factura para Carlos Pérez con un Laptop Gamer\"\n- *Consultar* → \"Búscame el producto PROD-001\"\n- *Listar* → \"Muéstrame las últimas facturas\"\n\n¿En qué te ayudo hoy?",
};

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: call api/chat/route.ts with streamText
    // For now, simulate a response
    setTimeout(() => {
      const response: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Todavía estoy en construcción. Pronto podré conectarme al MCP de Factus para crear facturas, clientes y productos. 🏗️",
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 1000);
  }

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
