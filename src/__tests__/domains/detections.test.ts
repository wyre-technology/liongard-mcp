/**
 * Tests for the detections domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectionTools,
  handleDetectionTool,
} from "../../domains/detections.js";

// Mock the client utility
const mockClient = {
  detections: {
    list: vi.fn(),
    get: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    detections: { list: vi.fn(), get: vi.fn() },
  }),
}));

describe("detections domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("detectionTools", () => {
    it("should export two detection tools", () => {
      expect(detectionTools).toHaveLength(2);
    });

    it("should have liongard_detections_list tool with date range and pagination", () => {
      const listTool = detectionTools.find(
        (t) => t.name === "liongard_detections_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("startDate");
      expect(listTool?.inputSchema.properties).toHaveProperty("endDate");
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
      expect(listTool?.inputSchema.properties).toHaveProperty("filters");
    });

    it("should have liongard_detections_get tool with required id", () => {
      const getTool = detectionTools.find(
        (t) => t.name === "liongard_detections_get"
      );
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.required).toContain("id");
    });
  });

  describe("handleDetectionTool", () => {
    describe("liongard_detections_list", () => {
      it("should forward pagination, date range, and filters to the SDK", async () => {
        mockClient.detections.list.mockResolvedValue({ Data: [], Pagination: {} });

        const result = await handleDetectionTool(
          "liongard_detections_list",
          {
            page: 2,
            pageSize: 50,
            startDate: "2024-04-01T00:00:00Z",
            endDate: "2024-04-30T00:00:00Z",
            filters: [{ Field: "Severity", Op: "=", Value: "High" }],
          }
        );

        expect(mockClient.detections.list).toHaveBeenCalledWith({
          page: 2,
          pageSize: 50,
          startDate: "2024-04-01T00:00:00Z",
          endDate: "2024-04-30T00:00:00Z",
          filters: [{ Field: "Severity", Op: "=", Value: "High" }],
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call with all-undefined options when none provided", async () => {
        mockClient.detections.list.mockResolvedValue({ Data: [], Pagination: {} });

        await handleDetectionTool("liongard_detections_list", {});

        expect(mockClient.detections.list).toHaveBeenCalledWith({
          page: undefined,
          pageSize: undefined,
          startDate: undefined,
          endDate: undefined,
          filters: undefined,
        });
      });
    });

    describe("liongard_detections_get", () => {
      it("should call client.detections.get with the id", async () => {
        mockClient.detections.get.mockResolvedValue({ ID: 7 });

        const result = await handleDetectionTool("liongard_detections_get", {
          id: 7,
        });

        expect(mockClient.detections.get).toHaveBeenCalledWith(7);
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown detection tool", async () => {
        const result = await handleDetectionTool(
          "liongard_detections_unknown",
          {}
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown detection tool");
      });
    });
  });
});
