/**
 * Tests for the inspections domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  inspectionTools,
  handleInspectionTool,
} from "../../domains/inspections.js";

// Mock the client utility
const mockClient = {
  inspectors: {
    list: vi.fn(),
    get: vi.fn(),
  },
  launchpoints: {
    list: vi.fn(),
    create: vi.fn(),
    runNow: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    inspectors: { list: vi.fn(), get: vi.fn() },
    launchpoints: { list: vi.fn(), create: vi.fn(), runNow: vi.fn() },
  }),
}));

describe("inspections domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("inspectionTools", () => {
    it("should export four inspection tools", () => {
      expect(inspectionTools).toHaveLength(4);
    });

    it("should have liongard_inspections_inspectors tool", () => {
      const tool = inspectionTools.find(
        (t) => t.name === "liongard_inspections_inspectors"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty("page");
      expect(tool?.inputSchema.properties).toHaveProperty("pageSize");
    });

    it("should have liongard_inspections_launchpoints tool", () => {
      const tool = inspectionTools.find(
        (t) => t.name === "liongard_inspections_launchpoints"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty("page");
    });

    it("should have liongard_inspections_create_launchpoint tool with required fields", () => {
      const tool = inspectionTools.find(
        (t) => t.name === "liongard_inspections_create_launchpoint"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain("Name");
      expect(tool?.inputSchema.required).toContain("InspectorID");
      expect(tool?.inputSchema.required).toContain("EnvironmentID");
    });

    it("should have liongard_inspections_run tool with required launchpointId", () => {
      const tool = inspectionTools.find(
        (t) => t.name === "liongard_inspections_run"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain("launchpointId");
    });
  });

  describe("handleInspectionTool", () => {
    describe("liongard_inspections_inspectors", () => {
      it("should call client.inspectors.list with pagination params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.inspectors.list.mockResolvedValue(mockResponse);

        const result = await handleInspectionTool(
          "liongard_inspections_inspectors",
          { page: 1, pageSize: 25 }
        );

        expect(mockClient.inspectors.list).toHaveBeenCalledWith({
          page: 1,
          pageSize: 25,
        });
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_inspections_launchpoints", () => {
      it("should call client.launchpoints.list with pagination params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.launchpoints.list.mockResolvedValue(mockResponse);

        const result = await handleInspectionTool(
          "liongard_inspections_launchpoints",
          { page: 2, pageSize: 10 }
        );

        expect(mockClient.launchpoints.list).toHaveBeenCalledWith({
          page: 2,
          pageSize: 10,
        });
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_inspections_create_launchpoint", () => {
      it("should call client.launchpoints.create with params", async () => {
        const mockLP = { ID: 1, Name: "Test LP", InspectorID: 5 };
        mockClient.launchpoints.create.mockResolvedValue(mockLP);

        const result = await handleInspectionTool(
          "liongard_inspections_create_launchpoint",
          { Name: "Test LP", InspectorID: 5, EnvironmentID: 10 }
        );

        expect(mockClient.launchpoints.create).toHaveBeenCalledWith({
          Name: "Test LP",
          InspectorID: 5,
          EnvironmentID: 10,
        });
        expect(result.content[0].text).toContain("Test LP");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_inspections_run", () => {
      it("should call client.launchpoints.runNow with launchpoint ID", async () => {
        mockClient.launchpoints.runNow.mockResolvedValue(undefined);

        const result = await handleInspectionTool(
          "liongard_inspections_run",
          { launchpointId: 42 }
        );

        expect(mockClient.launchpoints.runNow).toHaveBeenCalledWith(42);
        expect(result.content[0].text).toContain("42");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown inspection tool", async () => {
        const result = await handleInspectionTool(
          "liongard_inspections_unknown",
          {}
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown inspection tool");
      });
    });
  });
});
