/**
 * Lazy-loaded Liongard client utility
 *
 * Implements lazy loading pattern to defer client instantiation
 * until first use, reducing startup time and memory footprint.
 *
 * In gateway mode, per-request credential isolation is achieved by
 * creating a client directly via createClientDirect() and threading it
 * through as an explicit parameter — there is no shared mutable client
 * state in the gateway path.
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
 * Get or create the Liongard client instance.
 * Returns the lazy-loaded singleton built from process.env (env mode).
 *
 * @throws Error if LIONGARD_API_KEY or LIONGARD_INSTANCE environment variables are not set
 * @returns Promise resolving to the LiongardClient instance
 */
export async function getClient(): Promise<LiongardClient> {
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
 * Reset the cached env-mode client instance (useful for testing).
 */
export function resetClient(): void {
  _client = null;
}
