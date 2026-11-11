import {
  geoMercator,
  geoOrthographic,
  geoPath,
  type GeoProjection,
} from "d3-geo";

export type ViewMode = "globe" | "country";

export type ProjectionState = {
  mode: ViewMode;
  /** 0 = full globe orthographic, 1 = flat country mercator */
  morph: number;
  rotate: [number, number, number];
  /** Country feature for fitExtent when morphing / flat */
  countryFeature?: GeoJSON.Feature | null;
  /** Optional tighter GeoJSON for campus zoom (Point/Polygon/bbox as Feature) */
  focusFeature?: GeoJSON.Feature | null;
};

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Build the active projection.
 *
 * Morph logic (commented for clarity):
 * - morph=0: classic geoOrthographic with clipAngle 90 (globe).
 * - morph=1: geoMercator fitted to the selected country bounds.
 * - 0<morph<1: we keep BOTH projections and lerp screen coordinates
 *   in `projectLonLat` so land dots and markers slide continuously
 *   as the globe "unrolls" into a flat map (~900ms).
 */
export function makeProjections(
  width: number,
  height: number,
  state: ProjectionState,
): { ortho: GeoProjection; merc: GeoProjection; pathOrtho: ReturnType<typeof geoPath> } {
  const r = Math.min(width, height) * 0.42;

  const ortho = geoOrthographic()
    .scale(r)
    .translate([width / 2, height / 2])
    .rotate(state.rotate)
    .clipAngle(90)
    .precision(0.5);

  let merc = geoMercator()
    .scale(r * 1.2)
    .translate([width / 2, height / 2]);

  const fitTarget = state.focusFeature ?? state.countryFeature;
  if (fitTarget) {
    merc = geoMercator().fitExtent(
      [
        [40, 40],
        [width - 40, height - 40],
      ],
      fitTarget,
    );
  }

  return {
    ortho,
    merc,
    pathOrtho: geoPath(ortho),
  };
}

/** Lerp a lon/lat through ortho→merc during morph. Returns null if behind globe. */
export function projectLonLat(
  lon: number,
  lat: number,
  ortho: GeoProjection,
  merc: GeoProjection,
  morph: number,
): { x: number; y: number; visible: boolean; depth: number } | null {
  const t = easeInOutCubic(Math.min(1, Math.max(0, morph)));
  const a = ortho([lon, lat]);
  const b = merc([lon, lat]);
  if (!b) return null;

  // Depth cue from orthographic: stream a test — use distance from rotate center
  const rot = ortho.rotate();
  const λ = ((((lon + rot[0]) % 360) + 540) % 360) - 180;
  const depth = Math.cos((λ * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180);
  const onFront = depth > -0.05;

  if (t < 0.02) {
    if (!a || !onFront) return null;
    return { x: a[0], y: a[1], visible: true, depth };
  }

  if (t > 0.98) {
    return { x: b[0], y: b[1], visible: true, depth: 1 };
  }

  // During morph: fade in back-side points as we flatten
  if (!a) {
    return {
      x: b[0],
      y: b[1],
      visible: t > 0.45,
      depth: t,
    };
  }

  return {
    x: a[0] * (1 - t) + b[0] * t,
    y: a[1] * (1 - t) + b[1] * t,
    visible: onFront || t > 0.4,
    depth: depth * (1 - t) + t,
  };
}

export { easeInOutCubic };
