// Model provider factory — swap models by changing this file only
//
// Currently uses Groq (free, fast inference via LPU hardware).
// Supported env var: GROQ_API_KEY
//
// Usage:
//   import { createModel } from "@/lib/ai/model";
//   const model = createModel();

import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  // Uses GROQ_API_KEY env var by default
});

// Groq models (free tier TPD limits vary):
//   llama-3.3-70b-versatile  → 100K TPD
//   llama-3.1-8b-instant     → 1M TPD (recomendado para pruebas)
//   mixtral-8x7b-32768       → 100K TPD
//   gemma2-9b-it             → 100K TPD
//
// To swap provider:
//   return google("gemini-2.0-flash");       // Google AI Studio
//   return openai("gpt-4o");                  // OpenAI (paid)
//   return anthropic("claude-3-5-sonnet");    // Anthropic (paid)
// No other file needs to change.

export function createModel() {
  return groq("llama-3.1-8b-instant");
}
