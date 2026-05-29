// @vitest-environment node
//
// Integration test: verify auth API routes respond correctly.
// These tests make real HTTP requests to the Next.js dev server.
//
// IMPORTANT: Start the dev server first:
//   npm run dev
// Then run these tests in another terminal:
//   npx vitest run tests/integration/auth-api.test.ts

import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3000";

describe("Auth API routes", () => {
  it("POST /api/auth/logout should return 200 (even without session)", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
  });

  it("GET /api/auth/session should return user as null when not authenticated", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/session`);
    // Session route returns user (null if not authenticated) with 200
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("user");
    expect(data.user).toBeNull();
  });

  it("POST /api/chat should return 401 when not authenticated", async () => {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ id: "1", role: "user", content: "hi" }] }),
    });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
