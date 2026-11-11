import type { Partner, ProgramType } from "@/data/partners";
import type { CountryAgg, ProgramFilter } from "./types";

export function displayName(s: string) {
  return s.replace(/^PLACEHOLDER:\s*/i, "").trim();
}

export function filterPartners(
  partners: Partner[],
  filter: ProgramFilter,
): Partner[] {
  if (filter === "all") return partners;
  return partners.filter((p) => p.types.includes(filter as ProgramType));
}

export function aggregateByCountry(partners: Partner[]): CountryAgg[] {
  const map = new Map<string, CountryAgg>();
  for (const p of partners) {
    const cur = map.get(p.countryCode);
    if (!cur) {
      map.set(p.countryCode, {
        country: p.country,
        countryCode: p.countryCode,
        continent: p.continent,
        count: 1,
        lat: p.lat,
        lng: p.lng,
        types: [...p.types],
        partners: [p],
      });
    } else {
      cur.count += 1;
      cur.lat += p.lat;
      cur.lng += p.lng;
      cur.partners.push(p);
      for (const t of p.types) {
        if (!cur.types.includes(t)) cur.types.push(t);
      }
    }
  }
  return [...map.values()].map((c) => ({
    ...c,
    lat: c.lat / c.count,
    lng: c.lng / c.count,
  }));
}

export function partnerStats(partners: Partner[]) {
  const countries = new Set(partners.map((p) => p.countryCode)).size;
  const continents = new Set(partners.map((p) => p.continent)).size;
  return {
    universities: partners.length,
    countries,
    continents,
  };
}

/** Merge overlapping country stamps into regional clusters (screen-space). */
export function mergeOverlappingCountries(
  countries: CountryAgg[],
  project: (lng: number, lat: number) => { x: number; y: number; visible: boolean } | null,
  minDistPx = 44,
): Array<
  | { type: "country"; data: CountryAgg }
  | { type: "region"; label: string; countries: CountryAgg[]; lat: number; lng: number; count: number }
> {
  const placed: {
    item:
      | { type: "country"; data: CountryAgg }
      | { type: "region"; label: string; countries: CountryAgg[]; lat: number; lng: number; count: number };
    x: number;
    y: number;
  }[] = [];

  const sorted = [...countries].sort((a, b) => b.count - a.count);

  for (const c of sorted) {
    const pr = project(c.lng, c.lat);
    if (!pr?.visible) continue;

    let merged = false;
    for (const slot of placed) {
      const d = Math.hypot(slot.x - pr.x, slot.y - pr.y);
      if (d < minDistPx) {
        if (slot.item.type === "country") {
          const a = slot.item.data;
          const countries = [a, c];
          const continent =
            a.continent === c.continent ? a.continent.toUpperCase() : "REGION";
          slot.item = {
            type: "region",
            label: continent,
            countries,
            lat: (a.lat + c.lat) / 2,
            lng: (a.lng + c.lng) / 2,
            count: a.count + c.count,
          };
        } else {
          slot.item.countries.push(c);
          slot.item.count += c.count;
          const n = slot.item.countries.length;
          slot.item.lat =
            slot.item.countries.reduce((s, x) => s + x.lat, 0) / n;
          slot.item.lng =
            slot.item.countries.reduce((s, x) => s + x.lng, 0) / n;
        }
        merged = true;
        break;
      }
    }
    if (!merged) {
      placed.push({ item: { type: "country", data: c }, x: pr.x, y: pr.y });
    }
  }

  return placed.map((p) => p.item);
}
