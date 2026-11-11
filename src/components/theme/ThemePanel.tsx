"use client";

import {
  applyBrandToDocument,
  buildTokensCssBlock,
} from "@/lib/theme-tokens";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ir-theme-panel-v1";
const DEFAULT_BRAND = "#002a9a";

type Stored = {
  brand: string;
  warmth: number;
  inkMode: "brand" | "near-black";
  night: boolean;
  open: boolean;
};

function loadStored(): Stored {
  const fallback: Stored = {
    brand: DEFAULT_BRAND,
    warmth: 0.55,
    inkMode: "brand",
    night: false,
    open: false,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveStored(s: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Dev-only theme lab. Toggle with Shift+T.
 * Excluded from production via layout conditional.
 */
export default function ThemePanel() {
  // Client-only (mounted via next/dynamic ssr:false), so reading storage while
  // initialising state is safe and avoids a setState cascade in an effect.
  const [stored] = useState(loadStored);
  const [open, setOpen] = useState(stored.open);
  const [brand, setBrand] = useState(stored.brand);
  const [warmth, setWarmth] = useState(stored.warmth);
  const [inkMode, setInkMode] = useState<"brand" | "near-black">(stored.inkMode);
  const [night, setNight] = useState(stored.night);
  const [copied, setCopied] = useState(false);

  const apply = useCallback(
    (next: Partial<Stored> & { brand?: string }) => {
      const b = next.brand ?? brand;
      const w = next.warmth ?? warmth;
      const mode = next.inkMode ?? inkMode;
      const isNight = next.night ?? night;
      applyBrandToDocument(b, { warmth: w, inkMode: mode });
      if (isNight) document.documentElement.setAttribute("data-theme", "night");
      else document.documentElement.removeAttribute("data-theme");
    },
    [brand, warmth, inkMode, night],
  );

  useEffect(() => {
    applyBrandToDocument(stored.brand, {
      warmth: stored.warmth,
      inkMode: stored.inkMode,
    });
    if (stored.night) document.documentElement.setAttribute("data-theme", "night");
  }, [stored]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          saveStored({ brand, warmth, inkMode, night, open: next });
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [brand, warmth, inkMode, night]);

  const persist = (patch: Partial<Stored>) => {
    const next = { brand, warmth, inkMode, night, open, ...patch };
    setBrand(next.brand);
    setWarmth(next.warmth);
    setInkMode(next.inkMode);
    setNight(next.night);
    setOpen(next.open);
    saveStored(next);
    apply(next);
  };

  const copyTokens = async () => {
    const block = buildTokensCssBlock(brand, warmth);
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return (
    <aside
      className="fixed right-4 bottom-4 z-[200] w-[min(92vw,20rem)] border border-line-strong bg-surface p-4 font-[family-name:var(--font-mono)] text-[11px] text-text shadow-none"
      role="dialog"
      aria-label="Theme panel"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="uppercase tracking-[0.16em] text-text-muted">
          Theme · Shift+T
        </p>
        <button
          type="button"
          className="text-ink ink-underline"
          onClick={() => persist({ open: false })}
        >
          Close
        </button>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block uppercase tracking-[0.14em] text-text-muted">
          Brand color
        </span>
        <input
          type="color"
          value={brand}
          onChange={(e) => persist({ brand: e.target.value })}
          className="h-9 w-full cursor-pointer border border-line bg-bg"
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1 flex justify-between uppercase tracking-[0.14em] text-text-muted">
          <span>Paper tone</span>
          <span>{warmth < 0.45 ? "Cooler" : warmth > 0.65 ? "Warmer" : "Balanced"}</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={warmth}
          onChange={(e) => persist({ warmth: Number(e.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </label>

      <label className="mb-3 flex items-center justify-between gap-3">
        <span className="uppercase tracking-[0.14em] text-text-muted">
          Ink mode
        </span>
        <button
          type="button"
          className="border border-line-strong px-2 py-1 text-ink"
          onClick={() =>
            persist({
              inkMode: inkMode === "brand" ? "near-black" : "brand",
            })
          }
        >
          {inkMode === "brand" ? "Brand" : "Near-black"}
        </button>
      </label>

      <label className="mb-4 flex items-center justify-between gap-3">
        <span className="uppercase tracking-[0.14em] text-text-muted">
          Night theme
        </span>
        <button
          type="button"
          className="border border-line-strong px-2 py-1 text-ink"
          onClick={() => persist({ night: !night })}
        >
          {night ? "On" : "Off"}
        </button>
      </label>

      <button
        type="button"
        onClick={copyTokens}
        className="w-full border border-line-strong bg-accent px-3 py-2 text-accent-contrast transition hover:bg-accent-hover"
      >
        {copied ? "Copied" : "Copy tokens"}
      </button>
    </aside>
  );
}
