"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

// ---- pixel-atlas.tsx ----
/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/set-state-in-effect -- these rules assume code runs while rendering; here refs, timers and setState are used in handlers, effects and animation frames, and the animation state lives in refs on purpose */


export type AtlasPoint = {
  id: string;
  name: string;
  /** "office", "hub" and "partner" have their own marks; any other word works and gets a filter of its own */
  type: string;
  lat: number;
  lon: number;
  description?: string;
  /** how busy it is; the busiest place is the hottest on the map */
  activity?: number;
};

export type PixelAtlasProps = {
  points?: AtlasPoint[];
  /** Height in px, or "fill" to fill a positioned parent. */
  height?: number | "fill";
  /** Degrees of the world in each pixel of the map: smaller is finer. 3.2 by default. */
  resolution?: number;
  /** Six colours for the heat, coolest to hottest. */
  palette?: string[];
  /** Visit the places one by one until someone takes over. On by default. */
  tour?: boolean;
  /** Seconds at each place on the tour. */
  tourEvery?: number;
  /** Called with the place that is selected, or null. */
  onSelect?: (point: AtlasPoint | null) => void;
  className?: string;
};

const DEFAULT_POINTS: AtlasPoint[] = [
  { id: "sf", name: "San Francisco", type: "hub", lat: 37.77, lon: -122.42, description: "Headquarters, and home of the design team.", activity: 2600 },
  { id: "van", name: "Vancouver", type: "office", lat: 49.28, lon: -123.12, description: "Pacific studio for product engineering.", activity: 640 },
  { id: "aus", name: "Austin", type: "office", lat: 30.27, lon: -97.74, description: "Central US operations.", activity: 980 },
  { id: "nyc", name: "New York", type: "hub", lat: 40.71, lon: -74.01, description: "East Coast sales and customer success.", activity: 2100 },
  { id: "tor", name: "Toronto", type: "office", lat: 43.65, lon: -79.38, description: "Canada headquarters and support desk.", activity: 1300 },
  { id: "sao", name: "São Paulo", type: "partner", lat: -23.55, lon: -46.63, description: "Reseller for Brazil and the Southern Cone.", activity: 720 },
  { id: "lon", name: "London", type: "hub", lat: 51.51, lon: -0.13, description: "Europe headquarters, sales and partnerships.", activity: 2300 },
  { id: "ber", name: "Berlin", type: "office", lat: 52.52, lon: 13.4, description: "Design and research studio.", activity: 1100 },
  { id: "lag", name: "Lagos", type: "partner", lat: 6.52, lon: 3.38, description: "Payments partner for West Africa.", activity: 430 },
  { id: "nbo", name: "Nairobi", type: "partner", lat: -1.29, lon: 36.82, description: "Field team for East Africa.", activity: 380 },
  { id: "dxb", name: "Dubai", type: "partner", lat: 25.2, lon: 55.27, description: "Distribution across the Gulf.", activity: 610 },
  { id: "bom", name: "Mumbai", type: "hub", lat: 19.08, lon: 72.88, description: "South Asia hub, with support around the clock.", activity: 1700 },
  { id: "sin", name: "Singapore", type: "hub", lat: 1.35, lon: 103.82, description: "Asia-Pacific headquarters.", activity: 1900 },
  { id: "tyo", name: "Tokyo", type: "office", lat: 35.68, lon: 139.69, description: "Japan office and localisation.", activity: 1200 },
  { id: "syd", name: "Sydney", type: "office", lat: -33.87, lon: 151.21, description: "Australia and New Zealand.", activity: 870 },
];
const DEFAULT_PALETTE = ["#3b3658", "#5c3a9c", "#b2388a", "#e9553f", "#ff9a48", "#ffe7b3"];
const SIGMA = 0.15; // how far each place's warmth reaches, as a chord of the unit globe (about 9 degrees)
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// The land, from Natural Earth (public domain) at 1:50m: a 1440 by 720 map of the world, one bit per quarter of a
// degree, stored as run lengths.
const LAND_W = 1440;
const LAND_H = 720;
const LAND =
  "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gwEDhgEFBcEBDUwCDbkBDw0MHQQBhAQCCwcCNBB+BYoBAwfBAQxdtwEQBgEEDhWfBAIGMxB9Ao8BAwm9AQEECF26AQ0GExIBAaEEAQYzDZICAgq9AQIDCFy5AQ4FFAEEDaIEAgcyCzgC2wECCb4BDFy4AQ4JFwujBAIGNAltAaoBAQq9AQxbtwEPCBgLowQCBjQJPAEuAqwBAQu8AQpctgENCRkLrAQ1CF0CAgEBAcEBvgEHXLcBCgoaC6UEAgY1B1UBDQHCAb8BBAECWbsBBBIVCqYEAwY1BqkCvgECWAQF0AEBAREIpgQFBjQEqwKUAgcFzgEWBakEBgU1AasCAgICAY4CCATOARYCrQQFB+ACBQKMAgkEzgEGAgMCAQusBAYHMAKvApECCQTNAQcUrAQGBy8CsQL1ARMBDwXLAQMarAQGCC0BtQIJAecBCgUWBAEE4QGvBAYI5QIIAQEB4wENBRMIBwHRAQIFsgQGCeYCCATgAQ8GDwwBBdABBQKyBAYJKQG+AggC3AEGCQcEDhPNAQEBuAQHBO8CCALYAQUNFxPJAQEGuAQHBAYB6gIGAQEB1QEEEBUVAgHCAQcBuwQHBPQCAwLWAQIRFxfBAcMECAPyAtwBAg0BAxgWxAHBBAkD8wLbAQEPBAEVFgECwwG+BAsC9ALaAQEUFgwBBwEFxgG6BAsD9ALXAQEVDAEaAgMFyQG2BAwE8wLWAQEWJQMEBcoBpAECjgMNBPQC7QECAQ0CEQIFAQEDzAGdAQUvC9YCDgUiAdAC7QECAQwD6QGZAQYwDtUCDQMBA/IC7gECCAMD7AGBAQQPCi0Q1AIOAgQB8gLwAQQCBAfqAX8HCw0qEdQCEAEfAtYC8gEIAgED6wF+DQYLKxLTAjAC1wL+Ae0BOQNADQkJKAEBE9MCMAHZAuoBAw/vATYFQQsMAQMBAQIoEQQB0QISAhkB3QLnAQUO8QE3BAMBPQ4NASoQ1gITBBUC3wLkAQYN9AE3BQEBAQE7EAcIJxDWAhUEEgLhAuIBBgv4ATYKORIEDiMPAQLUAhYFEAHjAt8BCAj8ATYLNxQBESMN1wIXBwoB5gLdAQsH/QEmBQwKNykhD9MCFwoEAQIB5wLbAQ0G/QEmCQsKNSogD9ICGA8BAegC2AESAuQBBAIEESMMDQoyLCAP0AIZD+oC1wH3ATIECA8NCzAuHg/P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";

