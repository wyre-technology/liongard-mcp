#!/usr/bin/env node
/**
 * Liongard MCP Server
 *
 * This MCP server provides tools for interacting with the Liongard API.
 * All tools are listed upfront so they work with every MCP client, including
 * remote connectors (claude.ai, mcp-remote) that do not support dynamic
 * tool-list changes. A helper `liongard_navigate` tool provides domain
 * discovery and guidance.
 *
 * Supports both stdio and HTTP (StreamableHTTP) transports. The shared,
 * side-effect-free server factory lives in `mcp-server.ts` and is reused by
 * the Cloudflare Workers entrypoint (`worker.ts`).
 *
 * Authentication: Set LIONGARD_API_KEY and LIONGARD_INSTANCE environment variables (env mode)
 *                 or pass x-liongard-api-key and x-liongard-instance headers (gateway mode)
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  createMcpServer,
  resolveGatewayCredentials,
  type LiongardCredentials,
} from "./mcp-server.js";

/**
 * Transport and auth configuration types
 */
type TransportType = "stdio" | "http";
type AuthMode = "env" | "gateway";

/**
 * Start the server with stdio transport (default)
 */
async function startStdioTransport(): Promise<void> {
  const server = createMcpServer();
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

      // MCP endpoint — create a new Server + Transport per request so that
      // each initialize handshake gets a fresh server (the MCP SDK rejects
      // initialize on an already-initialized server).
      if (url.pathname === "/mcp") {
        console.error(`[MCP] ${req.method} /mcp from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} hasApiKey=${!!req.headers['x-liongard-api-key']} hasInstance=${!!req.headers['x-liongard-instance']}`);

        // In gateway mode, extract per-request credentials from headers
        // and pass them directly to createMcpServer() for isolation.
        // No process.env mutation — each request gets its own client.
        let credentialOverrides: LiongardCredentials | undefined;
        if (isGatewayMode) {
          const { creds } = resolveGatewayCredentials(
            (name) => req.headers[name] as string | undefined
          );
          credentialOverrides = creds;
        }

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        const server = createMcpServer(credentialOverrides);

        res.on("close", () => {
          transport.close();
          server.close();
        });

        server.connect(transport).then(() => {
          transport.handleRequest(req, res);
        }).catch((err) => {
          console.error('[MCP] transport error:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null }));
          }
        });
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
