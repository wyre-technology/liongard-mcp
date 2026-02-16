/**
 * Detections domain tools for Liongard MCP Server
 *
 * Detections are configuration changes and anomalies identified
 * by Liongard's inspection analysis engine.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Detection domain tool definitions
 */
export const detectionTools: Tool[] = [
  {
    name: "liongard_detections_list",
    description:
      "List detections in Liongard with pagination and optional filters. Detections represent configuration changes and anomalies identified through inspections.",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        pageSize: {
          type: "number",
          description: "Number of items per page (default: 50)",
        },
        filters: {
          type: "object",
          description:
            "Optional filters to narrow results (e.g., by environment, severity)",
        },
      },
    },
  },
];

/**
 * Handle detection domain tool calls
 */
export async function handleDetectionTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_detections_list": {
      const params = args as {
        page?: number;
        pageSize?: number;
        filters?: Record<string, unknown>;
      };
      const response = await client.detections.list(
        { page: params.page, pageSize: params.pageSize },
        params.filters
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    default:
      return {
        content: [
          { type: "text", text: `Unknown detection tool: ${name}` },
        ],
        isError: true,
      };
  }
}