const decodeLand = (() => {
  let cache: Uint8Array | null = null;
  return () => {
    if (cache) return cache;
    const bin = atob(LAND);
    const out = new Uint8Array(LAND_W * LAND_H);
    let p = 0;
    let v = 0;
    let i = 0;
    while (i < bin.length) {
      let run = 0;
      let shift = 0;
      for (;;) {
        const b = bin.charCodeAt(i++);
        run |= (b & 127) << shift;
        if (b < 128) break;
        shift += 7;
      }
      if (v) out.fill(1, p, p + run);
      p += run;
      v ^= 1;
    }
    cache = out;
    return out;
  };
})();

// ───────────────────────── projection ─────────────────────────
// Miller cylindrical: the familiar wall-map shape, without Mercator's swollen poles.
const D2R = Math.PI / 180;
const millerY = (lat: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat));
const millerLat = (y: number) => 2.5 * Math.atan(Math.exp(0.8 * y)) - 0.625 * Math.PI;
const LAT_MIN = -57 * D2R;
const LAT_MAX = 83 * D2R;
const Y0 = millerY(LAT_MIN);
const Y1 = millerY(LAT_MAX);
const TAU = Math.PI * 2;

type Grid = { pitch: number; cols: number; rows: number; cov: Uint8Array };
const gridCache = new Map<number, Grid>();
/** how much of each cell is land, from the embedded map, sampled 6 by 6 within the cell */
const buildGrid = (deg: number): Grid => {
  const hit = gridCache.get(deg);
  if (hit) return hit;
  const land = decodeLand();
  const pitch = deg * D2R;
  const cols = Math.round(360 / deg);
  const rows = Math.ceil((Y1 - Y0) / pitch);
  const cov = new Uint8Array(cols * rows);
  const N = 6;
  const sample = (lon: number, lat: number) => {
    const x = ((((lon + Math.PI) / TAU) * LAND_W) % LAND_W + LAND_W) % LAND_W;
    const y = clamp(((Math.PI / 2 - lat) / Math.PI) * LAND_H, 0, LAND_H - 1);
    return land[Math.floor(y) * LAND_W + Math.floor(x)];
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let s = 0;
      for (let b = 0; b < N; b++) {
        const lat = millerLat(Y0 + (j + (b + 0.5) / N) * pitch);
        for (let a = 0; a < N; a++) s += sample(-Math.PI + (i + (a + 0.5) / N) * pitch, lat);
      }
      cov[j * cols + i] = Math.round((s / (N * N)) * 255);
    }
  }
  const g = { pitch, cols, rows, cov };
  gridCache.set(deg, g);
  return g;
};

