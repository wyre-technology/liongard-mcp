/**
 * Tests for the inventory domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  inventoryTools,
  handleInventoryTool,
} from "../../domains/inventory.js";

// Mock the client utility
const mockClient = {
  inventory: {
    identities: {
      list: vi.fn(),
      get: vi.fn(),
    },
    devices: {
      list: vi.fn(),
      get: vi.fn(),
    },
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    inventory: {
      identities: { list: vi.fn(), get: vi.fn() },
      devices: { list: vi.fn(), get: vi.fn() },
    },
  }),
}));

describe("inventory domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("inventoryTools", () => {
    it("should export four inventory tools", () => {
      expect(inventoryTools).toHaveLength(4);
    });

    it("should have liongard_inventory_identities tool", () => {
      const tool = inventoryTools.find(
        (t) => t.name === "liongard_inventory_identities"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty("page");
      expect(tool?.inputSchema.properties).toHaveProperty("pageSize");
      expect(tool?.inputSchema.properties).toHaveProperty("filters");
    });

    it("should have liongard_inventory_identity_get tool with required id", () => {
      const tool = inventoryTools.find(
        (t) => t.name === "liongard_inventory_identity_get"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty("id");
      expect(tool?.inputSchema.required).toContain("id");
    });

    it("should have liongard_inventory_devices tool", () => {
      const tool = inventoryTools.find(
        (t) => t.name === "liongard_inventory_devices"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty("page");
      expect(tool?.inputSchema.properties).toHaveProperty("filters");
    });

    it("should have liongard_inventory_device_get tool with required id", () => {
      const tool = inventoryTools.find(
        (t) => t.name === "liongard_inventory_device_get"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty("id");
      expect(tool?.inputSchema.required).toContain("id");
    });
  });

  describe("handleInventoryTool", () => {
    describe("liongard_inventory_identities", () => {
      it("should call client.inventory.identities.list with pagination", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.inventory.identities.list.mockResolvedValue(mockResponse);

        const result = await handleInventoryTool(
          "liongard_inventory_identities",
          { page: 1, pageSize: 50 }
        );

        expect(
          mockClient.inventory.identities.list
        ).toHaveBeenCalledWith(
          { page: 1, pageSize: 50 },
          undefined
        );
        expect(result.isError).toBeUndefined();
      });

      it("should pass filters when provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.inventory.identities.list.mockResolvedValue(mockResponse);

        const filters = { environmentId: 5 };
        await handleInventoryTool("liongard_inventory_identities", {
          filters,
        });

        expect(
          mockClient.inventory.identities.list
        ).toHaveBeenCalledWith(
          { page: undefined, pageSize: undefined },
          filters
        );
      });
    });

    describe("liongard_inventory_identity_get", () => {
      it("should call client.inventory.identities.get with id", async () => {
        const mockIdentity = { ID: 1, Name: "admin@example.com" };
        mockClient.inventory.identities.get.mockResolvedValue(mockIdentity);

        const result = await handleInventoryTool(
          "liongard_inventory_identity_get",
          { id: 1 }
        );

        expect(mockClient.inventory.identities.get).toHaveBeenCalledWith(
          1
        );
        expect(result.content[0].text).toContain("admin@example.com");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_inventory_devices", () => {
      it("should call client.inventory.devices.list with pagination", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.inventory.devices.list.mockResolvedValue(mockResponse);

        const result = await handleInventoryTool(
          "liongard_inventory_devices",
          { page: 2, pageSize: 25 }
        );

        expect(mockClient.inventory.devices.list).toHaveBeenCalledWith(
          { page: 2, pageSize: 25 },
          undefined
        );
        expect(result.isError).toBeUndefined();
      });

      it("should pass filters when provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.inventory.devices.list.mockResolvedValue(mockResponse);

        const filters = { type: "server" };
        await handleInventoryTool("liongard_inventory_devices", {
          filters,
        });

        expect(mockClient.inventory.devices.list).toHaveBeenCalledWith(
          { page: undefined, pageSize: undefined },
          filters
        );
      });
    });

    describe("liongard_inventory_device_get", () => {
      it("should call client.inventory.devices.get with id", async () => {
        const mockDevice = {
          ID: 42,
          Name: "Server-DC01",
          Type: "Windows Server",
        };
        mockClient.inventory.devices.get.mockResolvedValue(mockDevice);

        const result = await handleInventoryTool(
          "liongard_inventory_device_get",
          { id: 42 }
        );

        expect(mockClient.inventory.devices.get).toHaveBeenCalledWith(42);
        expect(result.content[0].text).toContain("Server-DC01");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown inventory tool", async () => {
        const result = await handleInventoryTool(
          "liongard_inventory_unknown",
          {}
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown inventory tool");
      });
    });
  });
});
