/**
 * Systems domain tools for Liongard MCP Server
 *
 * Systems represent the infrastructure components discovered
 * and tracked by Liongard inspections.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * System domain tool definitions
 */
export const systemTools: Tool[] = [
  {
    name: "liongard_systems_list",
    description:
      "List systems in Liongard with pagination. Systems are infrastructure components discovered through inspections.",
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
    name: "liongard_systems_get",
    description:
      "Get detailed information about a specific system by its ID. Returns full system profile.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The unique system ID",
        },
      },
      required: ["id"],
    },
  },
];

/**
 * Handle system domain tool calls
 */
export async function handleSystemTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_systems_list": {
      const params = args as { page?: number; pageSize?: number };
      const response = await client.systems.list({
        page: params.page,
        pageSize: params.pageSize,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "liongard_systems_get": {
      const { id } = args as { id: number };
      const system = await client.systems.get(id);
      return {
        content: [{ type: "text", text: JSON.stringify(system, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown system tool: ${name}` }],
        isError: true,
      };
  }
}