// ───────────────────────── colour ─────────────────────────
const hex3 = (h: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  const n = m ? parseInt(m[1], 16) : 0x808080;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const rampAt = (pal: [number, number, number][], t: number) => {
  const x = clamp(t) * (pal.length - 1);
  const i = Math.min(pal.length - 2, Math.floor(x));
  const f = x - i;
  return pal[i].map((v, k) => v + (pal[i + 1][k] - v) * f) as [number, number, number];
};
const css = (c: [number, number, number], a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

// ───────────────────────── shader ─────────────────────────
const MAXP = 24;
const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uDpr;
uniform vec3 uCam; // centre x, centre y (world), pixels per world unit
uniform float uPitch; uniform ivec2 uGrid; uniform float uY0;
uniform sampler2D uCov;
uniform vec4 uPts[${MAXP}]; uniform int uN; uniform float uSigma;
uniform float uT; uniform float uIntro; uniform float uMotion;
uniform vec2 uPtr; uniform float uPtrOn;
uniform vec4 uSel; uniform float uPing;
uniform vec3 uPal[6]; uniform vec3 uCold; uniform vec3 uSea; uniform vec3 uBg;
out vec4 o;
float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 pal(float t){
  float x = clamp(t, 0.0, 1.0) * 5.0;
  int i = int(min(floor(x), 4.0));
  return mix(uPal[i], uPal[i + 1], smoothstep(0.0, 1.0, x - float(i)));
}
vec3 unitAt(float x, float y){
  float lat = 2.5 * atan(exp(0.8 * y)) - 0.625 * 3.14159265;
  float c = cos(lat);
  return vec3(c * cos(x), c * sin(x), sin(lat));
}
// heat: each point warms the land around it, and sends slow waves of signal outward
float heatAt(vec3 u, float waves){
  float h = 0.0;
  float s2 = 2.0 * uSigma * uSigma;
  for (int k = 0; k < ${MAXP}; k++) {
    if (k >= uN) break;
    vec4 P = uPts[k];
    if (P.w <= 0.001) continue;
    float ch = 2.0 - 2.0 * dot(u, P.xyz); // chord squared
    float g = exp(-ch / s2);
    float wv = 0.0;
    if (waves > 0.0) {
      float d = sqrt(max(ch, 0.0));
      wv = waves * 0.22 * exp(-d / (uSigma * 2.2)) * pow(0.5 + 0.5 * sin(d * 26.0 - uT * 1.9 + float(k) * 1.7), 6.0);
    }
    h += P.w * (g + wv);
  }
  return 1.0 - exp(-h * 1.15);
}
float box(vec2 p, float b, float r){ vec2 q = abs(p) - vec2(b - r); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 view = uRes / uDpr;
  vec2 w = vec2(uCam.x + (px.x - view.x * 0.5) / uCam.z, uCam.y - (px.y - view.y * 0.5) / uCam.z);
  // under everything, a soft glow of the same heat, so the grid sits on light rather than on black
  vec2 vg = (px / view - 0.5) * vec2(1.0, 1.25);
  vec3 col = uBg * (1.0 - 0.45 * dot(vg, vg));
  float jy = floor((w.y - uY0) / uPitch);
  float ix = floor(w.x / uPitch + float(uGrid.x) * 0.5);
  if (jy < 0.0 || jy >= float(uGrid.y)) { o = vec4(col, 1.0); return; }
  vec3 uPix = unitAt(w.x, w.y);
  float hp = heatAt(uPix, 0.0);
  col += pal(hp * 0.85) * hp * hp * 0.11;
  int ii = int(mod(ix, float(uGrid.x)));
  int jj = int(jy);
  float cov = texelFetch(uCov, ivec2(ii, jj), 0).r;
  vec2 cellC = vec2((ix + 0.5 - float(uGrid.x) * 0.5) * uPitch, uY0 + (jy + 0.5) * uPitch);
  vec2 loc = (w - cellC) / uPitch; // -0.5..0.5 inside the cell
  float cellPx = uPitch * uCam.z;
  vec3 u = unitAt(cellC.x, cellC.y);
  float rnd = hash(vec2(float(ii), float(jj)));
  float h = heatAt(u, uMotion);
  // each cell flickers a little, like a live reading
  h = clamp(h + (rnd - 0.5) * 0.04 + uMotion * 0.028 * sin(uT * (0.9 + rnd * 1.6) + rnd * 40.0), 0.0, 1.0);
  float land = smoothstep(0.22, 0.62, cov);
  // the intro: cells pop in from west to east, then the heat rises into them
  vec2 cs = vec2(cellC.x - uCam.x, uCam.y - cellC.y) * uCam.z + view * 0.5;
  float del = clamp(cs.x / view.x, -0.2, 1.2) * 0.85 + rnd * 0.12 + abs(cs.y / view.y - 0.5) * 0.12;
  float pop = clamp((uIntro - del) / 0.45, 0.0, 1.0);
  float back = 1.0 + 2.2 * (pop - 1.0) * (pop - 1.0) * (pop - 1.0) + 1.2 * (pop - 1.0) * (pop - 1.0);
  float warm = smoothstep(0.0, 1.0, (uIntro - 1.15 - del * 0.6) / 1.1);
  // the lens round the pointer
  float dp = length(cs - uPtr) / max(cellPx * 4.5, 40.0);
  float lens = uPtrOn * exp(-dp * dp) * uMotion;
  // the selected point's ping: a ring that runs outward through the cells
  float ping = 0.0;
  if (uSel.w > 0.5) {
    float ds = sqrt(max(2.0 - 2.0 * dot(u, uSel.xyz), 0.0));
    ping = exp(-pow((ds - uPing * uSigma * 3.2) / (uSigma * 0.22), 2.0)) * (1.0 - uPing) * uMotion;
  }
  float size = mix(0.17 + 0.08 * h, 0.72 + 0.06 * h, land) + 0.12 * lens * land + 0.05 * ping * land;
  size *= back;
  float r = mix(0.5, 0.12, land) * size;
  float d = box(loc, size * 0.5, r) * cellPx;
  float a = clamp(0.5 - d, 0.0, 1.0);
  // colour: cold land is slate, warming through the palette; sea dots carry a faint version of the heat
  float hw = h * warm;
  vec3 lc = mix(uCold, pal(hw), smoothstep(0.06, 0.32, hw));
  lc *= 0.82 + 0.18 * rnd + 0.25 * lens + 0.6 * ping;
  vec3 sc = mix(uSea, pal(hw) * 0.75, smoothstep(0.08, 0.6, hw)) * (1.0 + 0.6 * lens + 0.8 * ping);
  vec3 cc = mix(sc, lc, land);
  // a brief bright edge on the wave of cells as it passes
  cc += vec3(0.55, 0.6, 0.7) * land * (1.0 - smoothstep(0.35, 1.0, pop)) * step(0.001, pop) * 0.6;
  col = mix(col, cc, a * min(1.0, pop * 3.0));
  o = vec4(col, 1.0);
}`;

const compile = (gl: WebGL2RenderingContext) => {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, mk(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, FRAG));
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  return p;
};
const UNIFORMS = ["uRes", "uDpr", "uCam", "uPitch", "uGrid", "uY0", "uCov", "uPts", "uN", "uSigma", "uT", "uIntro", "uMotion", "uPtr", "uPtrOn", "uSel", "uPing", "uPal", "uCold", "uSea", "uBg"];

// ───────────────────────── helpers ─────────────────────────
type Spr = { x: number; v: number };
const spr = (x: number): Spr => ({ x, v: 0 });
const step = (s: Spr, to: number, hz: number, z: number, dt: number) => {
  const w = TAU * hz;
  s.v += (w * w * (to - s.x) - 2 * z * w * s.v) * dt;
  s.x += s.v * dt;
};
const wrapPi = (x: number) => ((((x + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const fmtLat = (lat: number) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
const fmtLon = (lon: number) => `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n)));
const unit = (lat: number, lon: number): [number, number, number] => [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
const TYPE_LABEL: Record<string, string> = { office: "Office", hub: "Hub", partner: "Partner" };
const label = (t: string) => TYPE_LABEL[t] ?? t.charAt(0).toUpperCase() + t.slice(1);

/** the little square that stands for each kind of place */
function Glyph({ type, size = 8, color = "currentColor" }: { type: string; size?: number; color?: string }) {
  if (type === "partner")
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden>
        <rect x="0.75" y="0.75" width="6.5" height="6.5" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  if (type === "office")
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden>
        <rect x="0.75" y="0.75" width="6.5" height="6.5" fill="none" stroke={color} strokeWidth="1.5" />
        <rect x="3" y="3" width="2" height="2" fill={color} />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden>
      <rect x="0" y="0" width="8" height="8" fill={color} />
    </svg>
  );
}

/**
 * Pixel atlas: a live map of where you are in the world, drawn as a grid of glowing pixels. Every place you pass
 * warms the land around it, so the map reads as a heat map of your activity: slate where nothing happens, through
 * violet and magenta to orange and cream at the busiest places, with slow waves of signal running outward from
 * each one and the cells flickering like live readings. The sea is a field of faint dots that catch the glow.
 *
 * It opens with the pixels popping in from west to east before the heat rises into them, then tours your places
 * one by one: the selected place pings, a crosshair runs through it and a card tells its story. A lens follows the
 * pointer and swells the pixels under it; the readout in the corner gives the coordinates under the pointer. Drag
 * to pan (it wraps all the way round the world) and pinch, Ctrl-scroll or the buttons to zoom; the filters fade the
 * other places out and glide the camera to fit the ones left. The coastlines come from Natural Earth and each
 * cell's size follows how much of it is land, so the map stays smooth at every zoom.
 *
 * Every place is a real button with a label, the arrow keys pan and + and - zoom, Escape closes the card, it pauses
 * off screen, holds still under reduced motion, and draws a plain version without WebGL 2.
 */
