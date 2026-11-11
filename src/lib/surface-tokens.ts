/**
 * Read semantic surface tokens from an element (or its nearest surface-* ancestor).
 */

export const THEME_CHANGE_EVENT = "themechange";

export function nearestSurface(el: Element | null): HTMLElement {
  if (!el) return document.documentElement;
  const found = el.closest(".surface-light, .surface-blue");
  return (found as HTMLElement) || document.documentElement;
}

export function readCssVar(name: string, el?: Element | null): string {
  const target = nearestSurface(el ?? null);
  return getComputedStyle(target).getPropertyValue(name).trim();
}

export function cssColorToRgb(
  cssColor: string,
  el?: Element | null,
): [number, number, number] {
  const host = nearestSurface(el ?? null);
  const probe = document.createElement("span");
  probe.style.color = cssColor;
  host.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const m = resolved.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return [0, 0.165, 0.604];
  return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
}

export function readTokenRgb(
  name: string,
  el?: Element | null,
): [number, number, number] {
  const raw = readCssVar(name, el);
  if (raw.startsWith("#") && (raw.length === 7 || raw.length === 4)) {
    const h = raw.slice(1);
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = Number.parseInt(full, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  return cssColorToRgb(raw || "currentColor", el);
}

export function onThemeChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
}

export function rgba(
  rgb: [number, number, number],
  alpha: number,
): string {
  const [r, g, b] = rgb;
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${alpha})`;
}
