/**
 * Lazy-loaded Liongard client utility
 *
 * Implements lazy loading pattern to defer client instantiation
 * until first use, reducing startup time and memory footprint.
 */

import type { LiongardClient } from "@wyre-technology/node-liongard";

let _client: LiongardClient | null = null;

/**
 * Get or create the Liongard client instance.
 * Uses lazy loading to defer instantiation until first use.
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
 * Reset the client instance (useful for testing and gateway mode)
 */
export function resetClient(): void {
  _client = null;
}
