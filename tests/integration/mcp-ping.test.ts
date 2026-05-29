// @vitest-environment node
//
// Integration test: verify MCP server connectivity using Streamable HTTP.
// The MCP server uses session-based protocol — must initialize first.
//
// Flow:
//   1. POST initialize → get mcp-session-id header
//   2. POST notifications/initialized → ack the session
//   3. POST ping → verify server responds
//
// NOTE: First run takes ~50s (Render cold start). Subsequent runs ~2-5s.

import { describe, it, expect, beforeAll } from "vitest";

const MCP_URL = process.env.MCP_SERVER_URL!;
const TIMEOUT_MS = 120_000;

type McpResponse = {
  status: number;
  headers: Record<string, string>;
  body: any;
};

async function mcpRequest(
  body: object,
  sessionId?: string,
): Promise<McpResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
  }

  const response = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const headersObj: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  let responseBody: any = null;
  const text = await response.text();
  if (text) {
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }
  }

  return { status: response.status, headers: headersObj, body: responseBody };
}

describe("MCP Server (Streamable HTTP)", () => {
  let sessionId: string;

  beforeAll(async () => {
    // Step 1: Initialize — creates a session
    const initResult = await mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "0.1.0",
        capabilities: {},
        clientInfo: { name: "factus-agent-test", version: "1.0.0" },
      },
    });

    expect(initResult.status).toBe(200);
    sessionId = initResult.headers["mcp-session-id"];
    expect(sessionId, "Server should return mcp-session-id").toBeTruthy();

    // Verify initialize response structure
    expect(initResult.body).toHaveProperty("result");
    expect(initResult.body.result).toHaveProperty("protocolVersion");
    expect(initResult.body.result).toHaveProperty("serverInfo");
    expect(initResult.body.result.serverInfo.name).toBe("Factus MCP Server");

    // Step 2: Send initialized notification
    const notifResult = await mcpRequest(
      { jsonrpc: "2.0", method: "notifications/initialized" },
      sessionId,
    );
    // Streamable HTTP returns 202 for notifications with no content expected
    expect([200, 202]).toContain(notifResult.status);
  }, TIMEOUT_MS);

  it(
    "should respond to ping with the established session",
    async () => {
      const result = await mcpRequest(
        { jsonrpc: "2.0", id: 2, method: "ping" },
        sessionId,
      );

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("jsonrpc", "2.0");
      expect(result.body).toHaveProperty("id", 2);
      expect(result.body).not.toHaveProperty("error");
      expect(result.body).toHaveProperty("result");
    },
    TIMEOUT_MS,
  );

  it(
    "should expose tools via JSON-RPC",
    async () => {
      const result = await mcpRequest(
        { jsonrpc: "2.0", id: 3, method: "tools/list" },
        sessionId,
      );

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("result");
      expect(result.body.result).toHaveProperty("tools");
      expect(Array.isArray(result.body.result.tools)).toBe(true);

      const toolNames = result.body.result.tools.map(
        (t: any) => t.name,
      );
      expect(toolNames.length).toBeGreaterThan(20);

      // Verify expected core tools exist
      expect(toolNames).toContain("create_invoice_with_numbering");
      expect(toolNames).toContain("search_customers");
      expect(toolNames).toContain("search_products");
      expect(toolNames).toContain("get_default_numbering_range");
      expect(toolNames).toContain("get_company_info");
    },
    TIMEOUT_MS,
  );

  it(
    "should reject uninitialized requests",
    async () => {
      // Sending a request without session ID should fail
      const result = await mcpRequest({
        jsonrpc: "2.0",
        id: 99,
        method: "ping",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
      expect(result.body.error).toHaveProperty("code");
      expect(result.body.error).toHaveProperty(
        "message",
        expect.stringMatching(/session/i),
      );
    },
    TIMEOUT_MS,
  );
});
