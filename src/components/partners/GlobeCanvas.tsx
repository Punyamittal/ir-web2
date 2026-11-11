"use client";

import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection, GeometryObject } from "topojson-specification";
import countriesTopo from "world-atlas/countries-110m.json";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import {
  onThemeChange,
  readTokenRgb,
  rgba,
} from "@/lib/surface-tokens";
import EarthLoader from "@/components/ui/EarthLoader";

import {
  campusBBox,
  getDetailedCountryFeature,
  sampleDetailedDots,
} from "./detail-maps";
import { getLandDots, type LonLat } from "./land-dots";
import {
  easeInOutCubic,
  makeProjections,
  projectLonLat,
  type ProjectionState,
} from "./projection-morph";
import { ISO2_TO_NUMERIC } from "./types";

type GlobeCanvasProps = {
  width: number;
  height: number;
  rotate: [number, number, number];
  morph: number;
  countryCode: string | null;
  /** Primitive focus — avoid passing a new `{lng,lat}` object each render. */
  focusLng?: number | null;
  focusLat?: number | null;
  autoRotate: boolean;
  paused: boolean;
  reduceMotion: boolean;
  inView: boolean;
  projectRef: MutableRefObject<
    | ((
        lon: number,
        lat: number,
      ) => { x: number; y: number; visible: boolean; depth: number } | null)
    | null
  >;
  onFrame?: () => void;
  onRotate?: (rotate: [number, number, number]) => void;
};

function getCountryFeature110(countryCode: string): GeoJSON.Feature | null {
  const id = ISO2_TO_NUMERIC[countryCode];
  if (!id) return null;
  const topo = countriesTopo as unknown as Topology<{
    countries: GeometryCollection;
  }>;
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

function pointFeature(lng: number, lat: number, pad = 2.6): GeoJSON.Feature {
  const [minLon, minLat, maxLon, maxLat] = campusBBox(lng, lat, pad);
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    },
  };
}

/**
 * World: denser 110m land dots. Country/university: 10m coastline
 * (single-country extract) + multi-pass country-only dots.
 *
 * Paint loop stays alive across detail loads — only size / visibility
 * remounts the RAF so the globe doesn’t constantly “reload”.
 */
