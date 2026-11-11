"use client";

import { useEffect, useState } from "react";
import EarthLoader from "./EarthLoader";

const MIN_MS = 650;
const MAX_MS = 1600;
const EXIT_MS = 520;

/**
 * Full-screen first-paint splash. Must sit *outside* `<main>` — main is veiled
 * while `data-splash` is set, so a loader inside main would be invisible.
 */
export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    let contentReady = false;
    let minElapsed = false;

    document.documentElement.dataset.splash = "1";
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const progressTimer = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : Math.min(90, p + (p < 50 ? 4 : 1.5))));
    }, 100);

    const reveal = () => {
      if (finished) return;
      finished = true;
      clearInterval(progressTimer);
      setProgress(100);
      document.documentElement.dataset.appReady = "1";
      delete document.documentElement.dataset.splash;
      setLeaving(true);
      leaveTimer = setTimeout(() => {
        setVisible(false);
        document.body.style.overflow = prevOverflow;
      }, EXIT_MS);
    };

    const maybeReveal = () => {
      if (contentReady && minElapsed) reveal();
    };

    const markContentReady = () => {
      contentReady = true;
      maybeReveal();
    };

    const minTimer = setTimeout(() => {
      minElapsed = true;
      maybeReveal();
    }, MIN_MS);

    // Prefer interactive / complete — never wait on late images alone.
    if (document.readyState === "complete" || document.readyState === "interactive") {
      markContentReady();
    } else {
      document.addEventListener("DOMContentLoaded", markContentReady, { once: true });
    }
    window.addEventListener("load", markContentReady, { once: true });

    const maxTimer = setTimeout(reveal, MAX_MS);

    return () => {
      window.removeEventListener("load", markContentReady);
      document.removeEventListener("DOMContentLoaded", markContentReady);
      if (leaveTimer) clearTimeout(leaveTimer);
      clearTimeout(maxTimer);
      clearTimeout(minTimer);
      clearInterval(progressTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`page-splash fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white ${
        leaving ? "page-splash--out" : "page-splash--in"
      }`}
      aria-busy={!leaving}
      aria-live="polite"
      role="status"
    >
      <div
        className={`flex flex-col items-center transition-transform duration-500 ease-out ${
          leaving ? "scale-[1.03]" : "scale-100"
        }`}
      >
        <EarthLoader label="International Relations · VIT Chennai" />
        <p className="mt-6 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-cobalt-700/65">
          Loading
          <span className="page-splash-dots" aria-hidden>
            …
          </span>
        </p>
      </div>

      <div
        className="absolute bottom-10 left-1/2 h-[2px] w-40 -translate-x-1/2 overflow-hidden rounded-full bg-cobalt-100"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-cobalt-700 transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
