/**
 * Alerts domain tools for Liongard MCP Server
 *
 * Alerts are notifications generated when detections match
 * configured alert rules in Liongard.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Alert domain tool definitions
 */
export const alertTools: Tool[] = [
  {
    name: "liongard_alerts_list",
    description:
      "List alerts in Liongard with pagination. Alerts are generated when detections match configured alert rules.",
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
  {
    name: "liongard_alerts_get",
    description:
      "Get detailed information about a specific alert by its ID. Returns full alert details including source detection and severity.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The unique alert ID",
        },
      },
      required: ["id"],
    },
  },
];

/**
 * Handle alert domain tool calls
 */
export async function handleAlertTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_alerts_list": {
      const params = args as { page?: number; pageSize?: number };
      const response = await client.alerts.list({
        page: params.page,
        pageSize: params.pageSize,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "liongard_alerts_get": {
      const { id } = args as { id: number };
      const alert = await client.alerts.get(id);
      return {
        content: [{ type: "text", text: JSON.stringify(alert, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown alert tool: ${name}` }],
        isError: true,
      };
  }
}
