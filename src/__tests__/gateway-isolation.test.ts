/**
 * Cross-tenant credential isolation test for gateway mode.
 *
 * Regression test for a security bug: gateway mode used to stash the
 * per-request Liongard client in a module-level `_clientOverride` (set at
 * the top of the CallToolRequestSchema handler, cleared in a `finally`
 * block). `getClient()` checked that override *unconditionally*, before
 * ever looking at env vars — so any concurrent call path that reached
 * `getClient()` without setting its own override (e.g. a request whose
 * `credentialOverrides` came back `undefined` — such as a gateway request
 * missing its auth headers, which `index.ts`'s Node HTTP transport does
 * not reject before calling `createMcpServer()`) would silently inherit
 * whichever *other* tenant's client happened to still be active.
 *
 * This was verified empirically against the pre-fix code in this branch's
 * history: two fully-authenticated, valid tenants running concurrently
 * never actually cross-contaminate (each request resolves its client into
 * a local variable in one synchronous step with no `await` gap before the
 * read, so the override is always read back correctly by its own setter).
 * The real, reproducible leak is a valid in-flight tenant's client being
 * handed to a *different* concurrent call that has no credentials of its
 * own — exactly the scenario below.
 *
 * The fix removes the shared module-level override entirely and threads
 * the resolved client through as an explicit local parameter
 * (mcp-server.ts -> domain handler), so there is nothing left to read
 * that another request wrote.
 *
 * This test drives `createMcpServer()` directly (the same factory used by
 * every transport) over the MCP SDK's in-memory transport, deliberately
 * interleaving two concurrent tool calls so tenant A's vendor call is
 * still in flight when the second, credential-less call is dispatched. It
 * must fail against the old module-level-singleton implementation (tested
 * separately — see PR description) and pass against this fix.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const TENANT_A = { apiKey: "tenant-a-key", instance: "tenant-a-instance" };
const TENANT_B = { apiKey: "tenant-b-key", instance: "tenant-b-instance" };

// A manually-controlled gate: tenant A's vendor call blocks on this promise
// until the test explicitly releases it, forcing a real await gap between
// tenant A's client creation and tenant A's response — exactly the window
// the old _clientOverride bug raced on.
let gate: { promise: Promise<void>; release: () => void };
function freshGate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

function makeFakeClient(apiKey: string) {
  return {
    environments: {
      list: vi.fn().mockImplementation(async () => {
        if (apiKey === TENANT_A.apiKey) {
          // Tenant A blocks here until the test releases the gate, well
          // after the second, concurrent call has been dispatched.
          await gate.promise;
        }
        return { Data: [], Pagination: {}, __tag: apiKey };
      }),
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
  };
}

// Static top-level mock of the vendor SDK. Tagging the fake client by the
// apiKey it was constructed with lets the test assert that each response
// reflects the credentials it was dispatched with.
vi.mock("@wyre-technology/node-liongard", () => ({
  LiongardClient: vi
    .fn()
    .mockImplementation(function (opts: { apiKey: string; instance: string }) {
      return makeFakeClient(opts.apiKey);
    }),
}));

const { createMcpServer } = await import("../mcp-server.js");

/** Create a Server + connected Client pair over the SDK's in-memory transport. */
async function connectedClient(
  creds?: { apiKey: string; instance: string }
): Promise<Client> {
  const server = createMcpServer(creds);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0" });
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);
  return client;
}

function textOf(result: unknown): string {
  return (result as { content: { text: string }[] }).content[0].text;
}

describe("gateway mode cross-tenant credential isolation", () => {
  beforeEach(() => {
    gate = freshGate();
    vi.clearAllMocks();
  });

  it("never lets a credential-less concurrent call inherit an in-flight tenant's client", async () => {
    // This is the actual exploitable window: a request whose
    // credentialOverrides resolves to `undefined` (e.g. a gateway caller
    // missing auth headers) dispatched while a *different*, valid tenant's
    // request is still in flight. Under the old code, getClient() checked
    // the shared module-level override unconditionally, so the
    // credential-less call would silently receive tenant A's exact client.
    const clientA = await connectedClient(TENANT_A);
    const clientNoCreds = await connectedClient(undefined);

    const pA = clientA.callTool({
      name: "liongard_environments_list",
      arguments: {},
    });

    // Let tenant A's request run up to (and block on) its vendor call
    // before the second call is dispatched.
    await new Promise((resolve) => setTimeout(resolve, 10));

    const pNoCreds = clientNoCreds.callTool({
      name: "liongard_environments_list",
      arguments: {},
    });

    // Give the credential-less call a turn to run too, then release A.
    await new Promise((resolve) => setTimeout(resolve, 10));
    gate.release();

    const [resA, resNoCreds] = await Promise.all([pA, pNoCreds]);

    const textA = textOf(resA);
    const textNoCreds = textOf(resNoCreds);

    // Tenant A's own response is correct.
    expect(textA).toContain(TENANT_A.apiKey);

    // The credential-less call must NEVER see tenant A's client/credentials.
    expect(textNoCreds).not.toContain(TENANT_A.apiKey);
  });

  it("keeps two concurrent, interleaved, fully-authenticated tenants isolated", async () => {
    const clientA = await connectedClient(TENANT_A);
    const clientB = await connectedClient(TENANT_B);

    const pA = clientA.callTool({
      name: "liongard_environments_list",
      arguments: {},
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Tenant B's request runs to completion while A is still blocked.
    const resB = await clientB.callTool({
      name: "liongard_environments_list",
      arguments: {},
    });

    gate.release();
    const resA = await pA;

    const textA = textOf(resA);
    const textB = textOf(resB);

    expect(textA).toContain(TENANT_A.apiKey);
    expect(textA).not.toContain(TENANT_B.apiKey);

    expect(textB).toContain(TENANT_B.apiKey);
    expect(textB).not.toContain(TENANT_A.apiKey);

    const { LiongardClient } = await import("@wyre-technology/node-liongard");
    expect(LiongardClient).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: TENANT_A.apiKey })
    );
    expect(LiongardClient).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: TENANT_B.apiKey })
    );
  });
});
