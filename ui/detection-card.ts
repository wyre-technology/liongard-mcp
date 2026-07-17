/**
 * Iframe bridge + renderer for the Liongard detection card (MCP Apps,
 * SEP-1865).
 *
 * Runs inside the host's sandboxed iframe. Uses the official MCP Apps client
 * (`App`) to receive the liongard_detections_get tool result from the host.
 * The card is read-only — Liongard detections have no safe single write
 * action, so no round-trip is exposed.
 *
 * The server attaches a normalized `_card` payload to liongard_detections_get
 * results (see src/card.builder.ts) so this renderer never needs to resolve
 * system/environment ids itself.
 *
 * Rendering uses DOM construction (no innerHTML) — detection descriptions and
 * entity names are untrusted vendor data, so text only ever lands in text
 * nodes.
 *
 * White-label: the card is neutral by default (no vendor identity) and
 * applies an injected `window.__BRAND__` override (set by the MCP server via
 * MCP_BRAND_* env vars, or a gateway per-org) so the same card can render in
 * any operator's brand.
 */
import { App } from "@modelcontextprotocol/ext-apps";

interface Brand {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  bg?: string;
  text?: string;
}
declare global {
  interface Window {
    __BRAND__?: Brand;
  }
}

/** Mirror of DetectionCard in src/card.builder.ts — keep in sync. */
interface DetectionCard {
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

const brand: Brand = window.__BRAND__ ?? {};

// Apply any injected brand overrides onto the CSS custom properties.
function applyBrand(): void {
  const root = document.documentElement.style;
  if (brand.primaryColor) root.setProperty("--brand-primary", brand.primaryColor);
  if (brand.accentColor) root.setProperty("--brand-accent", brand.accentColor);
  if (brand.bg) root.setProperty("--brand-bg", brand.bg);
  if (brand.text) root.setProperty("--brand-text", brand.text);
}

const app = new App({ name: "Liongard Detection Card", version: "1.0.0" });

/** Create an element with a class and (safe, text-node) children. */
function el(
  tag: string,
  className = "",
  ...children: Array<Node | string | null>
): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const child of children) {
    if (child == null) continue;
    node.append(child); // strings become text nodes — never parsed as HTML
  }
  return node;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function field(label: string, value: string | undefined, withDot = false): HTMLElement | null {
  if (!value) return null;
  const valueEl = el("div", withDot ? "field__value withdot" : "field__value");
  if (withDot) valueEl.append(el("span", "dot"));
  valueEl.append(value);
  return el("div", "field", el("div", "field__label", label), valueEl);
}

function badge(text: string | undefined, cls: string): HTMLElement | null {
  return text ? el("span", `badge ${cls}`, text) : null;
}

function render(d: DetectionCard): void {
  // Brand identity only renders when a brand was injected — the neutral
  // default card carries no identity at all.
  const brandId = el("span", "brandid");
  if (brand.logoUrl) {
    const logo = document.createElement("img");
    logo.src = brand.logoUrl;
    logo.alt = brand.name ?? "";
    logo.style.display = "inline-block";
    brandId.append(logo);
  }
  if (brand.name) brandId.append(el("span", "brand", brand.name));

  let descriptionSection: HTMLElement | null = null;
  if (d.description) {
    descriptionSection = el(
      "div",
      "description",
      el("div", "description__h", "Description"),
      el("div", "description__body", d.description),
    );
  }

  const body = el(
    "div",
    "card__body",
    el("div", "brandrow", brandId, el("span", "detectionid", `Detection #${d.id} · Liongard`)),
    el("h1", "", d.title),
    el("div", "badges", badge(d.severity, "badge--severity"), badge(d.status, "badge--status")),
    el(
      "div",
      "grid",
      field("System", d.system),
      field("Environment", d.environment, true),
      field("Detected", d.detectedOn && fmtDate(d.detectedOn)),
      field("Resolved", d.resolvedOn && fmtDate(d.resolvedOn)),
    ),
    descriptionSection,
  );

  const root = document.getElementById("root")!;
  root.replaceChildren(el("div", "card", el("div", "card__bar"), body));
}

// liongard-mcp returns the detection JSON directly, with the normalized card
// attached as a top-level _card field.
function extractCard(obj: unknown): DetectionCard | null {
  const card = (obj as { _card?: DetectionCard })?._card;
  return card && typeof card.id === "number" && typeof card.title === "string" && card.title
    ? card
    : null;
}

applyBrand();

// Must be set before connect() so the initial tool-result isn't missed.
app.ontoolresult = (result: { content?: Array<{ type: string; text?: string }> }) => {
  const payload = (result.content ?? []).find((c) => c.type === "text");
  if (!payload?.text) return;
  try {
    const card = extractCard(JSON.parse(payload.text));
    if (card) render(card);
  } catch {
    /* ignore malformed payloads */
  }
};

app.connect();
