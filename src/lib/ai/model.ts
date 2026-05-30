// Model provider factory — swap models by changing this file only
//
// Currently uses Google Gemini 2.5 Flash-Lite via Google AI Studio.
// Supported env var: GOOGLE_GENERATIVE_AI_API_KEY
//
// Usage:
//   import { createModel } from "@/lib/ai/model";
//   const model = createModel();

import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  // Uses GOOGLE_GENERATIVE_AI_API_KEY env var by default
});

// To swap provider:
//   return groq("llama-3.1-8b-instant");     // Groq (free)
//   return openai("gpt-4o");                  // OpenAI (paid)
//   return anthropic("claude-3-5-sonnet");    // Anthropic (paid)
// No other file needs to change.

export function createModel() {
  return google("gemini-2.5-flash");
}
