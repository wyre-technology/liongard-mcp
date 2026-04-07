/**
 * Tests for the agents domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { agentTools, handleAgentTool } from "../../domains/agents.js";

// Mock the client utility
const mockClient = {
  agents: {
    list: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    agents: {
      list: vi.fn(),
      delete: vi.fn(),
    },
  }),
}));

describe("agents domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("agentTools", () => {
    it("should export two agent tools", () => {
      expect(agentTools).toHaveLength(2);
    });

    it("should have liongard_agents_list tool", () => {
      const listTool = agentTools.find(
        (t) => t.name === "liongard_agents_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
    });

    it("should have liongard_agents_delete tool with required id", () => {
      const deleteTool = agentTools.find(
        (t) => t.name === "liongard_agents_delete"
      );
      expect(deleteTool).toBeDefined();
      expect(deleteTool?.inputSchema.properties).toHaveProperty("id");
      expect(deleteTool?.inputSchema.required).toContain("id");
    });
  });

  describe("handleAgentTool", () => {
    describe("liongard_agents_list", () => {
      it("should call client.agents.list with pagination params", async () => {
        mockClient.agents.list.mockResolvedValue({ Data: [], Pagination: {} });

        const result = await handleAgentTool("liongard_agents_list", {
          page: 1,
          pageSize: 50,
        });

        expect(mockClient.agents.list).toHaveBeenCalledWith({
          page: 1,
          pageSize: 50,
        });
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_agents_delete", () => {
      it("should call client.agents.delete with the agent ID", async () => {
        mockClient.agents.delete.mockResolvedValue(undefined);

        const result = await handleAgentTool("liongard_agents_delete", {
          id: 42,
        });

        expect(mockClient.agents.delete).toHaveBeenCalledWith(42);
        expect(result.content[0].text).toContain("42");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown agent tool", async () => {
        const result = await handleAgentTool("liongard_agents_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown agent tool");
      });
    });
  });
});
