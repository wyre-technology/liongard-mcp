/**
 * Tests for the lazy-loaded Liongard client utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the node-liongard module before importing the client
vi.mock("@wyre-technology/node-liongard", () => ({
  LiongardClient: vi.fn().mockImplementation(function () { return ({
    environments: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      getRelatedEntities: vi.fn(),
    },
    agents: { list: vi.fn(), delete: vi.fn() },
    inspectors: { list: vi.fn(), get: vi.fn() },
    launchpoints: { list: vi.fn(), create: vi.fn(), runNow: vi.fn() },
    systems: { list: vi.fn(), get: vi.fn() },
    detections: { list: vi.fn(), get: vi.fn() },
    metrics: { list: vi.fn(), evaluate: vi.fn(), evaluateSystems: vi.fn() },
    timeline: { list: vi.fn() },
    inventory: {
      identities: { list: vi.fn(), get: vi.fn() },
      devices: { list: vi.fn(), get: vi.fn() },
    },
  }) }),
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

  describe("getClient(credentials) — explicit per-request credentials", () => {
    it("builds a fresh client directly from the given credentials, ignoring process.env", async () => {
      delete process.env.LIONGARD_API_KEY;
      delete process.env.LIONGARD_INSTANCE;

      const { getClient } = await import("../utils/client.js");
      const { LiongardClient } = await import(
        "@wyre-technology/node-liongard"
      );

      const client = await getClient({
        apiKey: "override-key",
        instance: "override-instance",
      });

      expect(LiongardClient).toHaveBeenCalledWith({
        instance: "override-instance",
        apiKey: "override-key",
        rateLimit: { enabled: false },
      });
      expect(client).toBeDefined();
    });

    it("builds a fresh client on every call — no shared state across calls", async () => {
      const { getClient } = await import("../utils/client.js");
      const { LiongardClient } = await import(
        "@wyre-technology/node-liongard"
      );

      const first = await getClient({ apiKey: "k1", instance: "i1" });
      const second = await getClient({ apiKey: "k1", instance: "i1" });

      expect(LiongardClient).toHaveBeenCalledTimes(2);
      expect(second).not.toBe(first);
    });

    it(
      "does not contaminate a concurrent request with another tenant's credentials " +
        "(regression test for the module-level _clientOverride race)",
      async () => {
        const { getClient } = await import("../utils/client.js");
        const { LiongardClient } = await import(
          "@wyre-technology/node-liongard"
        );

        const calls: Array<{ instance: string; apiKey: string }> = [];
        (LiongardClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          function (config: { instance: string; apiKey: string }) {
            calls.push(config);
            return { config };
          }
        );

        // Simulate two concurrent gateway requests for different tenants.
        // Under the old module-level `_clientOverride` implementation, B's
        // setClientOverride() (or clearClientOverride() in its `finally`)
        // could race with A's still-in-flight getClient() read, letting A
        // observe B's client (or nothing at all).
        const [clientA, clientB] = await Promise.all([
          (async () => {
            await new Promise((r) => setTimeout(r, 10));
            return getClient({ apiKey: "tenant-a-key", instance: "tenant-a" });
          })(),
          getClient({ apiKey: "tenant-b-key", instance: "tenant-b" }),
        ]);

        // Identity-distinctness (clientA !== clientB) and membership
        // (calls contains both configs) alone are NOT sufficient evidence:
        // both stay true even if a reintroduced singleton swapped which
        // client each variable actually received. The load-bearing
        // assertions are the per-variable VALUE checks below — proving
        // clientA specifically holds tenant-a's config and clientB
        // specifically holds tenant-b's, not just "two distinct clients
        // were built somewhere."
        expect(clientA).not.toBe(clientB);
        expect(clientA).toMatchObject({
          config: { instance: "tenant-a", apiKey: "tenant-a-key" },
        });
        expect(clientB).toMatchObject({
          config: { instance: "tenant-b", apiKey: "tenant-b-key" },
        });
      }
    );
  });
});
