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

// Lock to prevent race condition when multiple concurrent requests
// try to initialize the client simultaneously.
let initLock: Promise<void> | null = null;

// Promise chain to serialize MCP tool calls.
// Streamable HTTP transport doesn't support concurrent calls on the same session.
let callQueue: Promise<void> = Promise.resolve();

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
  // Fast path — already connected
  if (client && transport) return client;

  // Lock to prevent concurrent initialization (race condition from parallel requests)
  if (initLock) {
    await initLock;
    if (client && transport) return client;
  }

  initLock = (async () => {
    transport = createTransport();
    client = new Client(
      { name: "factus-agent", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);
    // Invalidate cache on reconnect
    toolsCache = null;
  })();

  try {
    await initLock;
  } finally {
    initLock = null;
  }

  return client!;
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
  // Build a promise chain so concurrent calls are serialized.
  // Each request waits for the previous one to complete.
  let releaseNext: () => void;
  const thisLink = new Promise<void>((resolve) => {
    releaseNext = resolve;
  });

  const prevQueue = callQueue;
  callQueue = thisLink;

  await prevQueue;

  const execute = async (): Promise<T> => {
    const c = await getMcpClient();
    // The MCP server expects ALL tool arguments nested under a "params" key.
    // This is because every tool function accepts a single Pydantic model
    // parameter named "params" (e.g. async def get_product_by_code(params: GetProductByCodeParams)).
    // Without this wrapping, the server returns a 422 validation error.
    const result = await c.callTool({
      name: toolName,
      arguments: { params: args },
    });
    return result.content as T;
  };

  try {
    return await execute();
  } catch (err) {
    const msg = String(err);
    // Session expired or server cold-started — reset and retry once
    if (msg.includes("Missing session ID") || msg.includes("session")) {
      resetMcpClient();
      return await execute();
    }
    throw err;
  } finally {
    releaseNext!();
  }
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
  initLock = null;
}
