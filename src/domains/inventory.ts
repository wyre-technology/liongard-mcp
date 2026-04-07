/**
 * Inventory domain tools for Liongard MCP Server
 *
 * Inventory covers asset identities (users, accounts) and
 * device profiles tracked by Liongard's inspection data.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Inventory domain tool definitions
 */
export const inventoryTools: Tool[] = [
  {
    name: "liongard_inventory_identities",
    description:
      "List asset identities in Liongard for a specific environment. Identities represent users, accounts, and other identity entities discovered through inspections. Use liongard_environments_list to find environment IDs.",
    inputSchema: {
      type: "object",
      properties: {
        environment: {
          type: "number",
          description:
            "REQUIRED. Liongard Environment ID to scope the query to. Use liongard_environments_list to discover environment IDs.",
        },
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        pageSize: {
          type: "number",
          description: "Number of items per page (default: 50)",
        },
        filters: {
          type: "array",
          description:
            "Optional Liongard query filters (array of filter objects).",
          items: { type: "object" },
        },
      },
      required: ["environment"],
    },
  },
  {
    name: "liongard_inventory_identity_get",
    description:
      "Get detailed information about a specific identity by its ID. Returns full identity profile.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The unique identity ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "liongard_inventory_devices",
    description:
      "List device profiles in Liongard for a specific environment. Device profiles represent hardware and software assets discovered through inspections. Use liongard_environments_list to find environment IDs.",
    inputSchema: {
      type: "object",
      properties: {
        environment: {
          type: "number",
          description:
            "REQUIRED. Liongard Environment ID to scope the query to. Use liongard_environments_list to discover environment IDs.",
        },
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        pageSize: {
          type: "number",
          description: "Number of items per page (default: 50)",
        },
        filters: {
          type: "array",
          description:
            "Optional Liongard query filters (array of filter objects).",
          items: { type: "object" },
        },
      },
      required: ["environment"],
    },
  },
  {
    name: "liongard_inventory_device_get",
    description:
      "Get detailed information about a specific device profile by its ID. Returns full device profile details.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The unique device profile ID",
        },
      },
      required: ["id"],
    },
  },
];

/**
 * Handle inventory domain tool calls
 */
export async function handleInventoryTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_inventory_identities": {
      const params = args as {
        environment: number;
        page?: number;
        pageSize?: number;
        filters?: Array<Record<string, unknown>> | Record<string, unknown>;
      };
      try {
        const response = await client.inventory.identities.list({
          environment: params.environment,
          page: params.page,
          pageSize: params.pageSize,
          filters: params.filters,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error listing identities: ${message}` }],
          isError: true,
        };
      }
    }

    case "liongard_inventory_identity_get": {
      const { id } = args as { id: number };
      const identity = await client.inventory.identities.get(id);
      return {
        content: [{ type: "text", text: JSON.stringify(identity, null, 2) }],
      };
    }

    case "liongard_inventory_devices": {
      const params = args as {
        environment: number;
        page?: number;
        pageSize?: number;
        filters?: Array<Record<string, unknown>> | Record<string, unknown>;
      };
      try {
        const response = await client.inventory.devices.list({
          environment: params.environment,
          page: params.page,
          pageSize: params.pageSize,
          filters: params.filters,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error listing devices: ${message}` }],
          isError: true,
        };
      }
    }

    case "liongard_inventory_device_get": {
      const { id } = args as { id: number };
      const device = await client.inventory.devices.get(id);
      return {
        content: [{ type: "text", text: JSON.stringify(device, null, 2) }],
      };
    }

    default:
      return {
        content: [
          { type: "text", text: `Unknown inventory tool: ${name}` },
        ],
        isError: true,
      };
  }
}
