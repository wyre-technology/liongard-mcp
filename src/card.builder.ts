/**
 * Detection-card payload builder for the MCP Apps (SEP-1865) UI surface.
 *
 * liongard_detections_get results get a normalized `_card` object attached
 * (see domains/detections.ts) that the ui:// detection card renders from.
 * The card is progressive enhancement: every step here is best-effort, and a
 * null return simply means the host renders no card while the JSON payload is
 * unchanged.
 */

import type { Detection, LiongardClient } from "@wyre-technology/node-liongard";

export const DETECTION_CARD_RESOURCE_URI = "ui://liongard/detection-card.html";

/** MCP Apps resource MIME (RESOURCE_MIME_TYPE in @modelcontextprotocol/ext-apps). */
export const MCP_APP_RESOURCE_MIME = "text/html;profile=mcp-app";

/**
 * Tool `_meta` advertising the card. Carries both the canonical flat key
 * (RESOURCE_URI_META_KEY in ext-apps) and the nested form ext-apps'
 * registerAppTool emits, so any MCP Apps host revision finds it.
 */
export const DETECTION_CARD_META = {
  "ui/resourceUri": DETECTION_CARD_RESOURCE_URI,
  ui: { resourceUri: DETECTION_CARD_RESOURCE_URI },
} as const;

/** Brand overrides injected into the card as `window.__BRAND__`. */
export interface CardBrand {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  bg?: string;
  text?: string;
}

/** The comment marker in ui/index.html that serve-time injection replaces. */
const BRAND_INJECT_MARKER = /<!-- BRAND_INJECT:[\s\S]*?-->/;

/**
 * Replace the card's brand-inject comment with a `window.__BRAND__` script.
 * The card ships neutral; this is the customization mechanism. An empty
 * brand returns the HTML unchanged. `<` is escaped so brand values can
 * never break out of the injected script tag.
 */
export function applyBrandInjection(html: string, brand: CardBrand): string {
  const entries = Object.entries(brand).filter(
    ([, value]) => typeof value === "string" && value !== ""
  );
  if (entries.length === 0) return html;
  const json = JSON.stringify(Object.fromEntries(entries)).replace(/</g, "\\u003c");
  return html.replace(BRAND_INJECT_MARKER, `<script>window.__BRAND__=${json}</script>`);
}

/**
 * Resolve brand overrides from MCP_BRAND_* environment variables. Returns
 * an empty brand (HTML served unchanged) when none are set, or on runtimes
 * without `process.env` (e.g. Cloudflare Workers without nodejs_compat).
 */
export function resolveBrandFromEnv(): CardBrand {
  if (typeof process === "undefined" || !process.env) return {};
  const env = process.env;
  const brand: CardBrand = {};
  if (env.MCP_BRAND_NAME) brand.name = env.MCP_BRAND_NAME;
  if (env.MCP_BRAND_LOGO_URL) brand.logoUrl = env.MCP_BRAND_LOGO_URL;
  if (env.MCP_BRAND_PRIMARY_COLOR) brand.primaryColor = env.MCP_BRAND_PRIMARY_COLOR;
  if (env.MCP_BRAND_ACCENT_COLOR) brand.accentColor = env.MCP_BRAND_ACCENT_COLOR;
  if (env.MCP_BRAND_BG) brand.bg = env.MCP_BRAND_BG;
  if (env.MCP_BRAND_TEXT) brand.text = env.MCP_BRAND_TEXT;
  return brand;
}

/** Mirror of DetectionCard in ui/detection-card.ts — keep in sync. */
export interface DetectionCard {
  id: number;
  title: string;
  severity?: string;
  status?: string;
  description?: string;
  system?: string;
  environment?: string;
  detectedOn?: string;
  resolvedOn?: string;
}

const CARD_DESCRIPTION_MAX_LENGTH = 500;

/**
 * Resolve a raw Liongard id into a display label using a lookup the server
 * already exposes (systems.get / environments.get). Best-effort: a failed
 * lookup falls back to a `#id` label rather than failing the card.
 */
async function resolveLabel(
  id: unknown,
  lookup: (id: number) => Promise<string | undefined>
): Promise<string | undefined> {
  if (typeof id !== "number") return undefined;
  try {
    const name = await lookup(id);
    if (typeof name === "string" && name) return name;
  } catch {
    /* best-effort — fall through to the #id label */
  }
  return `#${id}`;
}

/**
 * Normalize a Liongard detection into the flat, label-resolved payload the
 * ui:// detection card renders from. The raw SystemID / EnvironmentID are
 * resolved into names via the same SDK lookups liongard_systems_get and
 * liongard_environments_get use — each resolution is best-effort.
 */
export async function buildDetectionCard(
  detection: Partial<Detection> | null | undefined,
  client: Pick<LiongardClient, "systems" | "environments">
): Promise<DetectionCard | null> {
  if (
    !detection ||
    typeof detection.ID !== "number" ||
    typeof detection.Type !== "string" ||
    !detection.Type
  ) {
    return null;
  }

  const card: DetectionCard = {
    id: detection.ID,
    title: detection.Type,
  };

  if (typeof detection.Severity === "string" && detection.Severity) {
    card.severity = detection.Severity;
  }
  if (typeof detection.Status === "string" && detection.Status) {
    card.status = detection.Status;
  }
  if (typeof detection.Description === "string" && detection.Description) {
    card.description = detection.Description.slice(0, CARD_DESCRIPTION_MAX_LENGTH);
  }
  if (typeof detection.DetectedOn === "string" && detection.DetectedOn) {
    card.detectedOn = detection.DetectedOn;
  }
  if (typeof detection.ResolvedOn === "string" && detection.ResolvedOn) {
    card.resolvedOn = detection.ResolvedOn;
  }

  const [system, environment] = await Promise.all([
    resolveLabel(detection.SystemID, (id) => client.systems.get(id).then((s) => s?.Name)),
    resolveLabel(detection.EnvironmentID, (id) =>
      client.environments.get(id).then((e) => e?.Name)
    ),
  ]);
  if (system) card.system = system;
  if (environment) card.environment = environment;

  return card;
}
