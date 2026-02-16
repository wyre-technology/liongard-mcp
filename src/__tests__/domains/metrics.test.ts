/**
 * Tests for the metrics domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { metricTools, handleMetricTool } from "../../domains/metrics.js";

// Mock the client utility
const mockClient = {
  metrics: {
    list: vi.fn(),
    evaluate: vi.fn(),
    evaluateSystems: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    metrics: { list: vi.fn(), evaluate: vi.fn(), evaluateSystems: vi.fn() },
  }),
}));

describe("metrics domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("metricTools", () => {
    it("should export three metric tools", () => {
      expect(metricTools).toHaveLength(3);
    });

    it("should have liongard_metrics_list tool with no required params", () => {
      const listTool = metricTools.find(
        (t) => t.name === "liongard_metrics_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.required).toBeUndefined();
    });

    it("should have liongard_metrics_evaluate tool", () => {
      const evaluateTool = metricTools.find(
        (t) => t.name === "liongard_metrics_evaluate"
      );
      expect(evaluateTool).toBeDefined();
      expect(evaluateTool?.inputSchema.properties).toHaveProperty(
        "MetricIDs"
      );
      expect(evaluateTool?.inputSchema.properties).toHaveProperty(
        "EnvironmentIDs"
      );
    });

    it("should have liongard_metrics_evaluate_systems tool", () => {
      const tool = metricTools.find(
        (t) => t.name === "liongard_metrics_evaluate_systems"
      );
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty("MetricIDs");
      expect(tool?.inputSchema.properties).toHaveProperty("EnvironmentIDs");
    });
  });

  describe("handleMetricTool", () => {
    describe("liongard_metrics_list", () => {
      it("should call client.metrics.list", async () => {
        const mockMetrics = [
          { ID: 1, Name: "MFA Enabled", Type: "boolean" },
          { ID: 2, Name: "Password Age", Type: "number" },
        ];
        mockClient.metrics.list.mockResolvedValue(mockMetrics);

        const result = await handleMetricTool("liongard_metrics_list", {});

        expect(mockClient.metrics.list).toHaveBeenCalled();
        expect(result.content[0].text).toContain("MFA Enabled");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("liongard_metrics_evaluate", () => {
      it("should call client.metrics.evaluate with params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.metrics.evaluate.mockResolvedValue(mockResponse);

        const result = await handleMetricTool("liongard_metrics_evaluate", {
          MetricIDs: [1, 2],
          EnvironmentIDs: [10],
          page: 1,
          pageSize: 50,
        });

        expect(mockClient.metrics.evaluate).toHaveBeenCalledWith({
          MetricIDs: [1, 2],
          EnvironmentIDs: [10],
          Pagination: { Page: 1, PageSize: 50 },
        });
        expect(result.isError).toBeUndefined();
      });

      it("should use default pagination when not provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.metrics.evaluate.mockResolvedValue(mockResponse);

        await handleMetricTool("liongard_metrics_evaluate", {});

        expect(mockClient.metrics.evaluate).toHaveBeenCalledWith({
          MetricIDs: undefined,
          EnvironmentIDs: undefined,
          Pagination: { Page: 1, PageSize: 50 },
        });
      });
    });

    describe("liongard_metrics_evaluate_systems", () => {
      it("should call client.metrics.evaluateSystems with params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.metrics.evaluateSystems.mockResolvedValue(mockResponse);

        const result = await handleMetricTool(
          "liongard_metrics_evaluate_systems",
          { MetricIDs: [3], page: 2, pageSize: 25 }
        );

        expect(mockClient.metrics.evaluateSystems).toHaveBeenCalledWith({
          MetricIDs: [3],
          EnvironmentIDs: undefined,
          Pagination: { Page: 2, PageSize: 25 },
        });
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown metric tool", async () => {
        const result = await handleMetricTool("liongard_metrics_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown metric tool");
      });
    });
  });
});
