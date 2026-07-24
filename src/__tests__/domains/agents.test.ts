/**
 * Tests for the agents domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LiongardClient } from "@wyre-technology/node-liongard";
import { agentTools, handleAgentTool } from "../../domains/agents.js";

// Directly constructed fake client, passed explicitly to the handler
// under test (no module-level client state to mock).
const mockClient = {
  agents: {
    list: vi.fn(),
    delete: vi.fn(),
  },
};
const client = mockClient as unknown as LiongardClient;

describe("agents domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        },
          client);

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
        },
          client);

        expect(mockClient.agents.delete).toHaveBeenCalledWith(42);
        expect(result.content[0].text).toContain("42");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown agent tool", async () => {
        const result = await handleAgentTool("liongard_agents_unknown", {},
          client);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown agent tool");
      });
    });
  });
});
