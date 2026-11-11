"use client";

import { impactStats } from "@/data/home";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ScribbleCircle } from "./doodles";

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!active || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, duration, reduce, target]);

  // Reduced motion: show the final number straight away, no count-up
  return reduce ? target : value;
}

function Stat({
  value,
  suffix,
  label,
  active,
  highlight,
  showRule,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  highlight?: boolean;
  showRule?: boolean;
}) {
  const n = useCountUp(value, active);
  const reduce = useReducedMotion();

  return (
    <div
      className={`relative flex flex-1 flex-col items-center justify-center px-4 py-6 text-center md:py-2 ${
        showRule
          ? "border-t border-line md:border-t-0 md:border-l md:border-line"
          : ""
      }`}
    >
      {highlight && !reduce && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-90"
          style={{ color: "#C9A227" }}
        >
          <ScribbleCircle className="ink-scribble h-[88%] w-[92%]" />
        </div>
      )}
      <p
        className={`relative font-[family-name:var(--font-display)] text-5xl font-medium leading-none tracking-tight md:text-6xl ${
          highlight ? "text-[#C9A227]" : "text-heading"
        }`}
      >
        {n}
        {suffix}
      </p>
      <p className="relative mt-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-fg-muted">
        {label}
      </p>
    </div>
  );
}

export default function ImpactStrip() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setActive(true),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-label="Impact statistics"
      className="surface-blue border-y border-line py-14 md:py-16"
    >
      <div className="mx-auto flex max-w-6xl flex-col md:flex-row md:items-stretch">
        {impactStats.map((s, i) => (
          <Stat
            key={s.id}
            value={s.value}
            suffix={s.suffix}
            label={s.label}
            active={active}
            highlight={s.id === "students"}
            showRule={i > 0}
          />
        ))}
      </div>
    </section>
  );
}
