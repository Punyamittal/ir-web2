"use client";

import { aggregateByCountry, displayName } from "@/components/partners/aggregate";
import { PixelAtlas, type AtlasPoint } from "@/components/ui/pixel-atlas";
import { partners } from "@/data/partners";
import { useMemo } from "react";

/** VIT Chennai campus, Vandalur–Kelambakkam Road */
const HOME = { lat: 12.8406, lon: 80.1534 };

/**
 * Brand heat ramp for the map: cool cobalt through to the site's gold.
 * (Swap for undefined to get the component's default violet → orange ramp.)
 */
const PALETTE = ["#1a2350", "#002a9a", "#1f4fc2", "#839fe3", "#e8c15a", "#fff1c9"];

/**
 * The map's heat shader handles at most 24 places, so partners are grouped one point per
 * country; the filter chips are continents. VIT Chennai is the hottest point: every exchange
 * starts there.
 */
function usePoints(): AtlasPoint[] {
  return useMemo(() => {
    const countries = aggregateByCountry(partners).sort((a, b) => b.count - a.count);
    const countryPoints: AtlasPoint[] = countries.map((c) => {
      const names = c.partners.map((p) => displayName(p.shortName));
      const shown = names.slice(0, 3).join(", ");
      const more = names.length > 3 ? ` and ${names.length - 3} more` : "";
      return {
        id: `country-${c.countryCode}`,
        name: c.country,
        type: c.continent,
        lat: c.lat,
        lon: c.lng,
        description: `${c.count} partner ${c.count === 1 ? "university" : "universities"}: ${shown}${more}.`,
        activity: c.count,
      };
    });
    return [
      {
        id: "vit-chennai",
        name: "VIT Chennai",
        type: "home campus",
        lat: HOME.lat,
        lon: HOME.lon,
        description: `The Office of International Relations: ${partners.length} partner universities in ${countries.length} countries.`,
        activity: partners.length,
      },
      ...countryPoints,
    ];
  }, []);
}

export default function HeroAtlas() {
  const points = usePoints();
  const countryCount = points.length - 1;

  return (
    <>
      <div className="relative z-10 px-5 pt-20 pb-5 text-center sm:px-8 md:pt-24 md:pb-6">
        <p className="mb-3 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.2em] text-white/55 sm:text-xs">
          VIT Chennai
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.25rem,6vw,4.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
          International Relations
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-white/55">
          {partners.length} partner universities · {countryCount} countries · every journey starts in Chennai
        </p>
      </div>

      {/* The map fills the rest of the hero */}
      <div className="relative min-h-[320px] flex-1">
        <PixelAtlas points={points} height="fill" palette={PALETTE} tourEvery={5} />
      </div>
    </>
  );
}
