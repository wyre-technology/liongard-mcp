/**
 * Tests for the lazy-loaded Liongard client utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the node-liongard module before importing the client
vi.mock("@wyre-technology/node-liongard", () => ({
  LiongardClient: vi.fn().mockImplementation(() => ({
    environments: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      getRelatedEntities: vi.fn(),
    },
    agents: { list: vi.fn(), delete: vi.fn(), generateInstaller: vi.fn() },
    inspectors: { list: vi.fn(), get: vi.fn() },
    launchpoints: { list: vi.fn(), create: vi.fn(), runNow: vi.fn() },
    systems: { list: vi.fn(), get: vi.fn() },
    detections: { list: vi.fn() },
    alerts: { list: vi.fn(), get: vi.fn() },
    metrics: { list: vi.fn(), evaluate: vi.fn(), evaluateSystems: vi.fn() },
    timeline: { list: vi.fn() },
    inventory: {
      identities: { list: vi.fn(), get: vi.fn() },
      devices: { list: vi.fn(), get: vi.fn() },
    },
  })),
}));

describe("client utility", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Reset modules to clear cached client
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getClient", () => {
    it("should throw error when LIONGARD_API_KEY is not set", async () => {
      delete process.env.LIONGARD_API_KEY;
      delete process.env.LIONGARD_INSTANCE;

      const { getClient } = await import("../utils/client.js");

      await expect(getClient()).rejects.toThrow(
        "LIONGARD_API_KEY and LIONGARD_INSTANCE environment variables are required"
      );
    });

    it("should throw error when LIONGARD_INSTANCE is not set", async () => {
      process.env.LIONGARD_API_KEY = "test-api-key";
      delete process.env.LIONGARD_INSTANCE;

      const { getClient } = await import("../utils/client.js");

      await expect(getClient()).rejects.toThrow(
        "LIONGARD_API_KEY and LIONGARD_INSTANCE environment variables are required"
      );
    });

    it("should create client when both env vars are set", async () => {
      process.env.LIONGARD_API_KEY = "test-api-key";
      process.env.LIONGARD_INSTANCE = "test-instance";

      const { getClient } = await import("../utils/client.js");
      const { LiongardClient } = await import(
        "@wyre-technology/node-liongard"
      );

      const client = await getClient();

      expect(LiongardClient).toHaveBeenCalledWith({
        instance: "test-instance",
        apiKey: "test-api-key",
        rateLimit: { enabled: false },
      });
      expect(client).toBeDefined();
    });

    it("should return same client instance on subsequent calls (lazy loading)", async () => {
      process.env.LIONGARD_API_KEY = "test-api-key";
      process.env.LIONGARD_INSTANCE = "test-instance";

      const { getClient } = await import("../utils/client.js");
      const { LiongardClient } = await import(
        "@wyre-technology/node-liongard"
      );

      const client1 = await getClient();
      const client2 = await getClient();

      // Should only create one instance
      expect(LiongardClient).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
    });
  });

  describe("resetClient", () => {
    it("should reset the client instance", async () => {
      process.env.LIONGARD_API_KEY = "test-api-key";
      process.env.LIONGARD_INSTANCE = "test-instance";

      const { getClient, resetClient } = await import("../utils/client.js");
      const { LiongardClient } = await import(
        "@wyre-technology/node-liongard"
      );

      await getClient();
      expect(LiongardClient).toHaveBeenCalledTimes(1);

      resetClient();

      await getClient();
      expect(LiongardClient).toHaveBeenCalledTimes(2);
    });
  });
});
