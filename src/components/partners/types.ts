import type { Partner, ProgramType } from "@/data/partners";

export type ExplorerLevel = "world" | "country" | "city" | "partner";

export type ProgramFilter = "all" | ProgramType;

export type CountryAgg = {
  country: string;
  countryCode: string;
  continent: string;
  count: number;
  lat: number;
  lng: number;
  types: ProgramType[];
  partners: Partner[];
};

export type MarkerKind =
  | { kind: "country"; data: CountryAgg }
  | { kind: "region"; label: string; countries: CountryAgg[]; lat: number; lng: number; count: number }
  | { kind: "city"; city: string; countryCode: string; count: number; lat: number; lng: number; partners: Partner[] }
  | { kind: "partner"; data: Partner }
  | { kind: "cluster"; id: number; count: number; lat: number; lng: number; expansionZoom: number };

export type ScreenMarker = {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  depth: number;
  marker: MarkerKind;
};

/** ISO 3166-1 alpha-2 → numeric (for world-atlas country ids) */
export const ISO2_TO_NUMERIC: Record<string, string> = {
  DE: "276",
  SG: "702",
  JP: "392",
  GB: "826",
  FR: "250",
  CA: "124",
  AU: "036",
  BR: "076",
  EG: "818",
  KR: "410",
};