export function PixelAtlas({
  points = DEFAULT_POINTS,
  height = 520,
  resolution = 3.2,
  palette,
  tour = true,
  tourEvery = 4,
  onSelect,
  className = "",
}: PixelAtlasProps) {
  const reduced = !!useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inView = useInView(host, { amount: 0.1 });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [glOk, setGlOk] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const deg = clamp(resolution, 1, 6);
  const grid = useMemo(() => buildGrid(deg), [deg]);
  const types = useMemo(() => Array.from(new Set(points.map((p) => p.type))), [points]);
  const maxAct = useMemo(() => Math.max(1, ...points.map((p) => p.activity ?? 0)), [points]);
  const pal = useMemo(() => (palette && palette.length >= 6 ? palette.slice(0, 6) : DEFAULT_PALETTE).map(hex3), [palette]);
  const visible = useMemo(() => points.filter((p) => filter === "all" || p.type === filter), [points, filter]);
  const sel = points.find((p) => p.id === selId) ?? null;
  const selRef = useRef<string | null>(null);
  selRef.current = selId;
  const live = useRef({ filter, visible });
  live.current = { filter, visible };
  const cb = useRef({ onSelect });
  cb.current = { onSelect };

  const el = {
    readout: useRef<HTMLSpanElement>(null),
    card: useRef<HTMLDivElement>(null),
    crossH: useRef<HTMLDivElement>(null),
    crossV: useRef<HTMLDivElement>(null),
    marks: useRef<Map<string, HTMLButtonElement>>(new Map()),
  };

  // everything that moves lives here, outside React
  const S = useRef({
    cam: { x: spr(10 * D2R), y: spr(millerY(28 * D2R)), z: spr(1) },
    target: { x: 10 * D2R, y: millerY(28 * D2R), z: 1 },
    fitZ: 1,
    weights: new Map<string, Spr>(),
    t: 0,
    intro: reduced ? 9 : 0,
    ptr: { x: -1e4, y: -1e4, on: 0 },
    ptrOn: spr(0),
    drag: null as null | { x: number; y: number; cx: number; cy: number; moved: boolean; vx: number; vy: number; lt: number },
    fling: { vx: 0, vy: 0 },
    lastTouch: -1e9,
    ping: 0,
    tourAt: 2.6,
    followed: null as string | null,
  });

  // size
  useEffect(() => {
    const n = host.current;
    if (!n) return;
    const ro = new ResizeObserver(() => setBox({ w: n.clientWidth, h: n.clientHeight }));
    ro.observe(n);
    setBox({ w: n.clientWidth, h: n.clientHeight });
    return () => ro.disconnect();
  }, []);

  /** the furthest out it zooms: the whole world, or as far as keeps each pixel at least 7px across */
  const minZoom = useCallback(() => (box.w ? Math.max(0.55, 7 / (grid.pitch * (box.w / (220 * D2R)))) : 0.55), [box.w, grid.pitch]);

  const select = useCallback((id: string | null) => {
    setSelId(id);
    S.current.ping = 0;
    const p = id ? points.find((q) => q.id === id) ?? null : null;
    cb.current.onSelect?.(p);
  }, [points]);

  /** glide the camera to fit a set of places */
  const fit = useCallback(
    (list: AtlasPoint[]) => {
      const st = S.current;
      if (!box.w || !box.h || !list.length) return;
      // cut the circle of longitudes at its widest empty gap, so a set that spans the Pacific stays together
      const lons = list.map((p) => wrapPi(p.lon * D2R)).sort((a, b) => a - b);
      let cut = lons[0] - (TAU - (lons[lons.length - 1] - lons[0])) / 2;
      let gap = TAU - (lons[lons.length - 1] - lons[0]);
      for (let k = 1; k < lons.length; k++) {
        if (lons[k] - lons[k - 1] > gap) {
          gap = lons[k] - lons[k - 1];
          cut = (lons[k] + lons[k - 1]) / 2;
        }
      }
      const xs = list.map((p) => cut + ((((p.lon * D2R - cut) % TAU) + TAU) % TAU));
      const ys = list.map((p) => millerY(clamp(p.lat, -56, 82) * D2R));
      // leave room round the edges in pixels, more at the bottom for the filters, and enough for the card
      const padX = Math.min(90, box.w * 0.09);
      const padT = Math.min(70, box.h * 0.12);
      const padB = Math.min(124, box.h * 0.26);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs);
      const y0 = Math.min(...ys);
      const y1 = Math.max(...ys);
      const base = box.w / (220 * D2R);
      const zx = (box.w - 2 * padX) / Math.max(0.05, x1 - x0);
      const zy = (box.h - padT - padB) / Math.max(0.05, y1 - y0);
      const zmin = minZoom();
      const z = clamp(Math.min(zx, zy) / base, zmin, Math.max(zmin, list.length === 1 ? 2.2 : 3.2));
      const k = base * z;
      // centre so the margins come out as asked
      const cy = (y0 + y1) / 2 + (padB - padT) / 2 / k;
      st.target = { x: (x0 + x1) / 2, y: clamp(cy, Y0 + box.h / 2 / k, Y1 - box.h / 2 / k), z };
      st.fitZ = z;
      if (reduced) {
        st.cam.x.x = st.target.x;
        st.cam.y.x = st.target.y;
        st.cam.z.x = z;
      }
    },
    [box.w, box.h, reduced, minZoom],
  );

  // the first fit, and a new fit whenever the filter changes
  const fitted = useRef(false);
  useEffect(() => {
    if (!box.w) return;
    fit(visible);
    if (!fitted.current) {
      const st = S.current;
      st.cam.x.x = st.target.x;
      st.cam.y.x = st.target.y;
      st.cam.z.x = st.target.z;
      fitted.current = true;
    }
    if (selId && !visible.some((p) => p.id === selId)) select(null);
    S.current.tourAt = S.current.t + 1.2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, box.w, box.h, points]);

  // drawing
  useEffect(() => {
    const W = box.w;
    const H = box.h;
    const cv = canvas.current;
    if (!cv || W < 20 || H < 20) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const st = S.current;
    const base = W / (220 * D2R); // pixels per world unit at zoom 1
    const cold = hex3("#39404b");
    const sea = hex3("#232b35");
    const bg = hex3("#0a0d11");
    const palF = new Float32Array(pal.flat());

    let gl: WebGL2RenderingContext | null = null;
    let prog: WebGLProgram | null = null;
    let tex: WebGLTexture | null = null;
    let U: Record<string, WebGLUniformLocation | null> = {};
    let c2: CanvasRenderingContext2D | null = null;
    if (glOk) {
      try {
        gl = cv.getContext("webgl2", { antialias: false, alpha: false });
        if (!gl) throw new Error("no webgl2");
        prog = compile(gl);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, grid.cols, grid.rows, 0, gl.RED, gl.UNSIGNED_BYTE, grid.cov);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        U = Object.fromEntries(UNIFORMS.map((n) => [n, gl!.getUniformLocation(prog!, n)]));
      } catch {
        setGlOk(false);
        return;
      }
    } else {
      c2 = cv.getContext("2d");
      if (!c2) return;
    }

    const ptsF = new Float32Array(MAXP * 4);
    const toScreen = (lon: number, lat: number) => {
      const z = base * st.cam.z.x;
      // snap to the cell the place sits in, so it lines up with the pixels
      const i = Math.floor((wrapPi(lon) + Math.PI) / grid.pitch);
      const j = Math.floor((millerY(lat) - Y0) / grid.pitch);
      const x = -Math.PI + (i + 0.5) * grid.pitch;
      const y = Y0 + (j + 0.5) * grid.pitch;
      const dx = wrapPi(x - st.cam.x.x);
      return { x: W / 2 + dx * z, y: H / 2 - (y - st.cam.y.x) * z };
    };
    const heatAt = (u: [number, number, number]) => {
      let h = 0;
      const s2 = 2 * SIGMA * SIGMA;
      points.forEach((p) => {
        const wgt = st.weights.get(p.id)?.x ?? 0;
        if (wgt <= 0.001) return;
        const q = unit(p.lat * D2R, p.lon * D2R);
        const ch = 2 - 2 * (u[0] * q[0] + u[1] * q[1] + u[2] * q[2]);
        h += wgt * (0.45 + 0.55 * ((p.activity ?? maxAct * 0.5) / maxAct)) * Math.exp(-ch / s2);
      });
      return 1 - Math.exp(-h * 1.15);
    };

    const sim = (dt: number) => {
      st.t += dt;
      if (st.intro < 9) st.intro += dt;
      // the camera: dragged directly, flung with inertia, or gliding to its target
      if (!st.drag && (Math.abs(st.fling.vx) > 1e-4 || Math.abs(st.fling.vy) > 1e-4)) {
        st.cam.x.x += st.fling.vx * dt;
        st.cam.y.x += st.fling.vy * dt;
        st.target.x = st.cam.x.x;
        st.target.y = st.cam.y.x;
        const k = Math.exp(-dt * 3.2);
        st.fling.vx *= k;
        st.fling.vy *= k;
      }
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let k = 0; k < n; k++) {
        if (!st.drag) {
          step(st.cam.x, st.cam.x.x + wrapPi(st.target.x - st.cam.x.x), 1.1, 1, h);
          step(st.cam.y, st.target.y, 1.1, 1, h);
        }
        step(st.cam.z, st.target.z, 1.0, 1, h);
        step(st.ptrOn, st.ptr.on, 3, 1, h);
        points.forEach((p) => {
          let w = st.weights.get(p.id);
          if (!w) {
            w = spr(0);
            st.weights.set(p.id, w);
          }
          const f = live.current.filter;
          step(w, f === "all" || p.type === f ? 1 : 0, 1.4, 1, h);
        });
      }
      if (reduced) {
        st.cam.z.x = st.target.z;
        points.forEach((p) => {
          const w = st.weights.get(p.id)!;
          const f = live.current.filter;
          w.x = f === "all" || p.type === f ? 1 : 0;
        });
      }
      // keep the map in frame vertically; it wraps freely east and west
      const z = base * st.cam.z.x;
      const halfY = H / 2 / z;
      const lo = Y0 + halfY;
      const hi = Y1 - halfY;
      const cy = lo > hi ? (Y0 + Y1) / 2 : clamp(st.cam.y.x, lo, hi);
      if (cy !== st.cam.y.x) {
        st.cam.y.x = cy;
        st.cam.y.v = 0;
        st.target.y = clamp(st.target.y, Math.min(lo, hi), Math.max(lo, hi));
      }
      st.cam.x.x = wrapPi(st.cam.x.x);
      st.ping = Math.min(1, st.ping + dt / 2.4);
      if (st.ping >= 1) st.ping = 0;
      // the tour: every few seconds, the next place, until someone takes over
      // when the selection is somewhere you cannot see it well, the camera glides over to it
      if (selRef.current !== st.followed) {
        st.followed = selRef.current;
        const fp = st.followed ? points.find((p) => p.id === st.followed) : null;
        if (fp) {
          const zt = base * st.target.z;
          const fx = st.target.x + wrapPi(fp.lon * D2R - st.target.x);
          const fy = millerY(clamp(fp.lat, -56, 82) * D2R);
          const sx = W / 2 + (fx - st.target.x) * zt;
          const sy = H / 2 - (fy - st.target.y) * zt;
          const mx = Math.min(W * 0.07, 56);
          const my = Math.min(H * 0.08, 44);
          const narrowView = W < 560;
          if (narrowView || sx < mx || sx > W - mx || sy < my || sy > H - my) {
            // on a narrow screen the place goes to the upper middle, with its card under it
            st.target.x = fx + (narrowView ? 0 : 90 / zt);
            st.target.y = fy - (narrowView ? (H * 0.22) / zt : 0);
            st.fling = { vx: 0, vy: 0 };
          }
        }
      }
      const vis = live.current.visible;
      if (tour && !reduced && st.t > st.tourAt && st.t - st.lastTouch > 9 && st.ptr.on === 0 && vis.length) {
        st.tourAt = st.t + tourEvery;
        const cur = vis.findIndex((p) => p.id === selRef.current);
        select(vis[(cur + 1) % vis.length].id);
      }
    };

    const place = () => {
      // markers, the card and the crosshair follow the map
      for (const p of points) {
        const b = el.marks.current.get(p.id);
        if (!b) continue;
        const s = toScreen(p.lon * D2R, p.lat * D2R);
        const w = st.weights.get(p.id)?.x ?? 0;
        b.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-50%) scale(${(0.6 + 0.4 * clamp(w)).toFixed(3)})`;
        b.style.opacity = clamp(w * 1.4 * clamp((st.intro - 1.4) / 0.6)).toFixed(3);
        b.style.visibility = s.x < -30 || s.x > W + 30 || s.y < -30 || s.y > H + 30 || w < 0.02 ? "hidden" : "visible";
      }
      const sp = selRef.current ? points.find((p) => p.id === selRef.current) : null;
      if (sp) {
        const s = toScreen(sp.lon * D2R, sp.lat * D2R);
        if (el.crossH.current) el.crossH.current.style.transform = `translateY(${s.y.toFixed(1)}px)`;
        if (el.crossV.current) el.crossV.current.style.transform = `translateX(${s.x.toFixed(1)}px)`;
        const card = el.card.current;
        if (card) {
          const cw = card.offsetWidth || 260;
          const ch = card.offsetHeight || 120;
          let x: number;
          let y: number;
          if (s.x + 24 + cw <= W - 12) {
            x = s.x + 24;
            y = clamp(s.y - ch / 2, 12, H - ch - 12);
          } else if (s.x - 24 - cw >= 12) {
            x = s.x - 24 - cw;
            y = clamp(s.y - ch / 2, 12, H - ch - 12);
          } else {
            // no room beside it: below the place, or above it if that is where the room is
            x = clamp(s.x - cw / 2, 12, Math.max(12, W - cw - 12));
            y = s.y + 24 + ch <= H - 12 || s.y < H / 2 ? s.y + 24 : s.y - 24 - ch;
          }
          card.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
        }
      }
      // the readout: where the pointer is, or where the selected place is
      const r = el.readout.current;
      if (r) {
        let lat: number;
        let lon: number;
        if (st.ptr.on) {
          const zz = base * st.cam.z.x;
          lon = wrapPi(st.cam.x.x + (st.ptr.x - W / 2) / zz);
          lat = millerLat(clamp(st.cam.y.x - (st.ptr.y - H / 2) / zz, Y0, Y1));
        } else if (sp) {
          lat = sp.lat * D2R;
          lon = sp.lon * D2R;
        } else {
          lon = st.cam.x.x;
          lat = millerLat(st.cam.y.x);
        }
        const i = Math.floor((lon + Math.PI) / grid.pitch) % grid.cols;
        const j = Math.floor((millerY(lat) - Y0) / grid.pitch);
        const onLand = j >= 0 && j < grid.rows && grid.cov[j * grid.cols + i] > 128;
        const what = !st.ptr.on && sp ? label(sp.type).toUpperCase() : onLand ? "LAND" : "SEA";
        const txt = `${fmtLat(lat / D2R)}  ${fmtLon(lon / D2R)}  ·  ${what}`;
        if (r.textContent !== txt) r.textContent = txt;
      }
    };

    const drawGL = () => {
      const g = gl!;
      g.viewport(0, 0, cv.width, cv.height);
      g.useProgram(prog);
      g.uniform2f(U.uRes, cv.width, cv.height);
      g.uniform1f(U.uDpr, dpr);
      g.uniform3f(U.uCam, st.cam.x.x, st.cam.y.x, base * st.cam.z.x);
      g.uniform1f(U.uPitch, grid.pitch);
      g.uniform2i(U.uGrid, grid.cols, grid.rows);
      g.uniform1f(U.uY0, Y0);
      g.activeTexture(g.TEXTURE0);
      g.bindTexture(g.TEXTURE_2D, tex);
      g.uniform1i(U.uCov, 0);
      ptsF.fill(0);
      const n = Math.min(MAXP, points.length);
      for (let k = 0; k < n; k++) {
        const p = points[k];
        const u = unit(p.lat * D2R, p.lon * D2R);
        const w = (st.weights.get(p.id)?.x ?? 0) * (0.45 + 0.55 * ((p.activity ?? maxAct * 0.5) / maxAct));
        ptsF.set([u[0], u[1], u[2], Math.max(0, w)], k * 4);
      }
      g.uniform4fv(U.uPts, ptsF);
      g.uniform1i(U.uN, n);
      g.uniform1f(U.uSigma, SIGMA);
      g.uniform1f(U.uT, st.t);
      g.uniform1f(U.uIntro, st.intro);
      g.uniform1f(U.uMotion, reduced ? 0 : 1);
      g.uniform2f(U.uPtr, st.ptr.x, st.ptr.y);
      g.uniform1f(U.uPtrOn, st.ptrOn.x);
      const sp = selRef.current ? points.find((p) => p.id === selRef.current) : null;
      if (sp) {
        const u = unit(sp.lat * D2R, sp.lon * D2R);
        g.uniform4f(U.uSel, u[0], u[1], u[2], 1);
      } else g.uniform4f(U.uSel, 0, 0, 0, 0);
      g.uniform1f(U.uPing, st.ping);
      g.uniform3fv(U.uPal, palF);
      g.uniform3f(U.uCold, cold[0], cold[1], cold[2]);
      g.uniform3f(U.uSea, sea[0], sea[1], sea[2]);
      g.uniform3f(U.uBg, bg[0], bg[1], bg[2]);
      g.drawArrays(g.TRIANGLES, 0, 3);
    };

    /** the plain version: the same grid with flat squares, drawn with the 2D canvas */
    const draw2D = () => {
      const c = c2!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = css(bg);
      c.fillRect(0, 0, W, H);
      const z = base * st.cam.z.x;
      const cell = grid.pitch * z;
      const left = st.cam.x.x - W / 2 / z;
      const top = st.cam.y.x + H / 2 / z;
      const i0 = Math.floor(left / grid.pitch + grid.cols / 2) - 1;
      const i1 = i0 + Math.ceil(W / cell) + 2;
      const j1 = Math.min(grid.rows - 1, Math.floor((top - Y0) / grid.pitch) + 1);
      const j0 = Math.max(0, Math.floor((top - H / z - Y0) / grid.pitch) - 1);
      for (let j = j0; j <= j1; j++) {
        const yc = Y0 + (j + 0.5) * grid.pitch;
        const sy = H / 2 - (yc - st.cam.y.x) * z;
        for (let i = i0; i <= i1; i++) {
          const ii = ((i % grid.cols) + grid.cols) % grid.cols;
          const xc = (i + 0.5 - grid.cols / 2) * grid.pitch;
          const sx = W / 2 + (xc - st.cam.x.x) * z;
          const cov = grid.cov[j * grid.cols + ii] / 255;
          const land = cov > 0.42;
          const hh = heatAt(unit(millerLat(yc), xc));
          const s = (land ? 0.74 : 0.16) * cell;
          c.fillStyle = land ? (hh < 0.06 ? css(cold) : css(rampAt(pal, hh))) : css(hh > 0.1 ? rampAt(pal, hh * 0.6) : sea, land ? 1 : 0.8);
          c.fillRect(sx - s / 2, sy - s / 2, s, s);
        }
      }
    };

    let raf = 0;
    let last = 0;
    let idle = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      sim(dt);
      if (gl) drawGL();
      else {
        // the plain version only redraws while something moves
        let fading = false;
        st.weights.forEach((w) => {
          if (Math.abs(w.v) > 1e-3) fading = true;
        });
        const moving = fading || Math.abs(st.cam.x.v) + Math.abs(st.cam.y.v) + Math.abs(st.cam.z.v) > 1e-4 || !!st.drag || Math.abs(st.fling.vx) > 1e-4;
        idle = moving ? 0 : idle + 1;
        if (idle < 3) draw2D();
      }
      place();
      raf = requestAnimationFrame(frame);
    };
    sim(0.016);
    if (gl) drawGL();
    else draw2D();
    place();
    if (inView) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      if (gl) {
        gl.deleteTexture(tex);
        gl.deleteProgram(prog);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h, glOk, inView, reduced, grid, pal, points, tour, tourEvery, maxAct, select]);


  // ── input ──
  const local = (e: { clientX: number; clientY: number }) => {
    const b = host.current!.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };
  const touch = () => {
    S.current.lastTouch = S.current.t;
  };
  const onMove = (e: RPointerEvent) => {
    const st = S.current;
    const p = local(e);
    st.ptr = { x: p.x, y: p.y, on: e.pointerType === "mouse" || e.pointerType === "pen" ? 1 : st.ptr.on };
    const d = st.drag;
    if (d) {
      const z = (box.w / (220 * D2R)) * st.cam.z.x;
      const dx = p.x - d.x;
      const dy = p.y - d.y;
      if (Math.hypot(dx, dy) > 4) d.moved = true;
      if (!d.moved) return;
      const nx = d.cx - dx / z;
      const ny = d.cy + dy / z;
      const tnow = performance.now();
      const dtm = Math.max(1, tnow - d.lt) / 1000;
      d.vx = 0.7 * d.vx + 0.3 * ((nx - st.cam.x.x) / dtm);
      d.vy = 0.7 * d.vy + 0.3 * ((ny - st.cam.y.x) / dtm);
      d.lt = tnow;
      st.cam.x.x = nx;
      st.cam.y.x = ny;
      st.cam.x.v = st.cam.y.v = 0;
      st.target.x = nx;
      st.target.y = ny;
    }
  };
  const onDown = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    touch();
    const st = S.current;
    const p = local(e);
    st.fling = { vx: 0, vy: 0 };
    st.drag = { x: p.x, y: p.y, cx: st.cam.x.x, cy: st.cam.y.x, moved: false, vx: 0, vy: 0, lt: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onUp = (e: RPointerEvent) => {
    const st = S.current;
    const d = st.drag;
    if (!d) return;
    st.drag = null;
    if (d.moved) {
      if (!reduced) st.fling = { vx: clamp(d.vx, -6, 6), vy: clamp(d.vy, -6, 6) };
    } else if (!(e.target as HTMLElement).closest("button")) select(null);
  };
  const zoomBy = (k: number, at?: { x: number; y: number }) => {
    touch();
    const st = S.current;
    const z0 = st.target.z;
    const z1 = clamp(z0 * k, minZoom(), 4.5);
    if (at && box.w) {
      // keep the point under the pointer where it is
      const base = box.w / (220 * D2R);
      const wx = st.cam.x.x + (at.x - box.w / 2) / (base * st.cam.z.x);
      const wy = st.cam.y.x - (at.y - box.h / 2) / (base * st.cam.z.x);
      st.target.x = wx - (at.x - box.w / 2) / (base * z1);
      st.target.y = wy + (at.y - box.h / 2) / (base * z1);
    }
    st.target.z = z1;
    if (reduced) {
      st.cam.z.x = z1;
      st.cam.x.x = st.target.x;
      st.cam.y.x = st.target.y;
    }
  };
  // pinch on a trackpad, or Ctrl or Cmd with the wheel, zooms; a plain wheel scrolls the page as usual
  useEffect(() => {
    const n = host.current;
    if (!n) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const b = n.getBoundingClientRect();
      zoomBy(Math.exp(-e.deltaY * 0.01), { x: e.clientX - b.left, y: e.clientY - b.top });
    };
    n.addEventListener("wheel", onWheel, { passive: false });
    return () => n.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h, reduced]);
  const onKey = (e: RKeyboardEvent) => {
    const st = S.current;
    const z = (box.w / (220 * D2R)) * st.target.z;
    const stepPx = 80 / z;
    if (e.key === "Escape") select(null);
    else if (e.key === "+" || e.key === "=") zoomBy(1.4);
    else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.4);
    else if (e.key === "ArrowLeft") st.target.x -= stepPx;
    else if (e.key === "ArrowRight") st.target.x += stepPx;
    else if (e.key === "ArrowUp") st.target.y += stepPx;
    else if (e.key === "ArrowDown") st.target.y -= stepPx;
    else return;
    e.preventDefault();
    touch();
  };

  const fill = height === "fill";
  const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';
  const actColor = (a: number) => css(rampAt(pal, a));

  return (
    <div
      ref={host}
      role="region"
      aria-roledescription="map"
      aria-label="Map of our places. Drag to pan, arrow keys to move, plus and minus to zoom."
      tabIndex={0}
      onKeyDown={onKey}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => {
        S.current.ptr.on = 0;
      }}
      className={`${fill ? "absolute inset-0" : "relative w-full"} select-none overflow-hidden bg-[#0a0d11] text-[#e9ecf1] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50 ${className}`}
      style={{ height: fill ? undefined : height, touchAction: "pan-y", cursor: "grab", WebkitTapHighlightColor: "transparent" }}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />

      {/* the crosshair through the selected place */}
      <div aria-hidden className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={{ opacity: sel ? 1 : 0 }}>
        <div ref={el.crossH} className="absolute left-0 right-0 top-0 h-px" style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.22) 50%, transparent 50%)", backgroundSize: "6px 1px" }} />
        <div ref={el.crossV} className="absolute bottom-0 left-0 top-0 w-px" style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.22) 50%, transparent 50%)", backgroundSize: "1px 6px" }} />
      </div>

      {/* the places */}
      {points.map((p) => {
        const on = p.id === selId;
        const hov = p.id === hoverId;
        return (
          <button
            key={p.id}
            ref={(n) => {
              if (n) el.marks.current.set(p.id, n);
              else el.marks.current.delete(p.id);
            }}
            type="button"
            aria-label={`${p.name}, ${label(p.type)}`}
            aria-pressed={on}
            onClick={(e) => {
              e.stopPropagation();
              touch();
              select(on ? null : p.id);
            }}
            onFocus={(e) => {
              // keyboard focus selects; a click selects through onClick
              if (!e.currentTarget.matches(":focus-visible")) return;
              touch();
              select(p.id);
            }}
            onPointerEnter={() => setHoverId(p.id)}
            onPointerLeave={() => setHoverId((h) => (h === p.id ? null : h))}
            className="absolute left-0 top-0 grid h-7 w-7 cursor-pointer place-items-center outline-none focus-visible:[&>span:first-child]:ring-2 focus-visible:[&>span:first-child]:ring-white"
            style={{ visibility: "hidden" }}
          >
            <span className="relative grid h-[15px] w-[15px] place-items-center bg-[#0a0d11] shadow-[0_0_0_1.5px_#fff,0_0_0_5px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.5)] transition-colors duration-200" style={{ background: on ? "#ff6a3d" : "#0a0d11" }}>
              <Glyph type={p.type} size={7} color={on ? "#0a0d11" : "#ffffff"} />
            </span>
            <AnimatePresence>
              {on && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  initial={reduced ? false : { scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                >
                  {[0, 1, 2, 3].map((k) => (
                    <span
                      key={k}
                      className="absolute h-[7px] w-[7px] border-[#ff8a5c]"
                      style={{
                        left: k % 2 ? undefined : -3,
                        right: k % 2 ? -3 : undefined,
                        top: k < 2 ? -3 : undefined,
                        bottom: k < 2 ? undefined : -3,
                        borderTopWidth: k < 2 ? 1.5 : 0,
                        borderBottomWidth: k < 2 ? 0 : 1.5,
                        borderLeftWidth: k % 2 ? 0 : 1.5,
                        borderRightWidth: k % 2 ? 1.5 : 0,
                      }}
                    />
                  ))}
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {hov && !on && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.16 }}
                  className="pointer-events-none absolute left-[30px] top-1/2 -mt-[10px] whitespace-nowrap rounded-[5px] bg-[#0a0d11]/90 px-1.5 py-[3px] text-[10px] font-medium uppercase tracking-[0.08em] text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                  style={{ fontFamily: MONO }}
                >
                  {p.name}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}

      {/* the card for the selected place */}
      <div ref={el.card} className="pointer-events-none absolute left-0 top-0 z-10 w-[264px] max-w-[calc(100%-24px)]">
        <AnimatePresence mode="popLayout">
          {sel && (
            <motion.div
              key={sel.id}
              role="dialog"
              aria-label={sel.name}
              initial={reduced ? false : { opacity: 0, y: 6, scale: 0.97, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="pointer-events-auto rounded-[14px] p-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.09),0_18px_40px_-12px_rgba(0,0,0,0.7)]"
              style={{ background: "rgba(16,19,25,0.82)", backdropFilter: "blur(14px) saturate(1.3)", WebkitBackdropFilter: "blur(14px) saturate(1.3)" }}
            >
              <div className="flex items-center gap-2 text-[10.5px] text-white/55" style={{ fontFamily: MONO }}>
                <Glyph type={sel.type} size={7} color="rgba(255,255,255,0.7)" />
                <span className="uppercase tracking-[0.08em]">{label(sel.type)}</span>
                <span className="ml-auto tabular-nums">
                  {fmtLat(sel.lat)} {fmtLon(sel.lon)}
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={(e) => {
                    e.stopPropagation();
                    touch();
                    select(null);
                  }}
                  className="-mr-1 grid h-5 w-5 place-items-center rounded-[5px] text-white/60 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p className="m-0 mt-2 text-[19px] font-semibold leading-tight tracking-[-0.02em] text-white">{sel.name}</p>
              {sel.description && <p className="m-0 mt-1 text-[13px] leading-[1.45] text-white/62">{sel.description}</p>}
              {sel.activity != null && (
                <div className="mt-3 flex items-center gap-2.5 text-[11px]" style={{ fontFamily: MONO }}>
                  <span className="text-white/50">Activity</span>
                  <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full"
                      initial={reduced ? false : { width: 0 }}
                      animate={{ width: `${(sel.activity / maxAct) * 100}%` }}
                      transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.08 }}
                      style={{ background: `linear-gradient(90deg, ${actColor(0.15)}, ${actColor(0.55)}, ${actColor(0.75 + 0.25 * (sel.activity / maxAct))})` }}
                    />
                  </span>
                  <span className="tabular-nums text-white/90">{fmtK(sel.activity)}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the readout */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[11px] tabular-nums text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" style={{ fontFamily: MONO, background: "rgba(12,15,20,0.78)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <span aria-hidden className="h-[6px] w-[6px] bg-[#ff6a3d]" />
        <span ref={el.readout} aria-hidden>
          0.00°N 0.00°E · SEA
        </span>
        <span aria-hidden className="text-white/35">·</span>
        <span>
          {String(visible.length).padStart(2, "0")} {visible.length === 1 ? "PLACE" : "PLACES"}
        </span>
      </div>

      {/* filters and legend */}
      <div
        className="absolute bottom-3 left-3 rounded-[12px] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{ background: "rgba(12,15,20,0.8)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div role="radiogroup" aria-label="Show" className="relative flex gap-1">
          {["all", ...types].map((t) => {
            const on = filter === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  touch();
                  setFilter(t);
                }}
                className={`relative flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[11.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 ${on ? "text-white" : "text-white/55 hover:text-white/85"}`}
                style={{ fontFamily: MONO }}
              >
                {on && <motion.span layoutId="pixel-atlas-filter" className="absolute inset-0 rounded-[7px] bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                {t !== "all" && (
                  <span className="relative">
                    <Glyph type={t} size={7} />
                  </span>
                )}
                <span className="relative">{t === "all" ? "All" : label(t)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 px-1 pb-0.5">
          <div className="h-[4px] rounded-full" style={{ background: `linear-gradient(90deg, ${pal.map((c, i) => `${css(c)} ${(i / (pal.length - 1)) * 100}%`).join(", ")})` }} />
          <div className="mt-1 flex justify-between text-[10px] text-white/45" style={{ fontFamily: MONO }}>
            <span>Low</span>
            <span>Activity</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* zoom */}
      <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-[10px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" style={{ background: "rgba(12,15,20,0.8)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }} onPointerDown={(e) => e.stopPropagation()}>
        {[
          { k: "in", d: "M5 1v8M1 5h8", f: () => zoomBy(1.45) },
          { k: "out", d: "M1 5h8", f: () => zoomBy(1 / 1.45) },
          { k: "fit", d: "M1 3.5V1h2.5M6.5 1H9v2.5M9 6.5V9H6.5M3.5 9H1V6.5", f: () => (touch(), fit(visible)) },
        ].map((b, i) => (
          <button
            key={b.k}
            type="button"
            aria-label={b.k === "in" ? "Zoom in" : b.k === "out" ? "Zoom out" : "Fit to places"}
            onClick={b.f}
            className={`grid h-8 w-8 place-items-center text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:bg-white/10 ${i ? "border-t border-white/[0.07]" : ""}`}
          >
            <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden>
              <path d={b.d} stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </button>
        ))}
      </div>

      <span className="sr-only" aria-live="polite">
        {sel ? `${sel.name}, ${label(sel.type)}. ${sel.description ?? ""}` : ""}
      </span>
    </div>
  );
}

export default PixelAtlas;
