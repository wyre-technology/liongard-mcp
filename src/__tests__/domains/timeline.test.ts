/**
 * Tests for the timeline domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LiongardClient } from "@wyre-technology/node-liongard";
import {
  timelineTools,
  handleTimelineTool,
} from "../../domains/timeline.js";

// Directly constructed fake client, passed explicitly to the handler
// under test (no module-level client state to mock).
const mockClient = {
  timeline: {
    list: vi.fn(),
  },
};
const client = mockClient as unknown as LiongardClient;

describe("timeline domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        },
          client);

        expect(mockClient.timeline.list).toHaveBeenCalledWith({
          page: 1,
          pageSize: 50,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call with all-undefined params when none provided", async () => {
        mockClient.timeline.list.mockResolvedValue([]);

        await handleTimelineTool("liongard_timeline_list", {},
          client);

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
          {},
          client
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown timeline tool");
      });
    });
  });
});
