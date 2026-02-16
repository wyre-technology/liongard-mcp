#!/usr/bin/env node
/**
 * Liongard MCP Server
 *
 * This MCP server provides tools for interacting with the Liongard API.
 * It implements a decision tree architecture where tools are dynamically
 * loaded based on the selected domain.
 *
 * Supports both stdio and HTTP (StreamableHTTP) transports.
 * Authentication: Set LIONGARD_API_KEY and LIONGARD_INSTANCE environment variables (env mode)
 *                 or pass x-liongard-api-key and x-liongard-instance headers (gateway mode)
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Domain imports
import {
  environmentTools,
  handleEnvironmentTool,
} from "./domains/environments.js";
import { agentTools, handleAgentTool } from "./domains/agents.js";
import {
  inspectionTools,
  handleInspectionTool,
} from "./domains/inspections.js";
import { systemTools, handleSystemTool } from "./domains/systems.js";
import { detectionTools, handleDetectionTool } from "./domains/detections.js";
import { alertTools, handleAlertTool } from "./domains/alerts.js";
import { metricTools, handleMetricTool } from "./domains/metrics.js";
import { timelineTools, handleTimelineTool } from "./domains/timeline.js";
import { inventoryTools, handleInventoryTool } from "./domains/inventory.js";
import { resetClient } from "./utils/client.js";

/**
 * Transport and auth configuration types
 */
type TransportType = "stdio" | "http";
type AuthMode = "env" | "gateway";

/**
 * Available domains for navigation
 */
type Domain =
  | "environments"
  | "agents"
  | "inspections"
  | "systems"
  | "detections"
  | "alerts"
  | "metrics"
  | "timeline"
  | "inventory";

/**
 * Domain metadata for navigation
 */
const domainDescriptions: Record<Domain, string> = {
  environments:
    "Environment/company management - list, get, create environments, count, and view related entities",
  agents:
    "Agent management - list agents, bulk delete, and generate installers for on-premise data collection",
  inspections:
    "Inspection management - list inspectors and launchpoints, create launchpoints, and trigger inspection runs",
  systems:
    "System management - list and get infrastructure components discovered through inspections",
  detections:
    "Detection monitoring - list configuration changes and anomalies identified by inspections",
  alerts:
    "Alert management - list and get alerts generated from detection rules",
  metrics:
    "Metrics evaluation - list metrics, evaluate across systems, and evaluate per system",
  timeline:
    "Timeline view - chronological list of inspection events and configuration changes",
  inventory:
    "Asset inventory - manage identities (users/accounts) and device profiles discovered through inspections",
};

/**
 * Server state management
 */
interface ServerState {
  currentDomain: Domain | null;
}

const state: ServerState = {
  currentDomain: null,
};

/**
 * Get tools for a specific domain
 */
function getDomainTools(domain: Domain): Tool[] {
  switch (domain) {
    case "environments":
      return environmentTools;
    case "agents":
      return agentTools;
    case "inspections":
      return inspectionTools;
    case "systems":
      return systemTools;
    case "detections":
      return detectionTools;
    case "alerts":
      return alertTools;
    case "metrics":
      return metricTools;
    case "timeline":
      return timelineTools;
    case "inventory":
      return inventoryTools;
  }
}

/**
 * Navigation tool - entry point for decision tree
 */
const navigateTool: Tool = {
  name: "liongard_navigate",
  description:
    "Navigate to a specific domain in Liongard. Call this first to select which area you want to work with. After navigation, domain-specific tools will be available.",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        enum: [
          "environments",
          "agents",
          "inspections",
          "systems",
          "detections",
          "alerts",
          "metrics",
          "timeline",
          "inventory",
        ],
        description: `The domain to navigate to:
- environments: ${domainDescriptions.environments}
- agents: ${domainDescriptions.agents}
- inspections: ${domainDescriptions.inspections}
- systems: ${domainDescriptions.systems}
- detections: ${domainDescriptions.detections}
- alerts: ${domainDescriptions.alerts}
- metrics: ${domainDescriptions.metrics}
- timeline: ${domainDescriptions.timeline}
- inventory: ${domainDescriptions.inventory}`,
      },
    },
    required: ["domain"],
  },
};

/**
 * Back navigation tool - return to domain selection
 */
