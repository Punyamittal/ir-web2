import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type {
  GeometryCollection,
  GeometryObject,
  Topology,
} from "topojson-specification";

import type { LonLat } from "./land-dots";
import { ISO2_TO_NUMERIC } from "./types";

type CountriesTopo = Topology<{ countries: GeometryCollection }>;

type TopoCache = {
  topo: CountriesTopo | null;
  loading: Promise<CountriesTopo> | null;
};

const countries50Cache: TopoCache = { topo: null, loading: null };
const countries10Cache: TopoCache = { topo: null, loading: null };
const featureCache = new Map<string, GeoJSON.Feature | null>();
const dotsCache = new Map<string, LonLat[]>();

const CDN_50 =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const CDN_10 =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";

async function loadFromCdn(cdn: string): Promise<CountriesTopo> {
  const res = await fetch(cdn, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${cdn}`);
  return (await res.json()) as CountriesTopo;
}

/** 50m countries (single-country extract only — never expand the world). */
export async function loadCountries50m(): Promise<CountriesTopo> {
  if (countries50Cache.topo) return countries50Cache.topo;
  if (countries50Cache.loading) return countries50Cache.loading;

  countries50Cache.loading = (async () => {
    try {
      const mod = await import("world-atlas/countries-50m.json");
      countries50Cache.topo = (mod.default ?? mod) as unknown as CountriesTopo;
      return countries50Cache.topo;
    } catch {
      countries50Cache.topo = await loadFromCdn(CDN_50);
      return countries50Cache.topo;
    } finally {
      countries50Cache.loading = null;
    }
  })();

  return countries50Cache.loading;
}

/** 10m countries — detailed coastline; still extract one country only. */
export async function loadCountries10m(): Promise<CountriesTopo> {
  if (countries10Cache.topo) return countries10Cache.topo;
  if (countries10Cache.loading) return countries10Cache.loading;

  countries10Cache.loading = (async () => {
    try {
      const mod = await import("world-atlas/countries-10m.json");
      countries10Cache.topo = (mod.default ?? mod) as unknown as CountriesTopo;
      return countries10Cache.topo;
    } catch {
      countries10Cache.topo = await loadFromCdn(CDN_10);
      return countries10Cache.topo;
    } finally {
      countries10Cache.loading = null;
    }
  })();

  return countries10Cache.loading;
}

export function countryFeatureFromTopo(
  topo: CountriesTopo,
  countryCode: string,
): GeoJSON.Feature | null {
  const id = ISO2_TO_NUMERIC[countryCode];
  if (!id) return null;
  const geoms = topo.objects.countries.geometries as GeometryObject[];
  const geom = geoms.find((g) => {
    const fid = String((g as { id?: string | number }).id ?? "");
    return (
      fid === String(Number(id)) || fid.padStart(3, "0") === id.padStart(3, "0")
    );
  });
  if (!geom) return null;
  return feature(topo, geom) as GeoJSON.Feature;
}

export async function getDetailedCountryFeature(
  countryCode: string,
): Promise<GeoJSON.Feature | null> {
  const cacheKey = `10m:${countryCode}`;
  if (featureCache.has(cacheKey)) return featureCache.get(cacheKey)!;

  // Prefer 10m coastline; fall back to 50m if the heavy file fails.
  try {
    const topo10 = await loadCountries10m();
    const feat10 = countryFeatureFromTopo(topo10, countryCode);
    if (feat10) {
      featureCache.set(cacheKey, feat10);
      return feat10;
    }
  } catch {
    /* fall through */
  }

  const topo50 = await loadCountries50m();
  const feat50 = countryFeatureFromTopo(topo50, countryCode);
  featureCache.set(cacheKey, feat50);
  return feat50;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => resolve(), { timeout: 24 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export type SampleDotsOptions = {
  stepDeg?: number;
  maxDots?: number;
  /** Limit sampling to a lon/lat window (campus zoom). */
  clipBBox?: [number, number, number, number];
};

/**
 * Dense country-only dots. Chunked so the tab stays interactive.
 */
export async function sampleCountryDots(
  countryFeature: GeoJSON.Feature,
  opts: SampleDotsOptions = {},
): Promise<LonLat[]> {
  const stepDeg = opts.stepDeg ?? 0.32;
  const maxDots = opts.maxDots ?? 7500;
  const clip = opts.clipBBox;

  const key = `${String(countryFeature.id ?? "c")}:${stepDeg}:${maxDots}:${clip?.map((n) => n.toFixed(2)).join(",") ?? "full"}`;
  const hit = dotsCache.get(key);
  if (hit) return hit;

  let [minLon, minLat, maxLon, maxLat] = featureBBox(countryFeature);
  if (clip) {
    minLon = Math.max(minLon, clip[0]);
    minLat = Math.max(minLat, clip[1]);
    maxLon = Math.min(maxLon, clip[2]);
    maxLat = Math.min(maxLat, clip[3]);
  }

  const pts: LonLat[] = [];
  let ops = 0;

  for (let lat = minLat; lat <= maxLat; lat += stepDeg) {
    const cos = Math.cos((lat * Math.PI) / 180);
    const lngStep = stepDeg / Math.max(0.45, cos);
    for (let lng = minLon; lng <= maxLon; lng += lngStep) {
      const p: LonLat = [lng, lat];
      if (geoContains(countryFeature, p)) {
        pts.push(p);
        if (pts.length >= maxDots) {
          dotsCache.set(key, pts);
          return pts;
        }
      }
      if (++ops % 450 === 0) await yieldToMain();
    }
  }

  dotsCache.set(key, pts);
  return pts;
}

/** Two-pass detail: country fill, then extra-dense campus patch. */
export async function sampleDetailedDots(
  countryFeature: GeoJSON.Feature,
  focus?: { lng: number; lat: number } | null,
): Promise<LonLat[]> {
  const countryDots = await sampleCountryDots(countryFeature, {
    stepDeg: focus ? 0.36 : 0.28,
    maxDots: focus ? 6500 : 9000,
  });

  if (!focus) return countryDots;

  const regional = await sampleCountryDots(countryFeature, {
    stepDeg: 0.16,
    maxDots: 3500,
    clipBBox: campusBBox(focus.lng, focus.lat, 5.5),
  });

  const local = await sampleCountryDots(countryFeature, {
    stepDeg: 0.08,
    maxDots: 3200,
    clipBBox: campusBBox(focus.lng, focus.lat, 2.2),
  });

  // Merge unique-ish points (tighter key near campus)
  const seen = new Set(
    countryDots.map(([a, b]) => `${a.toFixed(3)},${b.toFixed(3)}`),
  );
  const merged = countryDots.slice();
  for (const p of [...regional, ...local]) {
    const k = `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(p);
  }
  return merged;
}

export function featureBBox(
  feat: GeoJSON.Feature,
): [number, number, number, number] {
  const coords: number[][] = [];
  const walk = (c: unknown): void => {
    if (!Array.isArray(c)) return;
    if (typeof c[0] === "number" && typeof c[1] === "number") {
      coords.push(c as number[]);
      return;
    }
    for (const x of c) walk(x);
  };
  if (feat.geometry && "coordinates" in feat.geometry) {
    walk(feat.geometry.coordinates);
  }
  let minLon = 180,
    minLat = 90,
    maxLon = -180,
    maxLat = -90;
  for (const [lon, lat] of coords) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return [minLon, minLat, maxLon, maxLat];
}

export function campusBBox(
  lng: number,
  lat: number,
  padDeg = 2.8,
): [number, number, number, number] {
  return [lng - padDeg, lat - padDeg * 0.75, lng + padDeg, lat + padDeg * 0.75];
}
