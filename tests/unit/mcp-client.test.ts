import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the module structure, not actual connection (that needs MCP server)
describe("MCP Client module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should export the expected interface", async () => {
    const mcpModule = await import("@/lib/mcp-client");
    expect(mcpModule).toBeDefined();

    // Should export at least one of these
    const hasExpectedExport =
      "getMcpClient" in mcpModule ||
      "mcpClient" in mcpModule ||
      "McpClient" in mcpModule ||
      "default" in mcpModule;

    expect(hasExpectedExport).toBe(true);
  });
});
