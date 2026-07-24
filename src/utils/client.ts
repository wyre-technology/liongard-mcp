/**
 * Lazy-loaded Liongard client utility
 *
 * Implements lazy loading pattern to defer client instantiation
 * until first use, reducing startup time and memory footprint.
 *
 * In gateway mode, per-request credentials are threaded explicitly as a
 * parameter through createMcpServer() -> each domain handler -> getClient(),
 * never touching a shared module-level variable. (A prior version of this
 * fix used a module-level `_clientOverride` set/cleared per request — that
 * shared mutable global raced under concurrent requests for different
 * tenants the same way process.env mutation does elsewhere; explicit
 * parameter-threading has no shared state to race on.)
 */

import type { LiongardClient } from "@wyre-technology/node-liongard";

let _client: LiongardClient | null = null;

export interface LiongardCredentials {
  apiKey: string;
  instance: string;
}

/**
 * Create a fresh LiongardClient directly from credentials,
 * bypassing environment variables and the module-level cache.
 */
export async function createClientDirect(
  creds: LiongardCredentials
): Promise<LiongardClient> {
  const { LiongardClient } = await import("@wyre-technology/node-liongard");
  return new LiongardClient({
    instance: creds.instance,
    apiKey: creds.apiKey,
    rateLimit: { enabled: false },
  });
}

/**
 * Get the Liongard client for this call.
 *
 * When `credentials` is provided (gateway mode), builds a fresh client
 * directly from it — no caching, no shared state, so concurrent requests
 * for different tenants can never observe each other's client. Otherwise
 * falls back to a lazy-loaded singleton built from process.env (stdio /
 * env mode, where there's a single process-lifetime credential set and no
 * concurrent multi-tenant requests to race).
 *
 * @throws Error if credentials are missing and LIONGARD_API_KEY /
 *   LIONGARD_INSTANCE environment variables are not set
 * @returns Promise resolving to the LiongardClient instance
 */
export async function getClient(
  credentials?: LiongardCredentials
): Promise<LiongardClient> {
  if (credentials) {
    return createClientDirect(credentials);
  }

  if (!_client) {
    const apiKey = process.env.LIONGARD_API_KEY;
    const instance = process.env.LIONGARD_INSTANCE;
    if (!apiKey || !instance) {
      throw new Error(
        "LIONGARD_API_KEY and LIONGARD_INSTANCE environment variables are required. " +
          "Set them to your Liongard API key and instance subdomain."
      );
    }

    const { LiongardClient } = await import("@wyre-technology/node-liongard");
    _client = new LiongardClient({
      instance,
      apiKey,
      rateLimit: { enabled: false },
    });
  }
  return _client;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetClient(): void {
  _client = null;
}
