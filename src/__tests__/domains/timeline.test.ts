/**
 * Tests for the timeline domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  timelineTools,
  handleTimelineTool,
} from "../../domains/timeline.js";

// Mock the client utility
const mockClient = {
  timeline: {
    list: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    timeline: { list: vi.fn() },
  }),
}));

describe("timeline domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("timelineTools", () => {
    it("should export one timeline tool", () => {
      expect(timelineTools).toHaveLength(1);
    });

    it("should have liongard_timeline_list tool with only page/pageSize", () => {
      const listTool = timelineTools.find(
        (t) => t.name === "liongard_timeline_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
      expect(listTool?.inputSchema.properties).not.toHaveProperty("filters");
    });
  });

  describe("handleTimelineTool", () => {
    describe("liongard_timeline_list", () => {
      it("should call client.timeline.list with pagination params", async () => {
        mockClient.timeline.list.mockResolvedValue([]);

        const result = await handleTimelineTool("liongard_timeline_list", {
          page: 1,
          pageSize: 50,
        });

        expect(mockClient.timeline.list).toHaveBeenCalledWith({
          page: 1,
          pageSize: 50,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call with all-undefined params when none provided", async () => {
        mockClient.timeline.list.mockResolvedValue([]);

        await handleTimelineTool("liongard_timeline_list", {});

        expect(mockClient.timeline.list).toHaveBeenCalledWith({
          page: undefined,
          pageSize: undefined,
        });
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown timeline tool", async () => {
        const result = await handleTimelineTool(
          "liongard_timeline_unknown",
          {}
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown timeline tool");
      });
    });
  });
});
