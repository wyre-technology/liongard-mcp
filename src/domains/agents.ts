/**
 * Agents domain tools for Liongard MCP Server
 *
 * Agents are the software components installed on-premise that
 * facilitate inspections and data collection in Liongard.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Agent domain tool definitions
 */
export const agentTools: Tool[] = [
  {
    name: "liongard_agents_list",
    description:
      "List agents in Liongard with pagination. Agents are installed on-premise to facilitate inspections and data collection.",
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
    name: "liongard_agents_delete",
    description:
      "Bulk delete agents by their IDs. Use with caution - this permanently removes agents from Liongard.",
    inputSchema: {
      type: "object",
      properties: {
        agentIds: {
          type: "array",
          items: { type: "number" },
          description: "Array of agent IDs to delete",
        },
      },
      required: ["agentIds"],
    },
  },
  {
    name: "liongard_agents_installer",
    description:
      "Generate a dynamic agent installer. Returns installer download information for deploying a new Liongard agent.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Handle agent domain tool calls
 */
export async function handleAgentTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_agents_list": {
      const params = args as { page?: number; pageSize?: number };
      const response = await client.agents.list({
        page: params.page,
        pageSize: params.pageSize,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "liongard_agents_delete": {
      const { agentIds } = args as { agentIds: number[] };
      await client.agents.delete(agentIds);
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted ${agentIds.length} agent(s).`,
          },
        ],
      };
    }

    case "liongard_agents_installer": {
      const installer = await client.agents.generateInstaller();
      return {
        content: [
          { type: "text", text: JSON.stringify(installer, null, 2) },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown agent tool: ${name}` }],
        isError: true,
      };
  }
}
