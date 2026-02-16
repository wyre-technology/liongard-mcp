/**
 * Timeline domain tools for Liongard MCP Server
 *
 * Timeline provides a chronological view of inspection events,
 * changes, and activities across the Liongard platform.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Timeline domain tool definitions
 */
export const timelineTools: Tool[] = [
  {
    name: "liongard_timeline_list",
    description:
      "List timeline entries in Liongard with pagination and optional filters. Timeline provides a chronological view of inspection events and configuration changes.",
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
            "Optional filters to narrow results (e.g., by environment, date range)",
        },
      },
    },
  },
];

/**
 * Handle timeline domain tool calls
 */
export async function handleTimelineTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_timeline_list": {
      const params = args as {
        page?: number;
        pageSize?: number;
        filters?: Record<string, unknown>;
      };
      const response = await client.timeline.list(
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
          { type: "text", text: `Unknown timeline tool: ${name}` },
        ],
        isError: true,
      };
  }
}
