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
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    detections: { list: vi.fn() },
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
    it("should export one detection tool", () => {
      expect(detectionTools).toHaveLength(1);
    });

    it("should have liongard_detections_list tool", () => {
      const listTool = detectionTools.find(
        (t) => t.name === "liongard_detections_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
      expect(listTool?.inputSchema.properties).toHaveProperty("filters");
    });
  });

  describe("handleDetectionTool", () => {
    describe("liongard_detections_list", () => {
      it("should call client.detections.list with pagination params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.detections.list.mockResolvedValue(mockResponse);

        const result = await handleDetectionTool(
          "liongard_detections_list",
          { page: 1, pageSize: 50 }
        );

        expect(mockClient.detections.list).toHaveBeenCalledWith(
          { page: 1, pageSize: 50 },
          undefined
        );
        expect(result.isError).toBeUndefined();
      });

      it("should pass filters when provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.detections.list.mockResolvedValue(mockResponse);

        const filters = { severity: "high" };
        await handleDetectionTool("liongard_detections_list", {
          page: 1,
          pageSize: 25,
          filters,
        });

        expect(mockClient.detections.list).toHaveBeenCalledWith(
          { page: 1, pageSize: 25 },
          filters
        );
      });

      it("should call with default params when none provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.detections.list.mockResolvedValue(mockResponse);

        await handleDetectionTool("liongard_detections_list", {});

        expect(mockClient.detections.list).toHaveBeenCalledWith(
          { page: undefined, pageSize: undefined },
          undefined
        );
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
