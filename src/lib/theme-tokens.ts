/**
 * Runtime helpers for reading CSS semantic tokens and regenerating
 * the cobalt scale from a single brand hex (OKLCH).
 */

export const THEME_CHANGE_EVENT = "themechange";

export type SemanticTokenName =
  | "--ink"
  | "--text"
  | "--text-muted"
  | "--bg"
  | "--bg-alt"
  | "--surface"
  | "--line"
  | "--line-strong"
  | "--accent"
  | "--accent-hover"
  | "--accent-contrast"
  | "--accent-soft"
  | "--stamp-secondary"
  | "--inverse-bg"
  | "--inverse-text"
  | "--inverse-muted"
  | "--focus-ring"
  | "--partners-land"
  | "--partners-sphere"
  | "--cobalt-800"
  | "--cobalt-600"
  | "--cobalt-400"
  | "--cobalt-200"
  | "--cobalt-100";

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

/** Parse `#rgb` / `#rrggbb` → linear-ish sRGB 0–1 */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padStart(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(clamp(v) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** sRGB → OKLab */
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToRgb(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function oklchToOklab(L: number, C: number, H: number): [number, number, number] {
  const hr = (H * Math.PI) / 180;
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
}

const COBALT_LIGHTNESS: Record<string, number> = {
  "50": 0.97,
  "100": 0.93,
  "200": 0.85,
  "300": 0.76,
  "400": 0.66,
  "500": 0.55,
  "600": 0.45,
  "700": 0.38,
  "800": 0.31,
  "900": 0.24,
  "950": 0.18,
};

/** Build cobalt-50…950 hexes from a brand hex via OKLCH. */
export function generateCobaltScale(brandHex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(brandHex);
  const [L0, a0, b0] = rgbToOklab(r, g, b);
  const [, C0, H0] = oklabToOklch(L0, a0, b0);
  const out: Record<string, string> = {};
  for (const [step, L] of Object.entries(COBALT_LIGHTNESS)) {
    const C =
      step === "50" || step === "100"
        ? C0 * 0.35
        : step === "950"
          ? C0 * 0.55
          : C0 * (0.55 + (1 - Math.abs(L - L0)) * 0.45);
    const [L2, a2, b2] = oklchToOklab(L, C, H0);
    const [rr, gg, bb] = oklabToRgb(L2, a2, b2);
    out[step] = rgbToHex(rr, gg, bb);
  }
  // Pin 700 to the exact brand so the pivot stays faithful
  out["700"] = brandHex.startsWith("#") ? brandHex.toLowerCase() : `#${brandHex}`;
  return out;
}

/** Warm ↔ cool paper neutrals (t ≈ 0 cool, 1 warm). */
export function generatePaperScale(warmth = 0.55): Record<string, string> {
  const cool = {
    "50": "#f8f9fb",
    "100": "#f3f5f8",
    "200": "#e8ecf2",
    "300": "#d5dbe6",
    "400": "#b4bdc9",
  };
  const warm = {
    "50": "#fbfaf6",
    "100": "#f7f5ef",
    "200": "#efebe1",
    "300": "#e2dccd",
    "400": "#c9c1ae",
  };
  const t = clamp(warmth);
  const mix = (a: string, b: string) => {
    const [ar, ag, ab] = hexToRgb(a);
    const [br, bg, bb] = hexToRgb(b);
    return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
  };
  return {
    "50": mix(cool["50"], warm["50"]),
    "100": mix(cool["100"], warm["100"]),
    "200": mix(cool["200"], warm["200"]),
    "300": mix(cool["300"], warm["300"]),
    "400": mix(cool["400"], warm["400"]),
  };
}

export function readCssVar(
  name: string,
  el: HTMLElement = document.documentElement,
): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** Resolve a CSS color (hex / rgb / color-mix result) to [r,g,b] 0–1 */
export function cssColorToRgb(
  cssColor: string,
  el: HTMLElement = document.documentElement,
): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.color = cssColor;
  el.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const m = resolved.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return [0, 0.16, 0.6];
  return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
}

export function readTokenRgb(
  name: SemanticTokenName,
  el: HTMLElement = document.documentElement,
): [number, number, number] {
  const raw = readCssVar(name, el);
  if (raw.startsWith("#")) return hexToRgb(raw);
  return cssColorToRgb(raw || "currentColor", el);
}

export function dispatchThemeChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function onThemeChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
}

export function applyBrandToDocument(
  brandHex: string,
  opts: { warmth?: number; inkMode?: "brand" | "near-black" } = {},
) {
  const root = document.documentElement;
  const scale = generateCobaltScale(brandHex);
  for (const [step, hex] of Object.entries(scale)) {
    root.style.setProperty(`--cobalt-${step}`, hex);
  }
  root.style.setProperty("--brand", scale["700"]);
  root.style.setProperty("--cobalt-700", scale["700"]);

  if (opts.warmth != null) {
    root.style.setProperty("--paper-warmth", String(opts.warmth));
    const paper = generatePaperScale(opts.warmth);
    for (const [step, hex] of Object.entries(paper)) {
      root.style.setProperty(`--paper-${step}`, hex);
    }
  }

  if (opts.inkMode === "near-black") {
    root.style.setProperty("--ink", "var(--cobalt-950)");
  } else if (opts.inkMode === "brand") {
    root.style.setProperty("--ink", "var(--cobalt-700)");
  }

  dispatchThemeChange();
}

export function buildTokensCssBlock(
  brandHex: string,
  warmth = 0.55,
): string {
  const cobalt = generateCobaltScale(brandHex);
  const paper = generatePaperScale(warmth);
  const lines = [
    `  --brand: ${cobalt["700"]};`,
    ...Object.entries(cobalt).map(([k, v]) => `  --cobalt-${k}: ${v};`),
    ...Object.entries(paper).map(([k, v]) => `  --paper-${k}: ${v};`),
    `  --paper-warmth: ${warmth};`,
  ];
  return `:root {\n${lines.join("\n")}\n}`;
}
