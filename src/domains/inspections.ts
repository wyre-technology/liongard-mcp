/**
 * Inspections domain tools for Liongard MCP Server
 *
 * Inspections cover inspectors (inspection types) and launchpoints
 * (configured inspection instances) in Liongard.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Inspection domain tool definitions
 */
export const inspectionTools: Tool[] = [
  {
    name: "liongard_inspections_inspectors",
    description:
      "List available inspectors (inspection types) in Liongard with pagination. Inspectors define what data is collected.",
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
    name: "liongard_inspections_launchpoints",
    description:
      "List launchpoints (configured inspection instances) in Liongard with pagination. Launchpoints are configured instances of inspectors tied to environments.",
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
    name: "liongard_inspections_create_launchpoint",
    description:
      "Create a new launchpoint (configured inspection instance). Requires an inspector ID, environment ID, and a name.",
    inputSchema: {
      type: "object",
      properties: {
        Name: {
          type: "string",
          description: "Name for the launchpoint",
        },
        InspectorID: {
          type: "number",
          description: "The inspector type ID",
        },
        EnvironmentID: {
          type: "number",
          description: "The environment ID to associate with",
        },
        AgentID: {
          type: "number",
          description: "Optional agent ID to run the inspection on",
        },
        Schedule: {
          type: "string",
          description: "Optional schedule expression",
        },
      },
      required: ["Name", "InspectorID", "EnvironmentID"],
    },
  },
  {
    name: "liongard_inspections_run",
    description:
      "Trigger an immediate inspection run for a specific launchpoint. The inspection will execute as soon as possible.",
    inputSchema: {
      type: "object",
      properties: {
        launchpointId: {
          type: "number",
          description: "The launchpoint ID to run",
        },
      },
      required: ["launchpointId"],
    },
  },
];

/**
 * Handle inspection domain tool calls
 */
export async function handleInspectionTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "liongard_inspections_inspectors": {
      const params = args as { page?: number; pageSize?: number };
      const response = await client.inspectors.list({
        page: params.page,
        pageSize: params.pageSize,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "liongard_inspections_launchpoints": {
      const params = args as { page?: number; pageSize?: number };
      const response = await client.launchpoints.list({
        page: params.page,
        pageSize: params.pageSize,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "liongard_inspections_create_launchpoint": {
      const params = args as {
        Name: string;
        InspectorID: number;
        EnvironmentID: number;
        AgentID?: number;
        Schedule?: string;
      };
      const launchpoint = await client.launchpoints.create(params);
      return {
        content: [
          { type: "text", text: JSON.stringify(launchpoint, null, 2) },
        ],
      };
    }

    case "liongard_inspections_run": {
      const { launchpointId } = args as { launchpointId: number };
      await client.launchpoints.runNow(launchpointId);
      return {
        content: [
          {
            type: "text",
            text: `Inspection run triggered for launchpoint ${launchpointId}.`,
          },
        ],
      };
    }

    default:
      return {
        content: [
          { type: "text", text: `Unknown inspection tool: ${name}` },
        ],
        isError: true,
      };
  }
}
