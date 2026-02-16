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
      "List asset identities in Liongard with pagination and optional filters. Identities represent users, accounts, and other identity entities discovered through inspections.",
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
            "Optional filters to narrow results (e.g., by environment)",
        },
      },
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
      "List device profiles in Liongard with pagination and optional filters. Device profiles represent hardware and software assets discovered through inspections.",
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
            "Optional filters to narrow results (e.g., by environment)",
        },
      },
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
        page?: number;
        pageSize?: number;
        filters?: Record<string, unknown>;
      };
      const response = await client.inventory.identities.list(
        { page: params.page, pageSize: params.pageSize },
        params.filters
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
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
        page?: number;
        pageSize?: number;
        filters?: Record<string, unknown>;
      };
      const response = await client.inventory.devices.list(
        { page: params.page, pageSize: params.pageSize },
        params.filters
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
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
