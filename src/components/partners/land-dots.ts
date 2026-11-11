import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import landTopo from "world-atlas/land-110m.json";

export type LonLat = [number, number];

const cache = new Map<number, LonLat[]>();

/**
 * Sample dotted land points from world-atlas TopoJSON (halftone globe/map).
 * Cached per step size.
 */
export function getLandDots(stepDeg = 1.6): LonLat[] {
  const key = Math.round(stepDeg * 100);
  const hit = cache.get(key);
  if (hit) return hit;

  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land) as unknown as
    | GeoJSON.Feature
    | GeoJSON.FeatureCollection;
  const pts: LonLat[] = [];

  for (let lat = -60; lat <= 75; lat += stepDeg) {
    const cos = Math.cos((lat * Math.PI) / 180);
    const lngStep = stepDeg / Math.max(0.35, cos);
    for (let lng = -180; lng < 180; lng += lngStep) {
      const p: LonLat = [lng, lat];
      if (geoContains(land, p)) pts.push(p);
    }
  }

  cache.set(key, pts);
  return pts;
}
