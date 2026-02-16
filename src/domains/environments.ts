/**
 * Environments domain tools for Liongard MCP Server
 *
 * Environments represent customer/company entities in Liongard.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Environment domain tool definitions
 */
export const environmentTools: Tool[] = [
  {
    name: "liongard_environments_list",
    description:
      "List environments (customers/companies) in Liongard with pagination. Returns environment details including name, status, and tier.",
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
    name: "liongard_environments_get",
    description:
      "Get detailed information about a specific environment by its ID. Returns full environment profile including status, visibility, and tier.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The unique environment ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "liongard_environments_create",
    description:
      "Create a new environment in Liongard. Only Name is required, all other fields are optional.",
    inputSchema: {
      type: "object",
      properties: {
        Name: {
          type: "string",
          description: "The environment name (required)",
        },
        Description: {
          type: "string",
          description: "Environment description",
        },
        Status: {
          type: "string",
          description: "Environment status",
        },
        Visible: {
          type: "boolean",
          description: "Whether the environment is visible",
        },
        Tier: {
          type: "string",
          description: "Environment tier classification",
        },
      },
      required: ["Name"],
    },
  },
  {
    name: "liongard_environments_count",
    description:
      "Get the total count of environments in Liongard. Useful for understanding the size of your environment inventory.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "liongard_environments_related",
    description:
      "Get related entities for a specific environment. Returns associated launchpoints, agents, integration mappings, and child environments.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The environment ID to get related entities for",
        },
      },
      required: ["id"],
    },
  },
];

/**
 * Handle environment domain tool calls
 */
export async function handleEnvironmentTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_environments_list": {
      const params = args as { page?: number; pageSize?: number };
      const response = await client.environments.list({
        page: params.page,
        pageSize: params.pageSize,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "liongard_environments_get": {
      const { id } = args as { id: number };
      const environment = await client.environments.get(id);
      return {
        content: [
          { type: "text", text: JSON.stringify(environment, null, 2) },
        ],
      };
    }

    case "liongard_environments_create": {
      const params = args as {
        Name: string;
        Description?: string;
        Status?: string;
        Visible?: boolean;
        Tier?: string;
      };
      const environment = await client.environments.create(params);
      return {
        content: [
          { type: "text", text: JSON.stringify(environment, null, 2) },
        ],
      };
    }

    case "liongard_environments_count": {
      const count = await client.environments.count();
      return {
        content: [
          { type: "text", text: JSON.stringify({ count }, null, 2) },
        ],
      };
    }

    case "liongard_environments_related": {
      const { id } = args as { id: number };
      const related = await client.environments.getRelatedEntities(id);
      return {
        content: [{ type: "text", text: JSON.stringify(related, null, 2) }],
      };
    }

    default:
      return {
        content: [
          { type: "text", text: `Unknown environment tool: ${name}` },
        ],
        isError: true,
      };
  }
}
