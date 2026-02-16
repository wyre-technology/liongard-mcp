/**
 * Tests for the environments domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  environmentTools,
  handleEnvironmentTool,
} from "../../domains/environments.js";

// Mock the client utility
const mockClient = {
  environments: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    getRelatedEntities: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    environments: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      getRelatedEntities: vi.fn(),
    },
  }),
}));

describe("environments domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("environmentTools", () => {
    it("should export five environment tools", () => {
      expect(environmentTools).toHaveLength(5);
    });

    it("should have liongard_environments_list tool", () => {
      const listTool = environmentTools.find(
        (t) => t.name === "liongard_environments_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
    });

    it("should have liongard_environments_get tool with required id", () => {
      const getTool = environmentTools.find(
        (t) => t.name === "liongard_environments_get"
      );
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.properties).toHaveProperty("id");
      expect(getTool?.inputSchema.required).toContain("id");
    });

    it("should have liongard_environments_create tool with required Name", () => {
      const createTool = environmentTools.find(
        (t) => t.name === "liongard_environments_create"
      );
      expect(createTool).toBeDefined();
      expect(createTool?.inputSchema.properties).toHaveProperty("Name");
      expect(createTool?.inputSchema.required).toContain("Name");
    });

    it("should have liongard_environments_count tool with no required params", () => {
      const countTool = environmentTools.find(
        (t) => t.name === "liongard_environments_count"
      );
      expect(countTool).toBeDefined();
      expect(countTool?.inputSchema.required).toBeUndefined();
    });

    it("should have liongard_environments_related tool with required id", () => {
      const relatedTool = environmentTools.find(
        (t) => t.name === "liongard_environments_related"
      );
      expect(relatedTool).toBeDefined();
      expect(relatedTool?.inputSchema.properties).toHaveProperty("id");
      expect(relatedTool?.inputSchema.required).toContain("id");
    });
  });

  describe("handleEnvironmentTool", () => {
    describe("liongard_environments_list", () => {
      it("should call client.environments.list with pagination params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.environments.list.mockResolvedValue(mockResponse);

        const result = await handleEnvironmentTool(
          "liongard_environments_list",
          { page: 1, pageSize: 50 }
        );

        expect(mockClient.environments.list).toHaveBeenCalledWith({
          page: 1,
          pageSize: 50,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call with default params when none provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.environments.list.mockResolvedValue(mockResponse);

        await handleEnvironmentTool("liongard_environments_list", {});

        expect(mockClient.environments.list).toHaveBeenCalledWith({
          page: undefined,
          pageSize: undefined,
        });
      });
    });

    describe("liongard_environments_get", () => {
      it("should call client.environments.get with id", async () => {
        const mockEnv = { ID: 1, Name: "Test Environment", Status: "Active" };
        mockClient.environments.get.mockResolvedValue(mockEnv);

        const result = await handleEnvironmentTool(
          "liongard_environments_get",
          { id: 1 }
        );

        expect(mockClient.environments.get).toHaveBeenCalledWith(1);
        expect(result.content[0].text).toContain("Test Environment");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_environments_create", () => {
      it("should call client.environments.create with params", async () => {
        const mockEnv = { ID: 2, Name: "New Env", Status: "Active" };
        mockClient.environments.create.mockResolvedValue(mockEnv);

        const result = await handleEnvironmentTool(
          "liongard_environments_create",
          { Name: "New Env", Description: "Test desc" }
        );

        expect(mockClient.environments.create).toHaveBeenCalledWith({
          Name: "New Env",
          Description: "Test desc",
        });
        expect(result.content[0].text).toContain("New Env");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_environments_count", () => {
      it("should call client.environments.count", async () => {
        mockClient.environments.count.mockResolvedValue(42);

        const result = await handleEnvironmentTool(
          "liongard_environments_count",
          {}
        );

        expect(mockClient.environments.count).toHaveBeenCalled();
        expect(result.content[0].text).toContain("42");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_environments_related", () => {
      it("should call client.environments.getRelatedEntities with id", async () => {
        const mockRelated = {
          ID: 1,
          Launchpoints: [{ ID: 10, Name: "LP1" }],
          Agents: [],
          IntegrationMappings: [],
          ChildEnvironments: [],
        };
        mockClient.environments.getRelatedEntities.mockResolvedValue(
          mockRelated
        );

        const result = await handleEnvironmentTool(
          "liongard_environments_related",
          { id: 1 }
        );

        expect(
          mockClient.environments.getRelatedEntities
        ).toHaveBeenCalledWith(1);
        expect(result.content[0].text).toContain("LP1");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown environment tool", async () => {
        const result = await handleEnvironmentTool(
          "liongard_environments_unknown",
          {}
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown environment tool");
      });
    });
  });
});
