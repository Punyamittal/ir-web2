"use client";

import { getPartnerPhotos, type Partner } from "@/data/partners";
import { useEffect, useState } from "react";

type PartnerPhotosProps = {
  partner: Partner;
};

/**
 * Campus photo strip + lightbox for the selected college.
 */
export default function PartnerPhotos({ partner }: PartnerPhotosProps) {
  const photos = getPartnerPhotos(partner, 3);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Reset when the partner changes, during render (no extra effect pass / flash of old photo)
  const [shownId, setShownId] = useState(partner.id);
  if (shownId !== partner.id) {
    setShownId(partner.id);
    setActive(0);
    setLightbox(null);
  }

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight")
        setLightbox((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) =>
          i === null ? i : (i - 1 + photos.length) % photos.length,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  return (
    <div className="mt-5">
      <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-fg-muted">
        Campus photos
      </p>

      <button
        type="button"
        onClick={() => setLightbox(active)}
        className="group relative block w-full overflow-hidden border border-line-strong bg-cobalt-50"
        aria-label={`View campus photo ${active + 1} of ${photos.length}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[active]}
          src={photos[active]}
          alt={`${partner.shortName} campus`}
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          loading="eager"
          decoding="async"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-cobalt-950/55 to-transparent px-3 py-2 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-white opacity-0 transition group-hover:opacity-100">
          Open gallery
        </span>
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => {
              setActive(i);
              setLightbox(i);
            }}
            className={`overflow-hidden border ${
              active === i ? "border-accent" : "border-line"
            }`}
            aria-label={`Campus photo ${i + 1}`}
            aria-pressed={active === i}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-cobalt-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-label={`${partner.shortName} campus gallery`}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-white"
            onClick={() => setLightbox(null)}
          >
            Close ✕
          </button>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 font-[family-name:var(--font-mono)] text-white/80 md:left-8"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) =>
                i === null ? i : (i - 1 + photos.length) % photos.length,
              );
            }}
          >
            ←
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightbox]}
            alt={`${partner.shortName} campus ${lightbox + 1}`}
            className="max-h-[82vh] max-w-[min(960px,94vw)] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 font-[family-name:var(--font-mono)] text-white/80 md:right-8"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? i : (i + 1) % photos.length));
            }}
          >
            →
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-white/70">
            {partner.shortName} · {lightbox + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
