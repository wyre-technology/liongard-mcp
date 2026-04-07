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
      "List timeline entries in Liongard via GET /api/v1/timeline. Returns a plain array of inspection events and configuration changes. page/pageSize are accepted but may be ignored by the v1 endpoint.",
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
      };
      try {
        const response = await client.timeline.list({
          page: params.page,
          pageSize: params.pageSize,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error listing timeline entries: ${message}` }],
          isError: true,
        };
      }
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