export default function GlobeCanvas({
  width,
  height,
  rotate,
  morph,
  countryCode,
  focusLng = null,
  focusLat = null,
  autoRotate,
  paused,
  reduceMotion,
  inView,
  projectRef,
  onFrame,
  onRotate,
}: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotateRef = useRef(rotate);
  const morphRef = useRef(morph);
  const autoRef = useRef({ autoRotate, paused });
  const onRotateRef = useRef(onRotate);
  const onFrameRef = useRef(onFrame);
  const inViewRef = useRef(inView);
  const reduceMotionRef = useRef(reduceMotion);
  const sizeRef = useRef({ width, height });
  const countryCodeRef = useRef(countryCode);
  const focusRef = useRef<{ lng: number; lat: number } | null>(
    focusLng != null && focusLat != null ? { lng: focusLng, lat: focusLat } : null,
  );
  const coarseFeatRef = useRef<GeoJSON.Feature | null>(null);
  const detailRef = useRef<{
    feature: GeoJSON.Feature | null;
    focus: GeoJSON.Feature | null;
    dots: LonLat[] | null;
    countryCode: string | null;
  }>({ feature: null, focus: null, dots: null, countryCode: null });

  // Result of the last finished detail load. Loading state is *derived* from it (instead
  // of being set synchronously inside the load effect, which caused extra render passes).
  const [detailDone, setDetailDone] = useState<{
    key: string;
    countryCode: string;
    hasDots: boolean;
  } | null>(null);
  const detailKey = `${countryCode}|${focusLng}|${focusLat}`;

  const coarseFeat = useMemo(
    () => (countryCode ? getCountryFeature110(countryCode) : null),
    [countryCode],
  );

  // ——— Sync props → refs (no paint remount) ———
  useEffect(() => {
    const spinning = autoRotate && !paused;
    if (!spinning) rotateRef.current = rotate;
  }, [rotate, autoRotate, paused]);
  useEffect(() => {
    morphRef.current = morph;
  }, [morph]);
  useEffect(() => {
    autoRef.current = { autoRotate, paused };
  }, [autoRotate, paused]);
  useEffect(() => {
    onRotateRef.current = onRotate;
  }, [onRotate]);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);
  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);
  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);
  useEffect(() => {
    sizeRef.current = { width, height };
  }, [width, height]);
  useEffect(() => {
    countryCodeRef.current = countryCode;
    coarseFeatRef.current = coarseFeat;
  }, [countryCode, coarseFeat]);
  useEffect(() => {
    focusRef.current =
      focusLng != null && focusLat != null
        ? { lng: focusLng, lat: focusLat }
        : null;
  }, [focusLng, focusLat]);

  // ——— Detail load: only when country / focus primitives change ———
  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    if (!countryCode) {
      detailRef.current = {
        feature: null,
        focus: null,
        dots: null,
        countryCode: null,
      };
      return;
    }
    const key = `${countryCode}|${focusLng}|${focusLat}`;

    const focus =
      focusLng != null && focusLat != null
        ? { lng: focusLng, lat: focusLat }
        : null;
    const sameCountry = detailRef.current.countryCode === countryCode;
    const keepDots = sameCountry ? detailRef.current.dots : null;

    // Instant coarse outline; keep existing dots if still same country
    detailRef.current = {
      feature: coarseFeat ?? detailRef.current.feature,
      focus: focus ? pointFeature(focus.lng, focus.lat, 2.4) : null,
      dots: keepDots,
      countryCode,
    };

    const run = async () => {
      try {
        const feat =
          (await getDetailedCountryFeature(countryCode)) ?? coarseFeat;
        if (cancelled || !feat) return;

        const dots = await sampleDetailedDots(feat, focus);
        if (cancelled) return;

        detailRef.current = {
          feature: feat,
          focus: focus ? pointFeature(focus.lng, focus.lat, 2.2) : null,
          dots,
          countryCode,
        };
      } catch {
        /* keep coarse / previous dots */
      } finally {
        if (!cancelled)
          setDetailDone({
            key,
            countryCode,
            hasDots: !!detailRef.current.dots?.length,
          });
      }
    };

    // Debounce campus re-sample when hopping colleges in the same country
    if (sameCountry && keepDots?.length) {
      debounceTimer = setTimeout(() => {
        void run();
      }, 280);
    } else {
      void run();
    }

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [countryCode, focusLng, focusLat, coarseFeat]);

  // ——— Persistent paint loop (size only) ———
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width < 2 || height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const worldDots = getLandDots(1.15);
    let raf = 0;
    let disposed = false;
    let rot: [number, number, number] = [...rotateRef.current];
    let ink = readTokenRgb("--illustration", canvas);
    let frame = 0;

    const refresh = () => {
      ink = readTokenRgb("--illustration", canvas);
    };
    const unsubTheme = onThemeChange(refresh);

    const paint = () => {
      const { width: w, height: h } = sizeRef.current;
      const m = morphRef.current;
      const detail = detailRef.current;
      const focus = focusRef.current;
      const countryFeature = detail.feature ?? coarseFeatRef.current;

      const state: ProjectionState = {
        mode: m > 0.5 ? "country" : "globe",
        morph: m,
        rotate: rot,
        countryFeature,
        focusFeature: detail.focus,
      };
      const { ortho, merc } = makeProjections(w, h, state);
      const flat = m > 0.55 ? merc : ortho;

      projectRef.current = (lon, lat) =>
        projectLonLat(lon, lat, ortho, merc, m);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (m < 0.85) {
        const r = Math.min(w, h) * 0.42;
        const alpha = 1 - easeInOutCubic(m);
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(ink, 0.25 * alpha);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (m > 0.6) {
        const gA = easeInOutCubic(Math.min(1, (m - 0.6) / 0.35)) * 0.16;
        ctx.strokeStyle = rgba(ink, gA);
        ctx.lineWidth = 0.6;
        for (let lat = -60; lat <= 75; lat += 15) {
          ctx.beginPath();
          for (let lon = -180; lon <= 180; lon += 4) {
            const p = flat([lon, lat]);
            if (!p) continue;
            if (lon === -180) ctx.moveTo(p[0], p[1]);
            else ctx.lineTo(p[0], p[1]);
          }
          ctx.stroke();
        }
        for (let lon = -180; lon <= 180; lon += 30) {
          ctx.beginPath();
          for (let lat = -60; lat <= 75; lat += 4) {
            const p = flat([lon, lat]);
            if (!p) continue;
            if (lat === -60) ctx.moveTo(p[0], p[1]);
            else ctx.lineTo(p[0], p[1]);
          }
          ctx.stroke();
        }
      }

      if (countryFeature && m > 0.4) {
        const pathGen = geoPath(flat, ctx);
        const fillA = easeInOutCubic(Math.min(1, (m - 0.4) / 0.45)) * 0.08;
        ctx.beginPath();
        pathGen(countryFeature);
        ctx.fillStyle = rgba(ink, fillA);
        ctx.fill();
      }

      const useDetailDots = m > 0.45 && detail.dots && detail.dots.length > 0;
      const dots = useDetailDots ? detail.dots! : worldDots;
      const fine = !!focus && m > 0.7;

      for (const [lon, lat] of dots) {
        const p = projectLonLat(lon, lat, ortho, merc, m);
        if (!p?.visible) continue;

        let alpha = 0.18 + p.depth * 0.7;
        if (!useDetailDots && countryFeature && m > 0.55) {
          alpha *= m > 0.85 ? 0.35 : 0.7;
        }

        const size = useDetailDots ? (fine ? 1.05 : 1.15) : m > 0.7 ? 1.3 : 1.15;
        ctx.fillStyle = rgba(ink, Math.min(1, alpha));
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }

      if (countryFeature && m > 0.35) {
        const pathGen = geoPath(flat, ctx);
        const outlineA = easeInOutCubic(Math.min(1, (m - 0.35) / 0.5));
        ctx.beginPath();
        pathGen(countryFeature);
        ctx.strokeStyle = rgba(ink, 0.25 + outlineA * 0.25);
        ctx.lineWidth = focus ? 2.2 : 1.8;
        ctx.stroke();
        ctx.beginPath();
        pathGen(countryFeature);
        ctx.strokeStyle = rgba(ink, 0.45 + outlineA * 0.4);
        ctx.lineWidth = focus ? 1.1 : 0.9;
        ctx.stroke();
      }

      if (focus && m > 0.7) {
        const p = projectLonLat(focus.lng, focus.lat, ortho, merc, m);
        if (p?.visible) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(ink, 0.35);
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(ink, 0.65);
          ctx.lineWidth = 1.3;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      frame += 1;
      // Markers: less often while spinning so parent doesn’t thrash
      const spin = autoRef.current.autoRotate && !autoRef.current.paused;
      if (frame % (spin ? 12 : 6) === 0) onFrameRef.current?.();
    };

    const loop = () => {
      if (disposed) return;
      if (inViewRef.current) {
        const { autoRotate: ar, paused: p } = autoRef.current;
        if (ar && !p && morphRef.current < 0.05 && !reduceMotionRef.current) {
          rot = [rot[0] - 0.4, rot[1], rot[2]];
          rotateRef.current = rot;
          onRotateRef.current?.(rot);
        } else {
          rot = [...rotateRef.current];
        }
        paint();
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      unsubTheme();
    };
    // Intentionally size-only — detail / focus / morph live in refs
  }, [width, height, projectRef]);

  // Loader only while a country's detail is loading and there is nothing detailed to draw yet
  // (hopping between colleges of the same country keeps the previous dots on screen).
  const loadingDetail = !!countryCode && detailDone?.key !== detailKey;
  const hasDetailDots =
    !!detailDone && detailDone.countryCode === countryCode && detailDone.hasDots;
  const showLoader = loadingDetail && !hasDetailDots;

  return (
    <>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
      {showLoader ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
          <EarthLoader label="Loading detailed map…" size="sm" />
        </div>
      ) : null}
    </>
  );
}

export { getCountryFeature110 as getCountryFeature };
