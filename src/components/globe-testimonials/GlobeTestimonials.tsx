"use client";

import createGlobe from "cobe";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const subscribeNever = () => () => {};

import {
  easeInOutCubic,
  focusPhi,
  projectLatLng,
  shortestDelta,
} from "./projection";
import type { GlobeReview } from "./types";

type GlobeTestimonialsProps = {
  reviews: GlobeReview[];
  intervalMs?: number;
  className?: string;
};

const GLOBE_THETA = 0.22;
const FOCUS_DURATION_MS = 1200;
const DRIFT_SPEED = 0.00065;

function initials(r: GlobeReview) {
  const words = (r.company || r.city).split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return r.city.slice(0, 2).toUpperCase();
}

function resolveCollisions(
  pins: { id: string; x: number; y: number; visible: boolean; depth: number }[],
) {
  const out = pins.map((p) => ({ ...p, ox: 0, oy: 0, cluster: 1 }));
  const minDist = 0.07;
  for (let i = 0; i < out.length; i++) {
    if (!out[i].visible) continue;
    for (let j = i + 1; j < out.length; j++) {
      if (!out[j].visible) continue;
      const dx = out[i].x + out[i].ox - (out[j].x + out[j].ox);
      const dy = out[i].y + out[i].oy - (out[j].y + out[j].oy);
      const d = Math.hypot(dx, dy);
      if (d < minDist && d > 0) {
        const push = (minDist - d) / 2;
        const nx = dx / d;
        const ny = dy / d;
        out[i].ox += nx * push;
        out[i].oy += ny * push;
        out[j].ox -= nx * push;
        out[j].oy -= ny * push;
      } else if (d < 0.02) {
        out[i].cluster += 1;
        out[j].visible = false;
      }
    }
  }
  return out;
}

