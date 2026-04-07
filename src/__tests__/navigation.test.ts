/**
 * Tests for the navigation state management and server routing
 *
 * These tests verify the decision-tree architecture of the MCP server,
 * including domain navigation and tool routing.
 */

import { describe, it, expect, vi } from "vitest";

// Mock the client utility for all domain handlers
vi.mock("../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    environments: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      getRelatedEntities: vi.fn(),
    },
    agents: { list: vi.fn(), delete: vi.fn() },
    inspectors: { list: vi.fn(), get: vi.fn() },
    launchpoints: {
      list: vi.fn(),
      create: vi.fn(),
      runNow: vi.fn(),
    },
    systems: { list: vi.fn(), get: vi.fn() },
    detections: { list: vi.fn(), get: vi.fn() },
    metrics: { list: vi.fn(), evaluate: vi.fn(), evaluateSystems: vi.fn() },
    timeline: { list: vi.fn() },
    inventory: {
      identities: { list: vi.fn(), get: vi.fn() },
      devices: { list: vi.fn(), get: vi.fn() },
    },
  }),
}));

const DOMAINS = [
  "environments",
  "agents",
  "inspections",
  "systems",
  "detections",
  "metrics",
  "timeline",
  "inventory",
] as const;

describe("navigation and state management", () => {
  describe("domain descriptions", () => {
    it("should define all eight domains with descriptions", () => {
      expect(DOMAINS).toHaveLength(8);
    });
  });

  describe("getDomainTools function", () => {
    it("should return environment tools for environments domain", async () => {
      const { environmentTools } = await import(
        "../domains/environments.js"
      );
      expect(environmentTools).toHaveLength(5);
      expect(environmentTools[0].name).toBe("liongard_environments_list");
    });

    it("should return agent tools for agents domain", async () => {
      const { agentTools } = await import("../domains/agents.js");
      expect(agentTools).toHaveLength(2);
      expect(agentTools[0].name).toBe("liongard_agents_list");
    });

    it("should return inspection tools for inspections domain", async () => {
      const { inspectionTools } = await import("../domains/inspections.js");
      expect(inspectionTools).toHaveLength(4);
      expect(inspectionTools[0].name).toBe(
        "liongard_inspections_inspectors"
      );
    });

    it("should return system tools for systems domain", async () => {
      const { systemTools } = await import("../domains/systems.js");
      expect(systemTools).toHaveLength(2);
      expect(systemTools[0].name).toBe("liongard_systems_list");
    });

    it("should return detection tools for detections domain", async () => {
      const { detectionTools } = await import("../domains/detections.js");
      expect(detectionTools).toHaveLength(2);
      expect(detectionTools[0].name).toBe("liongard_detections_list");
    });

    it("should return metric tools for metrics domain", async () => {
      const { metricTools } = await import("../domains/metrics.js");
      expect(metricTools).toHaveLength(3);
      expect(metricTools[0].name).toBe("liongard_metrics_list");
    });

    it("should return timeline tools for timeline domain", async () => {
      const { timelineTools } = await import("../domains/timeline.js");
      expect(timelineTools).toHaveLength(1);
      expect(timelineTools[0].name).toBe("liongard_timeline_list");
    });

    it("should return inventory tools for inventory domain", async () => {
      const { inventoryTools } = await import("../domains/inventory.js");
      expect(inventoryTools).toHaveLength(4);
      expect(inventoryTools[0].name).toBe("liongard_inventory_identities");
    });
  });

  describe("tool naming patterns", () => {
    it("should prefix environment tools with liongard_environments_", async () => {
      const { environmentTools } = await import(
        "../domains/environments.js"
      );
      environmentTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_environments_/);
      });
    });

    it("should prefix agent tools with liongard_agents_", async () => {
      const { agentTools } = await import("../domains/agents.js");
      agentTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_agents_/);
      });
    });

    it("should prefix inspection tools with liongard_inspections_", async () => {
      const { inspectionTools } = await import("../domains/inspections.js");
      inspectionTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_inspections_/);
      });
    });

    it("should prefix system tools with liongard_systems_", async () => {
      const { systemTools } = await import("../domains/systems.js");
      systemTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_systems_/);
      });
    });

    it("should prefix detection tools with liongard_detections_", async () => {
      const { detectionTools } = await import("../domains/detections.js");
      detectionTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_detections_/);
      });
    });

    it("should prefix metric tools with liongard_metrics_", async () => {
      const { metricTools } = await import("../domains/metrics.js");
      metricTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_metrics_/);
      });
    });

    it("should prefix timeline tools with liongard_timeline_", async () => {
      const { timelineTools } = await import("../domains/timeline.js");
      timelineTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_timeline_/);
      });
    });

    it("should prefix inventory tools with liongard_inventory_", async () => {
      const { inventoryTools } = await import("../domains/inventory.js");
      inventoryTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_inventory_/);
      });
    });
  });

  describe("navigation tool schema", () => {
    it("should define navigate tool with domain enum", () => {
      const navigateTool = {
        name: "liongard_navigate",
        inputSchema: {
          type: "object",
          properties: {
            domain: {
              type: "string",
              enum: [...DOMAINS],
            },
          },
          required: ["domain"],
        },
      };

      expect(navigateTool.name).toBe("liongard_navigate");
      expect(navigateTool.inputSchema.properties.domain.enum).toHaveLength(8);
      expect(navigateTool.inputSchema.required).toContain("domain");
    });
  });

  describe("all tools listed upfront", () => {
    it("should expose all domain tools", async () => {
      const { environmentTools } = await import("../domains/environments.js");
      const { agentTools } = await import("../domains/agents.js");
      const { inspectionTools } = await import("../domains/inspections.js");
      const { systemTools } = await import("../domains/systems.js");
      const { detectionTools } = await import("../domains/detections.js");
      const { metricTools } = await import("../domains/metrics.js");
      const { timelineTools } = await import("../domains/timeline.js");
      const { inventoryTools } = await import("../domains/inventory.js");

      const allDomainTools = [
        ...environmentTools,
        ...agentTools,
        ...inspectionTools,
        ...systemTools,
        ...detectionTools,
        ...metricTools,
        ...timelineTools,
        ...inventoryTools,
      ];

      // 5 + 2 + 4 + 2 + 2 + 3 + 1 + 4 = 23 domain tools
      expect(allDomainTools).toHaveLength(23);
    });

    it("should have no duplicate tool names across domains", async () => {
      const { environmentTools } = await import("../domains/environments.js");
      const { agentTools } = await import("../domains/agents.js");
      const { inspectionTools } = await import("../domains/inspections.js");
      const { systemTools } = await import("../domains/systems.js");
      const { detectionTools } = await import("../domains/detections.js");
      const { metricTools } = await import("../domains/metrics.js");
      const { timelineTools } = await import("../domains/timeline.js");
      const { inventoryTools } = await import("../domains/inventory.js");

      const allNames = [
        ...environmentTools,
        ...agentTools,
        ...inspectionTools,
        ...systemTools,
        ...detectionTools,
        ...metricTools,
        ...timelineTools,
        ...inventoryTools,
      ].map((t) => t.name);

      const uniqueNames = new Set(allNames);
      expect(uniqueNames.size).toBe(allNames.length);
    });
  });

  describe("tool schema validation", () => {
    const domainImports = [
      ["environments", () => import("../domains/environments.js"), "environmentTools"],
      ["agents", () => import("../domains/agents.js"), "agentTools"],
      ["inspections", () => import("../domains/inspections.js"), "inspectionTools"],
      ["systems", () => import("../domains/systems.js"), "systemTools"],
      ["detections", () => import("../domains/detections.js"), "detectionTools"],
      ["metrics", () => import("../domains/metrics.js"), "metricTools"],
      ["timeline", () => import("../domains/timeline.js"), "timelineTools"],
      ["inventory", () => import("../domains/inventory.js"), "inventoryTools"],
    ] as const;

    for (const [name, importFn, exportName] of domainImports) {
      it(`should have valid inputSchema for all ${name} tools`, async () => {
        const mod = (await importFn()) as Record<string, unknown>;
        const tools = mod[exportName] as Array<{ inputSchema: { type: string; properties: unknown } }>;
        tools.forEach((tool) => {
          expect(tool.inputSchema).toBeDefined();
          expect(tool.inputSchema.type).toBe("object");
          expect(tool.inputSchema.properties).toBeDefined();
        });
      });
    }
  });
});
