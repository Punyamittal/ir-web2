"use client";

import { PROGRAM_FILTERS, partners as allPartners } from "@/data/partners";
import { useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  aggregateByCountry,
  filterPartners,
  mergeOverlappingCountries,
  partnerStats,
} from "./aggregate";
import Breadcrumbs from "./Breadcrumbs";
import GlobeCanvas, { getCountryFeature } from "./GlobeCanvas";
import MapCampusGallery from "./MapCampusGallery";
import MapMarkers from "./MapMarkers";
import PartnerPanel from "./PartnerPanel";
import { easeInOutCubic } from "./projection-morph";
import type { ProgramFilter, ScreenMarker } from "./types";
import { usePartnerClusters } from "./usePartnerClusters";

/**
 * Interactive partner explorer: World → Country → College.
 * Only one LOD of markers is shown at a time so the globe never clutters.
 */
export default function PartnerExplorer() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [filter, setFilter] = useState<ProgramFilter>("all");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [rotate, setRotate] = useState<[number, number, number]>([0, -12, 0]);
  const [morph, setMorph] = useState(0);
  const [mapZoom, setMapZoom] = useState(4);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const draggingRef = useRef(false);
  const [inView, setInView] = useState(true);
  const [size, setSize] = useState({ w: 640, h: 520 });
  const [markers, setMarkers] = useState<ScreenMarker[]>([]);
  const [sheet, setSheet] = useState<"peek" | "half" | "full">("half");
  const [query, setQuery] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const projectRef = useRef<
    | ((
        lon: number,
        lat: number,
      ) => { x: number; y: number; visible: boolean; depth: number } | null)
    | null
  >(null);
  const dragRef = useRef<{ x: number; y: number; rot: [number, number, number] } | null>(null);
  const morphAnim = useRef<number | null>(null);
  const markersSig = useRef("");
  const rotateLive = useRef(rotate);

  useEffect(() => {
    rotateLive.current = rotate;
  }, [rotate]);

  const filtered = useMemo(
    () => filterPartners(allPartners, filter),
    [filter],
  );
  const countries = useMemo(() => aggregateByCountry(filtered), [filtered]);
  const stats = useMemo(() => partnerStats(filtered), [filtered]);
  const countryPartners = useMemo(
    () =>
      countryCode
        ? filtered.filter((p) => p.countryCode === countryCode)
        : [],
    [filtered, countryCode],
  );
  const selected = useMemo(
    () => allPartners.find((p) => p.id === partnerId) ?? null,
    [partnerId],
  );
  const { getClusters, getExpansionZoom, getLeaves } =
    usePartnerClusters(countryPartners);

  const level = partnerId ? "partner" : countryCode ? "country" : "world";

  // ——— Deep link (?country=DE / ?partner=id) — applied once, after the globe has mounted ———
  // Going through goCountry/goPartner (instead of setting the codes directly) also runs the
  // world→country morph, so a shared link opens on the unrolled country map, not a paused globe.
  const deepLinked = useRef(false);

  const pushUrl = useCallback(
    (next: { country?: string | null; partner?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.country) params.set("country", next.country);
      else params.delete("country");
      if (next.partner) params.set("partner", next.partner);
      else params.delete("partner");
      params.delete("city");
      const q = params.toString();
      startTransition(() => {
        router.replace(q ? `?${q}#partners` : "#partners", { scroll: false });
      });
    },
    [router, searchParams, startTransition],
  );

  // ——— Resize / in-view (throttled — size churn remounts the canvas RAF) ———
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver(([e]) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = Math.max(280, Math.round(e.contentRect.width));
        const h = Math.max(320, Math.min(560, Math.round(w * 0.85)));
        setSize((prev) =>
          Math.abs(prev.w - w) < 2 && Math.abs(prev.h - h) < 2
            ? prev
            : { w, h },
        );
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ——— Morph animation world ↔ country ———
  const animateMorph = useCallback(
    (to: number, onDone?: () => void) => {
      if (reduceMotion) {
        setMorph(to);
        onDone?.();
        return;
      }
      if (morphAnim.current) cancelAnimationFrame(morphAnim.current);
      const from = morph;
      const start = performance.now();
      const dur = 900;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        setMorph(from + (to - from) * easeInOutCubic(t));
        if (t < 1) morphAnim.current = requestAnimationFrame(step);
        else onDone?.();
      };
      morphAnim.current = requestAnimationFrame(step);
    },
    [morph, reduceMotion],
  );

  const goWorld = useCallback(() => {
    setPartnerId(null);
    setCountryCode(null);
    setMapZoom(4);
    setPaused(false);
    animateMorph(0);
    pushUrl({ country: null, partner: null });
  }, [animateMorph, pushUrl]);

  const goCountry = useCallback(
    (code: string) => {
      const agg = countries.find((c) => c.countryCode === code);
      if (agg) {
        // Rotate country to front, then unroll
        setRotate([-agg.lng, -agg.lat, 0]);
      }
      setPartnerId(null);
      setCountryCode(code);
      setMapZoom(5);
      setPaused(true);
      animateMorph(1);
      pushUrl({ country: code, partner: null });
    },
    [animateMorph, countries, pushUrl],
  );

  const goPartner = useCallback(
    (id: string) => {
      const p = filtered.find((x) => x.id === id) ?? allPartners.find((x) => x.id === id);
      if (!p) return;
      if (countryCode !== p.countryCode) {
        setCountryCode(p.countryCode);
        setRotate([-p.lng, -p.lat, 0]);
        animateMorph(1);
      } else {
        setRotate([-p.lng, -p.lat, 0]);
      }
      setPartnerId(id);
      setMapZoom(12);
      setPaused(true);
      setSheet("full");
      if (morph < 0.9) animateMorph(1);
      pushUrl({ country: p.countryCode, partner: id });
    },
    [animateMorph, countryCode, filtered, morph, pushUrl],
  );

  useEffect(() => {
    if (deepLinked.current) return;
    const c = searchParams.get("country");
    const p = searchParams.get("partner");
    if (!c && !p) {
      deepLinked.current = true;
      return;
    }
    const id = requestAnimationFrame(() => {
      deepLinked.current = true;
      if (p) goPartner(p);
      else if (c) goCountry(c.toUpperCase());
    });
    return () => cancelAnimationFrame(id);
  }, [goCountry, goPartner, searchParams]);

  // Esc = up one level
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (partnerId) {
        setPartnerId(null);
        pushUrl({ country: countryCode, partner: null });
      } else if (countryCode) goWorld();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [countryCode, goWorld, partnerId, pushUrl]);

  // ——— Build markers each frame via canvas onFrame ———
  const rebuildMarkers = useCallback(() => {
    const project = projectRef.current;
    if (!project) return;

    if (!countryCode || morph < 0.5) {
      // L0 — country / region stamps
      const merged = mergeOverlappingCountries(countries, (lng, lat) => {
        const p = project(lng, lat);
        return p ? { x: p.x, y: p.y, visible: p.visible } : null;
      });
      const next: ScreenMarker[] = [];
      for (const item of merged) {
        if (item.type === "country") {
          const p = project(item.data.lng, item.data.lat);
          if (!p) continue;
          next.push({
            id: `country-${item.data.countryCode}`,
            x: p.x,
            y: p.y,
            visible: p.visible,
            depth: p.depth,
            marker: { kind: "country", data: item.data },
          });
        } else {
          const p = project(item.lng, item.lat);
          if (!p) continue;
          next.push({
            id: `region-${item.label}`,
            x: p.x,
            y: p.y,
            visible: p.visible,
            depth: p.depth,
            marker: {
              kind: "region",
              label: item.label,
              countries: item.countries,
              lat: item.lat,
              lng: item.lng,
              count: item.count,
            },
          });
        }
      }
      const sig = next
        .map((m) => `${m.id}:${m.x|0},${m.y|0},${m.visible?1:0}`)
        .join("|");
      if (sig !== markersSig.current) {
        markersSig.current = sig;
        setMarkers(next);
      }
      return;
    }

    // L1/L2 — supercluster over country partners
    const bbox: [number, number, number, number] = [-180, -85, 180, 85];
    const clusters = getClusters(bbox, mapZoom);
    const next: ScreenMarker[] = [];

    for (const f of clusters) {
      const [lng, lat] = f.geometry.coordinates;
      const p = project(lng, lat);
      if (!p?.visible) continue;
      const props = f.properties as {
        cluster?: boolean;
        cluster_id?: number;
        point_count?: number;
        partnerId?: string;
      };

      if (props.cluster && props.cluster_id != null) {
        // Same-campus spiderfy when max zoom
        if (mapZoom >= 14) {
          const leaves = getLeaves(props.cluster_id);
          const n = leaves.length;
          leaves.forEach((leaf, i) => {
            const pid = (leaf.properties as { partnerId?: string }).partnerId;
            const partner = countryPartners.find((x) => x.id === pid);
            if (!partner || !pid) return;
            const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
            const radius = 28 + n * 2;
            next.push({
              id: `partner-${pid}`,
              x: p.x + Math.cos(ang) * radius,
              y: p.y + Math.sin(ang) * radius,
              visible: true,
              depth: 1,
              marker: { kind: "partner", data: partner },
            });
          });
        } else {
          next.push({
            id: `cluster-${props.cluster_id}`,
            x: p.x,
            y: p.y,
            visible: true,
            depth: 1,
            marker: {
              kind: "cluster",
              id: props.cluster_id,
              count: props.point_count ?? 0,
              lat,
              lng,
              expansionZoom: getExpansionZoom(props.cluster_id),
            },
          });
        }
      } else if (props.partnerId) {
        const partner = countryPartners.find((x) => x.id === props.partnerId);
        if (!partner) continue;
        next.push({
          id: `partner-${partner.id}`,
          x: p.x,
          y: p.y,
          visible: true,
          depth: 1,
          marker: { kind: "partner", data: partner },
        });
      }
    }
    const sig = next
      .map((m) => `${m.id}:${m.x|0},${m.y|0},${m.visible?1:0}`)
      .join("|");
    if (sig !== markersSig.current) {
      markersSig.current = sig;
      setMarkers(next);
    }
  }, [
    countries,
    countryCode,
    countryPartners,
    getClusters,
    getExpansionZoom,
    getLeaves,
    mapZoom,
    morph,
  ]);

  // Drag to rotate (globe only) — uses live spin angle so drag starts from the current view
  const onPointerDown = (e: React.PointerEvent) => {
    if (morph > 0.2) return;
    draggingRef.current = true;
    setPaused(true);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      rot: [...rotateLive.current] as [number, number, number],
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  // Pointer events can fire several times per frame; commit at most one rotation per frame
  const dragFrame = useRef(0);
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const next: [number, number, number] = [
      dragRef.current.rot[0] + dx * 0.35,
      Math.max(-30, Math.min(30, dragRef.current.rot[1] - dy * 0.2)),
      0,
    ];
    rotateLive.current = next;
    if (!dragFrame.current) {
      dragFrame.current = requestAnimationFrame(() => {
        dragFrame.current = 0;
        setRotate([...rotateLive.current] as [number, number, number]);
      });
    }
  };
  useEffect(() => () => cancelAnimationFrame(dragFrame.current), []);
  const onPointerUp = () => {
    if (dragRef.current) {
      setRotate([...rotateLive.current] as [number, number, number]);
    }
    dragRef.current = null;
    draggingRef.current = false;
    // Always resume world spin after drag
    if (!countryCode) setPaused(false);
  };

  const onSelectMarker = (m: ScreenMarker) => {
    const mk = m.marker;
    if (mk.kind === "country") goCountry(mk.data.countryCode);
    else if (mk.kind === "region") {
      // Zoom to first country in region (or largest)
      const top = [...mk.countries].sort((a, b) => b.count - a.count)[0];
      if (top) goCountry(top.countryCode);
    } else if (mk.kind === "cluster") {
      setMapZoom(mk.expansionZoom);
    } else if (mk.kind === "city") {
      setMapZoom((z) => Math.min(16, z + 2));
    } else if (mk.kind === "partner") {
      goPartner(mk.data.id);
    }
  };

  // Search jump
  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return filtered
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [filtered, query]);

  const crumbs = [
    { label: "World", onClick: countryCode ? goWorld : undefined },
    ...(countryCode
      ? [
          {
            label:
              countries.find((c) => c.countryCode === countryCode)?.country ??
              countryCode,
            onClick: partnerId
              ? () => {
                  setPartnerId(null);
                  pushUrl({ country: countryCode, partner: null });
                }
              : undefined,
          },
        ]
      : []),
    ...(selected
      ? [{ label: selected.shortName }]
      : []),
  ];

  const panelMode =
    level === "partner" ? "partner" : level === "country" ? "country" : "world";

  // Ensure country feature exists for empty-ish codes
  void getCountryFeature;

  return (
    <section
      id="partners"
      ref={sectionRef}
      className="surface-blue py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-fg-muted">
          Chapter 02 — Partners
        </p>
        <h2 className="mt-3 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.02] text-heading">
          Partners on <em className="italic">every continent</em>
        </h2>
        <p className="mt-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-fg-muted">
          {stats.universities} partner universities · {stats.countries} countries ·{" "}
          {stats.continents} continents
        </p>

        {/* Filters */}
        <div
          className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-b border-line pb-3"
          role="tablist"
          aria-label="Program type"
        >
          {PROGRAM_FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(f.id as ProgramFilter)}
                className={`text-sm ${
                  on
                    ? "text-accent underline decoration-1 underline-offset-8"
                    : "text-fg-muted ink-underline"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mt-4 max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a university, city or country"
            className="w-full border-0 border-b border-line-strong bg-transparent py-2 font-[family-name:var(--font-inter)] text-sm text-heading outline-none placeholder:text-fg-muted/60"
          />
          {searchHits.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full border border-line-strong bg-bg">
              {searchHits.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-bg-alt"
                    onClick={() => {
                      setQuery("");
                      goPartner(p.id);
                    }}
                  >
                    <span className="font-[family-name:var(--font-display)]">
                      {p.shortName}
                    </span>
                    <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] text-fg-muted">
                      {p.city}, {p.countryCode}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <Breadcrumbs
            crumbs={crumbs}
            onBackGlobe={goWorld}
            showZoom={!!countryCode}
            onZoomIn={() => setMapZoom((z) => Math.min(16, z + 1))}
            onZoomOut={() => setMapZoom((z) => Math.max(3, z - 1))}
          />
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div
            ref={wrapRef}
            className="relative min-h-[360px] flex-1 touch-none border border-line bg-transparent select-none"
            style={{ height: size.h }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <GlobeCanvas
              width={size.w}
              height={size.h}
              rotate={rotate}
              morph={morph}
              countryCode={countryCode}
              focusLng={selected?.lng ?? null}
              focusLat={selected?.lat ?? null}
              autoRotate={!countryCode}
              paused={paused || !!selected}
              reduceMotion={!!reduceMotion}
              inView={inView && !selected}
              projectRef={projectRef}
              onFrame={rebuildMarkers}
              onRotate={(r) => {
                rotateLive.current = r;
              }}
            />
            {!selected ? (
              <MapMarkers
                markers={markers}
                activeId={
                  partnerId
                    ? `partner-${partnerId}`
                    : countryCode
                      ? `country-${countryCode}`
                      : null
                }
                hoverId={hoverId}
                onSelect={onSelectMarker}
                onHover={setHoverId}
                // GlobeCanvas reports positions every 12 frames while spinning, 6 otherwise
                glideMs={reduceMotion ? 0 : !countryCode && !paused ? 200 : 100}
              />
            ) : (
              <MapCampusGallery
                partner={selected}
                onClose={() => {
                  setPartnerId(null);
                  pushUrl({ country: countryCode, partner: null });
                }}
              />
            )}
          </div>

          <PartnerPanel
            mode={panelMode}
            countries={countries}
            countryPartners={countryPartners}
            selected={selected}
            hoverId={hoverId}
            onHover={setHoverId}
            onSelectCountry={goCountry}
            onSelectPartner={goPartner}
            sheet={sheet}
            onSheetChange={setSheet}
          />
        </div>

        {/* Visually hidden full list for a11y fallback */}
        <ul className="sr-only">
          {filtered.map((p) => (
            <li key={p.id}>
              {p.name.replace(/^PLACEHOLDER:\s*/i, "")} — {p.city}, {p.country}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
