/**
 * Lazy-loaded Liongard client utility
 *
 * Implements lazy loading pattern to defer client instantiation
 * until first use, reducing startup time and memory footprint.
 *
 * In gateway mode, per-request credential isolation is achieved via
 * setClientOverride / clearClientOverride so that concurrent requests
 * never share process.env mutations.
 */

import type { LiongardClient } from "@wyre-technology/node-liongard";

let _client: LiongardClient | null = null;

/** Per-request client override — takes priority over the cached singleton */
let _clientOverride: LiongardClient | null = null;

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
 * Set a request-scoped client override.
 * While set, getClient() returns this instance instead of the cached one.
 */
export function setClientOverride(client: LiongardClient): void {
  _clientOverride = client;
}

/**
 * Clear the request-scoped client override.
 */
export function clearClientOverride(): void {
  _clientOverride = null;
}

/**
 * Get or create the Liongard client instance.
 * Returns the per-request override if set, otherwise the lazy-loaded singleton.
 *
 * @throws Error if LIONGARD_API_KEY or LIONGARD_INSTANCE environment variables are not set
 * @returns Promise resolving to the LiongardClient instance
 */
export async function getClient(): Promise<LiongardClient> {
  if (_clientOverride) {
    return _clientOverride;
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
 * Reset the client instance (useful for testing and gateway mode)
 */
export function resetClient(): void {
  _client = null;
}