export default function GlobeTestimonials({
  reviews,
  intervalMs = 5000,
  className = "",
}: GlobeTestimonialsProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const globeWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardAnchorRef = useRef<HTMLDivElement>(null);
  const connectorLineRef = useRef<SVGLineElement>(null);
  const pinElsRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const phiRef = useRef(0);
  const targetPhiRef = useRef(0);
  const animRef = useRef<{
    from: number;
    delta: number;
    start: number;
    active: boolean;
  } | null>(null);
  const sizeRef = useRef(0);
  const activeIndexRef = useRef(0);

  const active = reviews[activeIndex] ?? reviews[0];
  const total = reviews.length;

  const stats = useMemo(() => {
    const countries = new Set(reviews.map((r) => r.countryCode)).size;
    const continents = Math.min(6, Math.max(3, Math.round(countries / 3)));
    return {
      partners: reviews.length,
      countries,
      continents,
    };
  }, [reviews]);

  const goTo = useCallback(
    (index: number, animateGlobe = true) => {
      if (!reviews.length) return;
      const next = ((index % reviews.length) + reviews.length) % reviews.length;
      setActiveIndex(next);
      activeIndexRef.current = next;
      const review = reviews[next];
      const nextPhi = focusPhi(review.lat, review.lng);
      if (!animateGlobe || reduceMotion) {
        phiRef.current = nextPhi;
        targetPhiRef.current = nextPhi;
        animRef.current = null;
        return;
      }
      const from = phiRef.current;
      animRef.current = {
        from,
        delta: shortestDelta(from, nextPhi),
        start: performance.now(),
        active: true,
      };
      targetPhiRef.current = nextPhi;
    },
    [reviews, reduceMotion],
  );

  const goNext = useCallback(() => goTo(activeIndexRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(activeIndexRef.current - 1), [goTo]);

  useEffect(() => {
    if (!reviews[0]) return;
    const phi = focusPhi(reviews[0].lat, reviews[0].lng);
    phiRef.current = phi;
    targetPhiRef.current = phi;
  }, [reviews]);

  useEffect(() => {
    if (reduceMotion || paused || total < 2) return;
    const id = window.setInterval(() => goNext(), intervalMs);
    return () => window.clearInterval(id);
  }, [goNext, intervalMs, paused, reduceMotion, total, activeIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = globeWrapRef.current;
    if (!canvas || !wrap || !reviews.length) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let raf = 0;
    let disposed = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const syncSize = () => {
      const side = Math.min(wrap.clientWidth, wrap.clientHeight);
      sizeRef.current = side;
      return side;
    };

    const side = syncSize();
    globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: side * 2,
      height: side * 2,
      phi: phiRef.current,
      theta: GLOBE_THETA,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 8,
      mapBaseBrightness: 0,
      baseColor: [1, 1, 1],
      markerColor: [0.12, 0.12, 0.14],
      glowColor: [0.96, 0.95, 0.92],
      scale: 1.05,
      opacity: 1,
      markers: reviews.map((r) => ({
        location: [r.lat, r.lng] as [number, number],
        size: 0.015,
        color: [0.12, 0.22, 0.54] as [number, number, number],
        id: r.id,
      })),
      markerElevation: 0.02,
    });

    const tick = (now: number) => {
      if (disposed) return;
      const anim = animRef.current;
      if (anim?.active) {
        const t = Math.min(1, (now - anim.start) / FOCUS_DURATION_MS);
        phiRef.current = anim.from + anim.delta * easeInOutCubic(t);
        if (t >= 1) {
          anim.active = false;
          phiRef.current = targetPhiRef.current;
        }
      } else if (!reduceMotion) {
        phiRef.current += DRIFT_SPEED;
        targetPhiRef.current += DRIFT_SPEED;
      }

      const phi = phiRef.current;
      globe?.update({
        phi,
        theta: GLOBE_THETA,
        width: sizeRef.current * 2,
        height: sizeRef.current * 2,
      });

      const raw = reviews.map((r) => {
        const p = projectLatLng(r.lat, r.lng, phi, GLOBE_THETA, 1);
        return { id: r.id, ...p };
      });
      const pins = resolveCollisions(raw);
      const activeId = reviews[activeIndexRef.current]?.id;
      let activePin: { x: number; y: number; visible: boolean } | null = null;

      for (const p of pins) {
        const el = pinElsRef.current[p.id];
        const r = reviews.find((x) => x.id === p.id);
        if (!el || !r) continue;
        const isActive = p.id === activeId;
        const size = isActive ? 52 : 40;
        const opacity = p.visible
          ? Math.min(1, 0.45 + Math.max(0, p.depth) * 0.7)
          : 0;
        el.style.left = `${(p.x + p.ox) * 100}%`;
        el.style.top = `${(p.y + p.oy) * 100}%`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, -50%)`;
        el.style.pointerEvents = p.visible ? "auto" : "none";
        el.style.zIndex = isActive ? "5" : "2";
        if (isActive) activePin = { x: p.x + p.ox, y: p.y + p.oy, visible: p.visible };
      }

      const line = connectorLineRef.current;
      const section = sectionRef.current;
      const cardAnchor = cardAnchorRef.current;
      if (line && section && cardAnchor && activePin?.visible) {
        const sectionBox = section.getBoundingClientRect();
        const wrapBox = wrap.getBoundingClientRect();
        const anchorBox = cardAnchor.getBoundingClientRect();
        line.setAttribute(
          "x1",
          String(wrapBox.left - sectionBox.left + activePin.x * wrapBox.width),
        );
        line.setAttribute(
          "y1",
          String(wrapBox.top - sectionBox.top + activePin.y * wrapBox.height),
        );
        line.setAttribute(
          "x2",
          String(anchorBox.left - sectionBox.left + anchorBox.width / 2),
        );
        line.setAttribute(
          "y2",
          String(anchorBox.top - sectionBox.top + anchorBox.height / 2),
        );
        line.style.opacity = "1";
      } else if (line) {
        line.style.opacity = "0";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(() => {
      const next = syncSize();
      globe?.update({
        width: next * 2,
        height: next * 2,
        phi: phiRef.current,
        theta: GLOBE_THETA,
      });
    });
    ro.observe(wrap);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      globe?.destroy();
    };
  }, [reviews, reduceMotion]);

  // "—" on the server, the visitor's local date on the client (no hydration mismatch)
  const today = useSyncExternalStore(
    subscribeNever,
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    () => "—",
  );

  if (!active) return null;

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden bg-bg py-20 text-heading md:py-28 ${className}`}
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      >
        <line
          ref={connectorLineRef}
          x1={0}
          y1={0}
          x2={0}
          y2={0}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 5"
          style={{ opacity: 0 }}
        />
      </svg>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:gap-8">
        {/* Intro above globe on mobile */}
        <div className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1 lg:self-end">
          <p className="mb-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            Chapter 02 — Partners
          </p>
          <h2 className="max-w-[14ch] font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.02] text-heading">
            Partners on <em className="italic">every continent</em>
          </h2>
          <p className="mt-5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-fg-muted">
            {stats.partners} partner universities · {stats.countries} countries ·{" "}
            {stats.continents} continents
          </p>
          <a
            href="#stories"
            className="mt-5 inline-block font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-accent ink-underline"
          >
            Read all partner notes →
          </a>
        </div>

        {/* Globe */}
        <div className="relative order-2 mx-auto aspect-square w-full max-w-[520px] lg:order-1 lg:col-start-1 lg:row-span-2 lg:max-w-none">
          <div ref={globeWrapRef} className="relative h-full w-full">
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              style={{ width: "100%", height: "100%" }}
            />
            {reviews.map((r) => {
              const isActive = r.id === active.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  ref={(el) => {
                    pinElsRef.current[r.id] = el;
                  }}
                  aria-label={`Show partner note from ${r.city}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => goTo(reviews.findIndex((x) => x.id === r.id))}
                  className="absolute left-1/2 top-1/2 opacity-0"
                  style={{ width: 40, height: 40 }}
                >
                  <span
                    className={`flex h-full w-full items-center justify-center rounded-full border-2 font-[family-name:var(--font-mono)] text-[10px] font-medium tracking-wide ${
                      isActive
                        ? "border-accent bg-bg text-accent"
                        : "border-line-strong bg-bg text-heading"
                    }`}
                  >
                    {initials(r)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Postcard */}
        <div className="relative order-3 lg:order-2 lg:col-start-2 lg:row-start-2 lg:self-start">
          <div
            className="relative border border-line-strong bg-card-alt p-5 sm:p-6"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              ref={cardAnchorRef}
              aria-hidden
              className="absolute top-1/2 left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-strong bg-bg"
            />

            {/* Stamp + postmark */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <button
                type="button"
                aria-label="Previous"
                onClick={goPrev}
                className="font-[family-name:var(--font-mono)] text-[11px] text-fg-muted ink-underline"
              >
                ‹ Prev
              </button>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-fg-muted">
                {activeIndex + 1} / {total}
              </span>
              <button
                type="button"
                aria-label="Next"
                onClick={goNext}
                className="font-[family-name:var(--font-mono)] text-[11px] text-fg-muted ink-underline"
              >
                Next ›
              </button>
            </div>

            <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
              <span className="border-2 border-accent px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.12em] text-accent">
                Air Mail
              </span>
              <span className="rotate-[-8deg] rounded-full border border-accent px-2 py-1 font-[family-name:var(--font-mono)] text-[8px] uppercase tracking-wider text-accent">
                {active.city} · {today}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduceMotion ? false : { opacity: 0, rotate: -1 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-6 grid gap-6 sm:grid-cols-[1.2fr_1px_0.9fr]"
              >
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg leading-relaxed text-heading sm:text-xl">
                    {active.text.replace(/^PLACEHOLDER:\s*/i, "")}
                  </p>
                  <p className="mt-4 font-[family-name:var(--font-script)] text-2xl text-heading">
                    — {active.name.replace(/^Sample Reviewer — /, "")}
                  </p>
                </div>
                <div aria-hidden className="hidden bg-accent/30 sm:block" />
                <div className="space-y-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-fg-muted">
                  <p className="border-b border-dashed border-line-strong/30 pb-2 text-heading">
                    {active.company}
                  </p>
                  <p className="border-b border-dashed border-line-strong/30 pb-2">
                    {active.city}
                  </p>
                  <p className="border-b border-dashed border-line-strong/30 pb-2">
                    {active.countryCode}
                  </p>
                  <p className="pt-1 text-[10px]">{active.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { GlobeTestimonialsProps };
