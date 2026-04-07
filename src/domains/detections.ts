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
      "List detections in Liongard via GET /api/v1/detections. Optionally filter via Liongard query conditions and project specific fields. Returns a plain array (this endpoint is not paginated).",
    inputSchema: {
      type: "object",
      properties: {
        conditions: {
          type: "array",
          description:
            'Optional Liongard query conditions, e.g. [{"path":"Inspector/ID","op":"=","value":3}]. Each condition is sent as a repeated conditions[] query param.',
          items: { type: "object" },
        },
        fields: {
          type: "array",
          description:
            "Optional list of fields to return (projection). Each value is sent as a repeated fields[] query param.",
          items: { type: "string" },
        },
      },
    },
  },
  {
    name: "liongard_detections_get",
    description:
      "Get detailed information about a specific detection by its ID via GET /api/v1/detections/{id}.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The unique detection ID",
        },
      },
      required: ["id"],
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
        conditions?: Array<Record<string, unknown>>;
        fields?: string[];
      };
      try {
        const response = await client.detections.list({
          conditions: params.conditions,
          fields: params.fields,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: `Error listing detections: ${message}. Liongard's /api/v1/detections endpoint typically requires a 'conditions' filter, e.g. [{"path":"Inspector/ID","op":"=","value":3}].`,
            },
          ],
          isError: true,
        };
      }
    }

    case "liongard_detections_get": {
      const { id } = args as { id: number };
      try {
        const detection = await client.detections.get(id);
        return {
          content: [{ type: "text", text: JSON.stringify(detection, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error getting detection ${id}: ${message}` }],
          isError: true,
        };
      }
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
