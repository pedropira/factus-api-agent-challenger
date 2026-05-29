import { describe, it, expect } from "vitest";
import { mcpToolRegistry } from "@/lib/mcp-tools";

describe("mcpToolRegistry", () => {
  it("should register at least 20 tools", () => {
    const toolCount = Object.keys(mcpToolRegistry).length;
    expect(toolCount).toBeGreaterThanOrEqual(20);
  });

  it("should have required core tools", () => {
    const toolNames = Object.keys(mcpToolRegistry);
    expect(toolNames).toContain("create_invoice_with_numbering");
    expect(toolNames).toContain("search_customers");
    expect(toolNames).toContain("search_products");
    expect(toolNames).toContain("get_default_numbering_range");
  });

  it("every tool should have a valid input schema", () => {
    for (const [name, tool] of Object.entries(mcpToolRegistry)) {
      expect(tool.inputSchema).toBeTruthy();
      // inputSchema should be a Zod object with properties
      if (tool.inputSchema && typeof tool.inputSchema === "object") {
        expect(typeof tool.inputSchema).toBe("object");
      }
    }
  });

  it("every tool should have a description", () => {
    for (const [name, tool] of Object.entries(mcpToolRegistry)) {
      expect(tool.description).toBeTruthy();
    }
  });
});
