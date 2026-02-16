/**
 * Metrics domain tools for Liongard MCP Server
 *
 * Metrics provide quantitative measurements and evaluations
 * across environments and systems in Liongard.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Metric domain tool definitions
 */
export const metricTools: Tool[] = [
  {
    name: "liongard_metrics_list",
    description:
      "List all available metrics in Liongard. Returns metric definitions including name, type, and status.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "liongard_metrics_evaluate",
    description:
      "Evaluate metrics across all systems. Optionally filter by specific metric IDs and environment IDs.",
    inputSchema: {
      type: "object",
      properties: {
        MetricIDs: {
          type: "array",
          items: { type: "number" },
          description: "Optional array of metric IDs to evaluate",
        },
        EnvironmentIDs: {
          type: "array",
          items: { type: "number" },
          description: "Optional array of environment IDs to filter by",
        },
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        pageSize: {
          type: "number",
          description: "Number of items per page (default: 50)",
        },
      },
    },
  },
  {
    name: "liongard_metrics_evaluate_systems",
    description:
      "Evaluate metrics grouped per system. Optionally filter by specific metric IDs and environment IDs.",
    inputSchema: {
      type: "object",
      properties: {
        MetricIDs: {
          type: "array",
          items: { type: "number" },
          description: "Optional array of metric IDs to evaluate",
        },
        EnvironmentIDs: {
          type: "array",
          items: { type: "number" },
          description: "Optional array of environment IDs to filter by",
        },
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        pageSize: {
          type: "number",
          description: "Number of items per page (default: 50)",
        },
      },
    },
  },
];

/**
 * Handle metric domain tool calls
 */
export async function handleMetricTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_metrics_list": {
      const metrics = await client.metrics.list();
      return {
        content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }],
      };
    }

    case "liongard_metrics_evaluate": {
      const params = args as {
        MetricIDs?: number[];
        EnvironmentIDs?: number[];
        page?: number;
        pageSize?: number;
      };
      const response = await client.metrics.evaluate({
        MetricIDs: params.MetricIDs,
        EnvironmentIDs: params.EnvironmentIDs,
        Pagination: {
          Page: params.page ?? 1,
          PageSize: params.pageSize ?? 50,
        },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "liongard_metrics_evaluate_systems": {
      const params = args as {
        MetricIDs?: number[];
        EnvironmentIDs?: number[];
        page?: number;
        pageSize?: number;
      };
      const response = await client.metrics.evaluateSystems({
        MetricIDs: params.MetricIDs,
        EnvironmentIDs: params.EnvironmentIDs,
        Pagination: {
          Page: params.page ?? 1,
          PageSize: params.pageSize ?? 50,
        },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown metric tool: ${name}` }],
        isError: true,
      };
  }
}
