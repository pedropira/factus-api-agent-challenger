import { Bot } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

const WELCOME_EXAMPLES = [
  { text: "Creá un cliente nuevo", hint: "Carlos Andrés, CC 123456789" },
  { text: "Emití una factura", hint: "para Carlos Pérez, 1 Laptop Gamer" },
  { text: "Buscá un producto", hint: "PROD-001" },
  { text: "Listá las últimas facturas", hint: "o notas crédito" },
];

export function MessageBubble({ message }: MessageBubbleProps) {
  // ── Special: Welcome card ──────────────────────────────────────────────
  if (message.id === "welcome") {
    return (
      <div className="flex justify-center px-2">
        <div className="w-full max-w-lg rounded-2xl border border-line-subtle bg-surface-panel p-6 shadow-lg shadow-factus-deep/10">
          {/* Gradient accent bar */}
          <div className="mb-5 h-1 w-14 rounded-full bg-gradient-to-r from-factus-primary to-factus-accent" />

          {/* Icon + Heading */}
          <div className="mb-5 flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-factus-primary shadow-sm shadow-factus-primary/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-content-primary">
                Agente Factus
              </h2>
              <p className="text-xs text-content-tertiary">
                Facturación Electrónica · DIAN
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="mb-4 text-sm leading-relaxed text-content-secondary">
            ¡Hola! Soy tu agente de facturación electrónica colombiana.
            Estas son algunas cosas que puedo hacer por vos:
          </p>

          {/* Examples grid */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            {WELCOME_EXAMPLES.map((ex) => (
              <div
                key={ex.text}
                className="rounded-xl border border-line-subtle bg-surface-elevated/50 px-3 py-2.5 text-left transition-all duration-150 hover:border-factus-primary/30 hover:bg-factus-primary/5"
              >
                <p className="text-xs font-medium text-content-primary">
                  {ex.text}
                </p>
                <p className="mt-0.5 text-[10px] text-content-tertiary">
                  {ex.hint}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-sm text-content-tertiary">
            ¿En qué te ayudo hoy?
          </p>
        </div>
      </div>
    );
  }

  // ── Regular bubbles ─────────────────────────────────────────────────
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-factus-chat-user text-white"
            : isTool
              ? "bg-surface-elevated font-mono text-xs text-content-tertiary"
              : "bg-factus-chat-agent text-content-primary"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
