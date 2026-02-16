/**
 * Tests for the alerts domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { alertTools, handleAlertTool } from "../../domains/alerts.js";

// Mock the client utility
const mockClient = {
  alerts: {
    list: vi.fn(),
    get: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    alerts: { list: vi.fn(), get: vi.fn() },
  }),
}));

describe("alerts domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("alertTools", () => {
    it("should export two alert tools", () => {
      expect(alertTools).toHaveLength(2);
    });

    it("should have liongard_alerts_list tool", () => {
      const listTool = alertTools.find(
        (t) => t.name === "liongard_alerts_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("pageSize");
    });

    it("should have liongard_alerts_get tool with required id", () => {
      const getTool = alertTools.find(
        (t) => t.name === "liongard_alerts_get"
      );
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.properties).toHaveProperty("id");
      expect(getTool?.inputSchema.required).toContain("id");
    });
  });

  describe("handleAlertTool", () => {
    describe("liongard_alerts_list", () => {
      it("should call client.alerts.list with pagination params", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.alerts.list.mockResolvedValue(mockResponse);

        const result = await handleAlertTool("liongard_alerts_list", {
          page: 1,
          pageSize: 50,
        });

        expect(mockClient.alerts.list).toHaveBeenCalledWith({
          page: 1,
          pageSize: 50,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call with default params when none provided", async () => {
        const mockResponse = { data: [], meta: { page: 1, totalPages: 1 } };
        mockClient.alerts.list.mockResolvedValue(mockResponse);

        await handleAlertTool("liongard_alerts_list", {});

        expect(mockClient.alerts.list).toHaveBeenCalledWith({
          page: undefined,
          pageSize: undefined,
        });
      });
    });

    describe("liongard_alerts_get", () => {
      it("should call client.alerts.get with id", async () => {
        const mockAlert = {
          ID: 456,
          Name: "MFA Disabled Alert",
          Severity: "Critical",
        };
        mockClient.alerts.get.mockResolvedValue(mockAlert);

        const result = await handleAlertTool("liongard_alerts_get", {
          id: 456,
        });

        expect(mockClient.alerts.get).toHaveBeenCalledWith(456);
        expect(result.content[0].text).toContain("MFA Disabled Alert");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown alert tool", async () => {
        const result = await handleAlertTool("liongard_alerts_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown alert tool");
      });
    });
  });
});
