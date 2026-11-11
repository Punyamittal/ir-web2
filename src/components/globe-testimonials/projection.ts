/**
 * Projection helpers mirroring cobe v2's internal marker math
 * so HTML pins + the connector line stay locked to the WebGL globe.
 */

export type Vec3 = [number, number, number];

export type ProjectedPoint = {
  /** 0–1 across the canvas */
  x: number;
  /** 0–1 down the canvas */
  y: number;
  visible: boolean;
  /** View-space depth (higher ≈ closer to camera) */
  depth: number;
};

/** Convert lat/lng (degrees) → unit-sphere XYZ (cobe’s `U`) */
export function latLngToXYZ(lat: number, lng: number): Vec3 {
  const latR = (lat * Math.PI) / 180;
  const lngR = (lng * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latR);
  return [-cosLat * Math.cos(lngR), Math.sin(latR), cosLat * Math.sin(lngR)];
}

/**
 * Project a world point through cobe’s phi/theta rotation into
 * normalized canvas coordinates (cobe’s `O`, simplified for scale=1, offset=0).
 */
export function projectPoint(
  point: Vec3,
  phi: number,
  theta: number,
  aspect: number,
  scale = 1,
): ProjectedPoint {
  const cosTheta = Math.cos(theta);
  const cosPhi = Math.cos(phi);
  const sinTheta = Math.sin(theta);
  const sinPhi = Math.sin(phi);

  const [x, y, z] = point;
  const cx = cosPhi * x + sinPhi * z;
  const cy = sinPhi * sinTheta * x + cosTheta * y - cosPhi * sinTheta * z;
  const depth =
    -sinPhi * cosTheta * x + sinTheta * y + cosPhi * cosTheta * z;

  const nx = (cx / aspect) * scale;
  const ny = -cy * scale;

  return {
    x: (nx + 1) / 2,
    y: (ny + 1) / 2,
    // Match cobe: front hemisphere OR silhouette rim
    visible: depth >= 0 || cx * cx + cy * cy >= 0.64,
    depth,
  };
}

/** Marker elevation used by cobe (`ee + markerElevation` ≈ 0.82) */
export const MARKER_RADIUS = 0.82;

export function projectLatLng(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  aspect: number,
): ProjectedPoint {
  const [x, y, z] = latLngToXYZ(lat, lng);
  return projectPoint(
    [x * MARKER_RADIUS, y * MARKER_RADIUS, z * MARKER_RADIUS],
    phi,
    theta,
    aspect,
  );
}

/** Phi that brings a location to the camera-facing front */
export function focusPhi(lat: number, lng: number, leftOffset = 0.38): number {
  const [x, , z] = latLngToXYZ(lat, lng);
  return Math.atan2(-x, z) + leftOffset;
}

/** Shortest signed delta between two angles (radians) */
export function shortestDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
