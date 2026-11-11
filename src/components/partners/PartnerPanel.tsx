"use client";

import type { Partner } from "@/data/partners";
import { StampIn } from "@/components/home/Reveal";
import { displayName } from "./aggregate";
import type { CountryAgg } from "./types";

type PartnerPanelProps = {
  mode: "world" | "country" | "partner";
  countries: CountryAgg[];
  countryPartners: Partner[];
  selected: Partner | null;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onSelectCountry: (code: string) => void;
  onSelectPartner: (id: string) => void;
  sheet?: "peek" | "half" | "full";
  onSheetChange?: (s: "peek" | "half" | "full") => void;
};

export default function PartnerPanel({
  mode,
  countries,
  countryPartners,
  selected,
  hoverId,
  onHover,
  onSelectCountry,
  onSelectPartner,
  sheet = "half",
  onSheetChange,
}: PartnerPanelProps) {
  const byContinent = countries.reduce<Record<string, CountryAgg[]>>((acc, c) => {
    (acc[c.continent] ??= []).push(c);
    return acc;
  }, {});

  const byCity = countryPartners.reduce<Record<string, Partner[]>>((acc, p) => {
    (acc[p.city] ??= []).push(p);
    return acc;
  }, {});

  const heightCls =
    sheet === "peek" ? "max-h-[22vh]" : sheet === "half" ? "max-h-[48vh]" : "max-h-[85vh]";

  return (
    <aside
      className={`flex w-full min-h-0 flex-col border border-line-strong bg-bg lg:h-[640px] lg:max-h-[640px] lg:w-[340px] lg:shrink-0 ${heightCls}`}
    >
      {/* Mobile sheet handle */}
      <button
        type="button"
        className="flex justify-center border-b border-line py-2 lg:hidden"
        aria-label="Resize panel"
        onClick={() =>
          onSheetChange?.(
            sheet === "peek" ? "half" : sheet === "half" ? "full" : "peek",
          )
        }
      >
        <span className="h-1 w-10 bg-accent/30" />
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable]">
        {mode === "world" && (
          <div className="space-y-5">
            <p className="sticky top-0 z-10 -mx-4 mb-1 border-b border-line bg-bg px-4 pb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-fg-muted">
              Countries
            </p>
            {Object.entries(byContinent)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([continent, list]) => (
                <div key={continent}>
                  <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-accent">
                    {continent}
                  </p>
                  <ul className="divide-y divide-line border-t border-line-strong/60">
                    {[...list]
                      .sort((a, b) => b.count - a.count)
                      .map((c) => (
                        <li key={c.countryCode}>
                          <button
                            type="button"
                            onMouseEnter={() => onHover(`country-${c.countryCode}`)}
                            onMouseLeave={() => onHover(null)}
                            onClick={() => onSelectCountry(c.countryCode)}
                            className={`flex w-full items-baseline justify-between gap-3 py-2.5 text-left ${
                              hoverId === `country-${c.countryCode}`
                                ? "text-accent"
                                : "text-heading"
                            }`}
                          >
                            <span className="font-[family-name:var(--font-display)] text-lg">
                              {c.country}
                            </span>
                            <span className="font-[family-name:var(--font-mono)] text-[10px] text-fg-muted">
                              {c.countryCode} · {c.count}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        )}

        {mode === "country" && (
          <div className="space-y-5">
            <p className="sticky top-0 z-10 -mx-4 mb-1 border-b border-line bg-bg px-4 pb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-fg-muted">
              Colleges by city
            </p>
            {Object.entries(byCity)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([city, list]) => (
                <div key={city}>
                  <p className="sticky top-7 z-[9] -mx-4 mb-1 bg-bg/95 px-4 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-accent backdrop-blur-sm">
                    {city} · {list.length}
                  </p>
                  <ul className="divide-y divide-line">
                    {list.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseEnter={() => onHover(`partner-${p.id}`)}
                          onMouseLeave={() => onHover(null)}
                          onClick={() => onSelectPartner(p.id)}
                          className={`w-full py-2 text-left ${
                            hoverId === `partner-${p.id}` || selected?.id === p.id
                              ? "text-accent"
                              : "text-heading"
                          }`}
                        >
                          <span className="font-[family-name:var(--font-display)] text-base">
                            {displayName(p.name)}
                          </span>
                          <span className="mt-0.5 block font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider text-fg-muted">
                            {p.shortName} · since {p.since}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {countryPartners.length === 0 && (
              <p className="py-8 text-center font-[family-name:var(--font-display)] text-lg italic text-fg-muted">
                No partners for this program here yet.
              </p>
            )}
          </div>
        )}

        {mode === "partner" && selected && (
          <StampIn>
            <article className="surface-card-light relative border border-line-strong p-4">
              <div className="absolute top-3 right-3 z-[1] flex flex-col items-end gap-1">
                <span className="border-2 border-accent bg-accent px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[8px] uppercase tracking-wider text-on-accent">
                  Partner
                </span>
                <span className="rounded-full border border-accent bg-bg/90 px-2 py-1 font-[family-name:var(--font-mono)] text-[8px] uppercase text-accent backdrop-blur-sm">
                  {selected.city} · {selected.since}
                </span>
              </div>
              <div className="mb-4 flex size-12 items-center justify-center border-2 border-line-strong font-[family-name:var(--font-mono)] text-xs">
                {selected.shortName.slice(0, 3)}
              </div>
              <h3 className="max-w-[16ch] font-[family-name:var(--font-display)] text-2xl font-medium leading-tight text-heading">
                {displayName(selected.name)}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.types.map((t) => (
                  <span
                    key={t}
                    className="border border-line-strong px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider text-heading"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <p className="mt-5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                Campus photos are shown in the map panel →
              </p>

              {selected.quote && (
                <blockquote className="mt-5 border-l border-line-strong pl-3 font-[family-name:var(--font-display)] text-base italic leading-snug text-heading">
                  “{displayName(selected.quote.text)}”
                  <footer className="mt-2 font-[family-name:var(--font-mono)] text-[9px] not-italic uppercase tracking-wider text-fg-muted">
                    {selected.quote.author} · {selected.quote.role}
                  </footer>
                </blockquote>
              )}
              <div className="mt-6 flex flex-col gap-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em]">
                {selected.website && (
                  <a href={selected.website} className="text-accent ink-underline">
                    Visit website ↗
                  </a>
                )}
                <a href="#programs" className="text-accent ink-underline">
                  See programs →
                </a>
              </div>
            </article>
          </StampIn>
        )}
      </div>
    </aside>
  );
}
