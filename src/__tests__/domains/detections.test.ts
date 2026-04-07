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

    it("should have liongard_detections_list tool with conditions/fields", () => {
      const listTool = detectionTools.find(
        (t) => t.name === "liongard_detections_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("conditions");
      expect(listTool?.inputSchema.properties).toHaveProperty("fields");
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
      it("should call client.detections.list with conditions/fields", async () => {
        mockClient.detections.list.mockResolvedValue([]);

        const result = await handleDetectionTool(
          "liongard_detections_list",
          {
            conditions: [{ path: "Inspector/ID", op: "=", value: 3 }],
            fields: ["ID", "Type"],
          }
        );

        expect(mockClient.detections.list).toHaveBeenCalledWith({
          conditions: [{ path: "Inspector/ID", op: "=", value: 3 }],
          fields: ["ID", "Type"],
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call with empty options when none provided", async () => {
        mockClient.detections.list.mockResolvedValue([]);

        await handleDetectionTool("liongard_detections_list", {});

        expect(mockClient.detections.list).toHaveBeenCalledWith({
          conditions: undefined,
          fields: undefined,
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
