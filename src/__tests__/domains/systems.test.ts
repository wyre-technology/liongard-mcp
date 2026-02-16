/**
 * Tests for the systems domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { systemTools, handleSystemTool } from "../../domains/systems.js";

// Mock the client utility
const mockClient = {
  systems: {
    list: vi.fn(),
    get: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    systems: { list: vi.fn(), get: vi.fn() },
  }),
}));

describe("systems domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("systemTools", () => {
    it("should export two system tools", () => {
      expect(systemTools).toHaveLength(2);
    });

    it("should have liongard_systems_list tool", () => {
      const listTool = systemTools.find(
        (t) => t.name === "liongard_systems_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
    });

    it("should have liongard_systems_get tool with required id", () => {
      const getTool = systemTools.find(
        (t) => t.name === "liongard_systems_get"
      );
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.properties).toHaveProperty("id");
      expect(getTool?.inputSchema.required).toContain("id");
    });
  });

  describe("handleSystemTool", () => {
    describe("liongard_systems_list", () => {
      it("should call client.systems.list with pagination params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.systems.list.mockResolvedValue(mockResponse);

        const result = await handleSystemTool("liongard_systems_list", {
          page: 1,
          pageSize: 50,
        });

        expect(mockClient.systems.list).toHaveBeenCalledWith({
          page: 1,
          pageSize: 50,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call with default params when none provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.systems.list.mockResolvedValue(mockResponse);

        await handleSystemTool("liongard_systems_list", {});

        expect(mockClient.systems.list).toHaveBeenCalledWith({
          page: undefined,
          pageSize: undefined,
        });
      });
    });

    describe("liongard_systems_get", () => {
      it("should call client.systems.get with id", async () => {
        const mockSystem = { ID: 1, Name: "Windows Server" };
        mockClient.systems.get.mockResolvedValue(mockSystem);

        const result = await handleSystemTool("liongard_systems_get", {
          id: 1,
        });

        expect(mockClient.systems.get).toHaveBeenCalledWith(1);
        expect(result.content[0].text).toContain("Windows Server");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown system tool", async () => {
        const result = await handleSystemTool("liongard_systems_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown system tool");
      });
    });
  });
});
