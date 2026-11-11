"use client";

import type { ScreenMarker } from "./types";

type MapMarkersProps = {
  markers: ScreenMarker[];
  activeId: string | null;
  hoverId: string | null;
  onSelect: (m: ScreenMarker) => void;
  onHover: (id: string | null) => void;
  /**
   * Positions arrive in batches (every few canvas frames) to keep React work low.
   * Gliding between them over the batch interval keeps markers in step with the
   * 60fps globe instead of hopping. 0 = place instantly.
   */
  glideMs?: number;
};

function labelFor(m: ScreenMarker): string {
  const mk = m.marker;
  if (mk.kind === "country")
    return `${mk.data.country}, ${mk.data.count} partner universities`;
  if (mk.kind === "region")
    return `${mk.label}, ${mk.countries.length} countries, ${mk.count} partners`;
  if (mk.kind === "city")
    return `${mk.city}, ${mk.count} colleges`;
  if (mk.kind === "partner") return mk.data.name.replace(/^PLACEHOLDER:\s*/i, "");
  return `Cluster of ${mk.count} partners`;
}

/**
 * HTML marker overlay — buttons for accessibility, crisp mono labels.
 */
export default function MapMarkers({
  markers,
  activeId,
  hoverId,
  onSelect,
  onHover,
  glideMs = 0,
}: MapMarkersProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {markers.map((m) => {
        if (!m.visible) return null;
        const mk = m.marker;
        const isActive = m.id === activeId || m.id === hoverId;
        const size =
          mk.kind === "country" || mk.kind === "region"
            ? Math.min(56, Math.max(36, 32 + (mk.kind === "country" ? mk.data.count : mk.count)))
            : mk.kind === "city" || mk.kind === "cluster"
              ? mk.count > 1
                ? 44
                : 36
              : isActive
                ? 48
                : 36;

        return (
          // Outer layer moves (compositor-only transform); inner button handles hover scale
          <div
            key={m.id}
            className="absolute top-0 left-0 will-change-transform"
            style={{
              transform: `translate3d(${m.x}px, ${m.y}px, 0)`,
              transition: glideMs
                ? `transform ${glideMs}ms linear, opacity ${glideMs}ms linear`
                : undefined,
              opacity: Math.min(1, 0.4 + m.depth * 0.7),
              zIndex: isActive ? 5 : 2,
            }}
          >
          <button
            type="button"
            aria-label={labelFor(m)}
            onClick={() => onSelect(m)}
            onMouseEnter={() => onHover(m.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(m.id)}
            onBlur={() => onHover(null)}
            className="pointer-events-auto absolute transition-transform duration-200 ease-out"
            style={{
              width: size,
              height: size,
              transform: `translate(-50%, -50%) scale(${isActive ? 1.08 : 1})`,
            }}
          >
            <span
              className={`flex h-full w-full flex-col items-center justify-center rounded-full border-2 font-[family-name:var(--font-mono)] leading-none ${
                isActive
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line-strong bg-transparent text-heading"
              }`}
            >
              {mk.kind === "country" && (
                <>
                  <span className="text-[10px] tracking-wide">{mk.data.countryCode}</span>
                  <span className="mt-0.5 text-[8px] text-fg-muted">{mk.data.count}</span>
                </>
              )}
              {mk.kind === "region" && (
                <>
                  <span className="px-1 text-center text-[7px] tracking-wide">
                    {mk.label.slice(0, 6)}
                  </span>
                  <span className="text-[8px] text-fg-muted">{mk.count}</span>
                </>
              )}
              {(mk.kind === "city" || mk.kind === "cluster") && (
                <span className="text-[11px] font-medium">
                  {mk.count > 1 ? mk.count : "·"}
                </span>
              )}
              {mk.kind === "partner" && (
                <span className="px-0.5 text-center text-[8px] tracking-tight">
                  {mk.data.shortName.slice(0, 4)}
                </span>
              )}
            </span>
            {mk.kind === "city" && mk.count > 1 && (
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-[family-name:var(--font-mono)] text-[8px] uppercase tracking-wider text-fg-muted">
                {mk.city}
              </span>
            )}
          </button>
          </div>
        );
      })}
    </div>
  );
}
