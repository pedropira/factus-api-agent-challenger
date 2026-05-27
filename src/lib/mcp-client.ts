import {
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const MCP_SERVER_URL =
  process.env.MCP_SERVER_URL ??
  "https://factus-mcp-server-challenge.onrender.com/api";

// Singleton client — survives across requests for session reuse
let client: Client | null = null;
let transport: StreamableHTTPClientTransport | null = null;
let toolsCache: Tool[] | null = null;

function createTransport(): StreamableHTTPClientTransport {
  return new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), {
    requestInit: {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  });
}

export async function getMcpClient(): Promise<Client> {
  if (client && transport) return client;

  transport = createTransport();
  client = new Client(
    { name: "factus-agent", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  // Invalidate cache on reconnect
  toolsCache = null;
  return client;
}

export async function getMcpTools(): Promise<Tool[]> {
  if (toolsCache) return toolsCache;

  const c = await getMcpClient();
  const result = await c.listTools();
  toolsCache = result.tools;
  return result.tools;
}

export async function callMcpTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown>
): Promise<T> {
  const c = await getMcpClient();
  const result = await c.callTool({
    name: toolName,
    arguments: args,
  });
  return result.content as T;
}

/**
 * Health check / keep-alive.
 * Call this periodically (every 4 min) to prevent Render free-tier spin-down.
 */
export async function pingMcpServer(): Promise<boolean> {
  try {
    const c = await getMcpClient();
    await c.ping();
    return true;
  } catch {
    // Server was probably sleeping — reset so next call reconnects
    client = null;
    transport = null;
    toolsCache = null;
    return false;
  }
}

/**
 * Force-reset the client. Useful after a cold start failure.
 */
export function resetMcpClient(): void {
  client = null;
  transport = null;
  toolsCache = null;
}