const backTool: Tool = {
  name: "liongard_back",
  description:
    "Return to domain selection. Use this to switch to a different area of Liongard.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Create the MCP server
 */
const server = new Server(
  {
    name: "liongard-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle ListTools requests - returns tools based on current state
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [];

  if (state.currentDomain === null) {
    // At root - show navigation tool only
    tools.push(navigateTool);
  } else {
    // In a domain - show domain tools plus back navigation
    tools.push(backTool);
    tools.push(...getDomainTools(state.currentDomain));
  }

  return { tools };
});

/**
 * Handle CallTool requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Handle navigation
    if (name === "liongard_navigate") {
      const { domain } = args as { domain: Domain };
      state.currentDomain = domain;

      const domainTools = getDomainTools(domain);
      const toolNames = domainTools.map((t) => t.name).join(", ");

      return {
        content: [
          {
            type: "text",
            text: `Navigated to ${domain} domain. Available tools: ${toolNames}`,
          },
        ],
      };
    }

    // Handle back navigation
    if (name === "liongard_back") {
      state.currentDomain = null;
      return {
        content: [
          {
            type: "text",
            text: "Returned to domain selection. Use liongard_navigate to select a domain: environments, agents, inspections, systems, detections, alerts, metrics, timeline, inventory",
          },
        ],
      };
    }

    // Route to appropriate domain handler
    const toolArgs = (args ?? {}) as Record<string, unknown>;

    if (name.startsWith("liongard_environments_")) {
      return await handleEnvironmentTool(name, toolArgs);
    }
    if (name.startsWith("liongard_agents_")) {
      return await handleAgentTool(name, toolArgs);
    }
    if (name.startsWith("liongard_inspections_")) {
      return await handleInspectionTool(name, toolArgs);
    }
    if (name.startsWith("liongard_systems_")) {
      return await handleSystemTool(name, toolArgs);
    }
    if (name.startsWith("liongard_detections_")) {
      return await handleDetectionTool(name, toolArgs);
    }
    if (name.startsWith("liongard_alerts_")) {
      return await handleAlertTool(name, toolArgs);
    }
    if (name.startsWith("liongard_metrics_")) {
      return await handleMetricTool(name, toolArgs);
    }
    if (name.startsWith("liongard_timeline_")) {
      return await handleTimelineTool(name, toolArgs);
    }
    if (name.startsWith("liongard_inventory_")) {
      return await handleInventoryTool(name, toolArgs);
    }

    // Unknown tool
    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${name}. Use liongard_navigate to select a domain first.`,
        },
      ],
      isError: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

/**
 * Start the server with stdio transport (default)
 */
async function startStdioTransport(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Liongard MCP server running on stdio");
}

/**
 * Start the server with HTTP Streamable transport
 * In gateway mode, credentials are extracted from request headers on each request
 */
async function startHttpTransport(): Promise<void> {
  const port = parseInt(process.env.MCP_HTTP_PORT || "8080", 10);
  const host = process.env.MCP_HTTP_HOST || "0.0.0.0";
  const authMode = (process.env.AUTH_MODE as AuthMode) || "env";
  const isGatewayMode = authMode === "gateway";

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  const httpServer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(
        req.url || "/",
        `http://${req.headers.host || "localhost"}`
      );

      // Health endpoint - no auth required
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            transport: "http",
            authMode: isGatewayMode ? "gateway" : "env",
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // MCP endpoint
      if (url.pathname === "/mcp") {
        // In gateway mode, extract credentials from headers
        if (isGatewayMode) {
          const apiKey = req.headers["x-liongard-api-key"] as
            | string
            | undefined;
          const instance = req.headers["x-liongard-instance"] as
            | string
            | undefined;

          if (!apiKey || !instance) {
            console.error(
              "Gateway mode: Missing x-liongard-api-key or x-liongard-instance header"
            );
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Missing credentials",
                message:
                  "Gateway mode requires X-Liongard-API-Key and X-Liongard-Instance headers",
                required: ["X-Liongard-API-Key", "X-Liongard-Instance"],
              })
            );
            return;
          }

          // Reset client so next getClient() picks up the new credentials
          resetClient();
          process.env.LIONGARD_API_KEY = apiKey;
          process.env.LIONGARD_INSTANCE = instance;
        }

        transport.handleRequest(req, res);
        return;
      }

      // 404 for everything else
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Not found",
          endpoints: ["/mcp", "/health"],
        })
      );
    }
  );

  await server.connect(transport);

  await new Promise<void>((resolve) => {
    httpServer.listen(port, host, () => {
      console.error(
        `Liongard MCP server listening on http://${host}:${port}/mcp`
      );
      console.error(
        `Health check available at http://${host}:${port}/health`
      );
      console.error(
        `Authentication mode: ${isGatewayMode ? "gateway (header-based)" : "env (environment variables)"}`
      );
      resolve();
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.error("Shutting down Liongard MCP server...");
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

/**
 * Main entry point - selects transport based on MCP_TRANSPORT env var
 */
async function main() {
  const transportType =
    (process.env.MCP_TRANSPORT as TransportType) || "stdio";

  if (transportType === "http") {
    await startHttpTransport();
  } else {
    await startStdioTransport();
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

main().catch(console.error);
