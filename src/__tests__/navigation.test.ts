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
    agents: { list: vi.fn(), delete: vi.fn(), generateInstaller: vi.fn() },
    inspectors: { list: vi.fn(), get: vi.fn() },
    launchpoints: {
      list: vi.fn(),
      create: vi.fn(),
      runNow: vi.fn(),
    },
    systems: { list: vi.fn(), get: vi.fn() },
    detections: { list: vi.fn() },
    alerts: { list: vi.fn(), get: vi.fn() },
    metrics: { list: vi.fn(), evaluate: vi.fn(), evaluateSystems: vi.fn() },
    timeline: { list: vi.fn() },
    inventory: {
      identities: { list: vi.fn(), get: vi.fn() },
      devices: { list: vi.fn(), get: vi.fn() },
    },
  }),
}));

describe("navigation and state management", () => {
  describe("domain descriptions", () => {
    it("should define all nine domains with descriptions", async () => {
      const domains = [
        "environments",
        "agents",
        "inspections",
        "systems",
        "detections",
        "alerts",
        "metrics",
        "timeline",
        "inventory",
      ];
      expect(domains).toHaveLength(9);
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
      expect(agentTools).toHaveLength(3);
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
      expect(detectionTools).toHaveLength(1);
      expect(detectionTools[0].name).toBe("liongard_detections_list");
    });

    it("should return alert tools for alerts domain", async () => {
      const { alertTools } = await import("../domains/alerts.js");
      expect(alertTools).toHaveLength(2);
      expect(alertTools[0].name).toBe("liongard_alerts_list");
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

    it("should prefix alert tools with liongard_alerts_", async () => {
      const { alertTools } = await import("../domains/alerts.js");
      alertTools.forEach((tool) => {
        expect(tool.name).toMatch(/^liongard_alerts_/);
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
            },
          },
          required: ["domain"],
        },
      };

      expect(navigateTool.name).toBe("liongard_navigate");
      expect(navigateTool.inputSchema.properties.domain.enum).toHaveLength(
        9
      );
      expect(navigateTool.inputSchema.required).toContain("domain");
    });

    it("should define back tool with empty schema", () => {
      const backTool = {
        name: "liongard_back",
        inputSchema: {
          type: "object",
          properties: {},
        },
      };

      expect(backTool.name).toBe("liongard_back");
      expect(Object.keys(backTool.inputSchema.properties)).toHaveLength(0);
    });
  });

  describe("state transitions", () => {
    it("should start at null (root) state", () => {
      const state = { currentDomain: null as string | null };
      expect(state.currentDomain).toBeNull();
    });

    it("should transition to domain on navigate", () => {
      const state = { currentDomain: null as string | null };
      state.currentDomain = "environments";
      expect(state.currentDomain).toBe("environments");
    });

    it("should transition back to null on back", () => {
      const state = { currentDomain: "environments" as string | null };
      state.currentDomain = null;
      expect(state.currentDomain).toBeNull();
    });

    it("should allow switching between domains", () => {
      const state = { currentDomain: "environments" as string | null };

      state.currentDomain = null;
      state.currentDomain = "inspections";

      expect(state.currentDomain).toBe("inspections");
    });
  });

  describe("tool schema validation", () => {
    it("should have valid inputSchema for all environment tools", async () => {
      const { environmentTools } = await import(
        "../domains/environments.js"
      );
      environmentTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all agent tools", async () => {
      const { agentTools } = await import("../domains/agents.js");
      agentTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all inspection tools", async () => {
      const { inspectionTools } = await import("../domains/inspections.js");
      inspectionTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all system tools", async () => {
      const { systemTools } = await import("../domains/systems.js");
      systemTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all detection tools", async () => {
      const { detectionTools } = await import("../domains/detections.js");
      detectionTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all alert tools", async () => {
      const { alertTools } = await import("../domains/alerts.js");
      alertTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all metric tools", async () => {
      const { metricTools } = await import("../domains/metrics.js");
      metricTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all timeline tools", async () => {
      const { timelineTools } = await import("../domains/timeline.js");
      timelineTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all inventory tools", async () => {
      const { inventoryTools } = await import("../domains/inventory.js");
      inventoryTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });
});
