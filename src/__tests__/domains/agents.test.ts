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
    generateInstaller: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    agents: {
      list: vi.fn(),
      delete: vi.fn(),
      generateInstaller: vi.fn(),
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
    it("should export three agent tools", () => {
      expect(agentTools).toHaveLength(3);
    });

    it("should have liongard_agents_list tool", () => {
      const listTool = agentTools.find(
        (t) => t.name === "liongard_agents_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
    });

    it("should have liongard_agents_delete tool with required agentIds", () => {
      const deleteTool = agentTools.find(
        (t) => t.name === "liongard_agents_delete"
      );
      expect(deleteTool).toBeDefined();
      expect(deleteTool?.inputSchema.properties).toHaveProperty("agentIds");
      expect(deleteTool?.inputSchema.required).toContain("agentIds");
    });

    it("should have liongard_agents_installer tool", () => {
      const installerTool = agentTools.find(
        (t) => t.name === "liongard_agents_installer"
      );
      expect(installerTool).toBeDefined();
    });
  });

  describe("handleAgentTool", () => {
    describe("liongard_agents_list", () => {
      it("should call client.agents.list with pagination params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.agents.list.mockResolvedValue(mockResponse);

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

      it("should call with default params when none provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.agents.list.mockResolvedValue(mockResponse);

        await handleAgentTool("liongard_agents_list", {});

        expect(mockClient.agents.list).toHaveBeenCalledWith({
          page: undefined,
          pageSize: undefined,
        });
      });
    });

    describe("liongard_agents_delete", () => {
      it("should call client.agents.delete with agent IDs", async () => {
        mockClient.agents.delete.mockResolvedValue(undefined);

        const result = await handleAgentTool("liongard_agents_delete", {
          agentIds: [1, 2, 3],
        });

        expect(mockClient.agents.delete).toHaveBeenCalledWith([1, 2, 3]);
        expect(result.content[0].text).toContain("3 agent(s)");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_agents_installer", () => {
      it("should call client.agents.generateInstaller", async () => {
        const mockInstaller = { url: "https://example.com/installer.exe" };
        mockClient.agents.generateInstaller.mockResolvedValue(mockInstaller);

        const result = await handleAgentTool("liongard_agents_installer", {});

        expect(mockClient.agents.generateInstaller).toHaveBeenCalled();
        expect(result.content[0].text).toContain("installer.exe");
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
