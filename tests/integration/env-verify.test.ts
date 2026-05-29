// @vitest-environment node
//
// Integration test: verify ALL required env vars are present and well-formed.
// This is the FIRST test to run — everything else depends on these.

import { describe, it, expect } from "vitest";

const REQUIRED_VARS: Record<string, RegExp> = {
  DATABASE_URL: /^postgresql:\/\//,
  NEXT_PUBLIC_SUPABASE_URL: /^https:\/\/.+\.supabase\.co$/,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: /^eyJ/,
  GOOGLE_GENERATIVE_AI_API_KEY: /^AIza/,
  MCP_SERVER_URL: /^https?:\/\//,
};

describe("Environment variables", () => {
  for (const [varName, pattern] of Object.entries(REQUIRED_VARS)) {
    it(`should have ${varName} set and well-formed`, () => {
      const value = process.env[varName];
      expect(value, `${varName} is not set`).toBeTruthy();
      expect(value, `${varName} does not match expected pattern`).toMatch(pattern);
    });
  }

  it("GROQ_API_KEY is optional but should be present", () => {
    const value = process.env.GROQ_API_KEY;
    expect(value).toBeTruthy();
    expect(value).toMatch(/^gsk_/);
  });
});
