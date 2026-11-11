"use client";

import { getPartnerPhotos, type Partner } from "@/data/partners";
import { displayName } from "./aggregate";
import { useEffect, useState } from "react";

type MapCampusGalleryProps = {
  partner: Partner;
  onClose?: () => void;
};

/**
 * Fills the map viewport at partner (L3) level with campus photos.
 */
export default function MapCampusGallery({
  partner,
  onClose,
}: MapCampusGalleryProps) {
  const photos = getPartnerPhotos(partner, 3);
  const [active, setActive] = useState(0);

  // Reset to the first photo when the partner changes, during render (no flash of the old photo)
  const [shownId, setShownId] = useState(partner.id);
  if (shownId !== partner.id) {
    setShownId(partner.id);
    setActive(0);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight")
        setActive((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setActive((i) => (i - 1 + photos.length) % photos.length);
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-bg"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      role="region"
      aria-label={`${partner.shortName} campus photos`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-display)] text-lg text-heading">
            {displayName(partner.name)}
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-fg-muted">
            {partner.city} · Campus photos · {active + 1}/{photos.length}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-line-strong px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-heading"
          >
            Back to map
          </button>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 bg-cobalt-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[active]}
          src={photos[active]}
          alt={`${partner.shortName} campus ${active + 1}`}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cobalt-950/70 to-transparent" />

        <button
          type="button"
          className="absolute top-1/2 left-2 -translate-y-1/2 border border-white/30 bg-cobalt-950/40 px-2 py-3 font-[family-name:var(--font-mono)] text-sm text-white backdrop-blur-sm"
          aria-label="Previous photo"
          onClick={() =>
            setActive((i) => (i - 1 + photos.length) % photos.length)
          }
        >
          ←
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 border border-white/30 bg-cobalt-950/40 px-2 py-3 font-[family-name:var(--font-mono)] text-sm text-white backdrop-blur-sm"
          aria-label="Next photo"
          onClick={() => setActive((i) => (i + 1) % photos.length)}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-px border-t border-line bg-line">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            className={`relative overflow-hidden bg-bg ${
              active === i ? "ring-2 ring-inset ring-accent" : "opacity-75"
            }`}
            aria-label={`Show photo ${i + 1}`}
            aria-pressed={active === i}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="aspect-[16/10] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
