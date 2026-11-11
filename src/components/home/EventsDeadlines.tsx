"use client";

import { eventsContent } from "@/data/home";
import { displayText } from "@/lib/display-text";
import { useEffect, useState } from "react";
import SectionHeading from "./SectionHeading";
import { Reveal, RevealItem } from "./Reveal";

function useCountdown(iso: string) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0 });
  useEffect(() => {
    const target = new Date(iso).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [iso]);
  return parts;
}

function Flap({ value }: { value: number }) {
  const s = String(value).padStart(2, "0");
  return (
    <span className="inline-flex overflow-hidden border border-white/20 bg-cobalt-900 font-[family-name:var(--font-mono)] text-2xl tabular-nums text-white sm:text-3xl">
      <span className="px-2 py-1">{s}</span>
    </span>
  );
}

export default function EventsDeadlines() {
  const { eyebrow, heading, events, deadline, news } = eventsContent;
  const cd = useCountdown(deadline.iso);

  return (
    <section id="events" className="surface-light py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            heading={[heading[0], heading[1].replace(/\.$/, "")]}
            align="left"
          />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <Reveal stagger className="space-y-4 lg:col-span-3">
            {events.map((ev) => (
              <RevealItem key={ev.id}>
                <article className="relative flex border border-line-strong bg-card">
                  {/* Perforated left edge */}
                  <div
                    aria-hidden
                    className="w-3 shrink-0 border-r border-dashed border-line-strong/40"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 0 50%, var(--bg) 3px, transparent 3.2px)",
                      backgroundSize: "12px 12px",
                      backgroundPosition: "-6px 0",
                    }}
                  />
                  <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-line py-4">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-medium leading-none text-heading">
                      {ev.day}
                    </span>
                    <span className="mt-1 font-[family-name:var(--font-mono)] text-[10px] tracking-wider text-fg-muted">
                      {ev.month}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-cobalt-500">
                      {ev.type}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-medium text-heading">
                      {displayText(ev.title)}
                    </h3>
                    <p className="mt-1 text-sm text-fg-muted">{ev.location}</p>
                  </div>
                  <a
                    href={ev.href}
                    className="m-3 hidden shrink-0 self-center border border-line-strong px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-heading transition hover:bg-accent hover:text-on-accent sm:inline-flex"
                  >
                    Register
                  </a>
                </article>
              </RevealItem>
            ))}
          </Reveal>

          <Reveal delay={0.08} className="space-y-6 lg:col-span-2">
            {/* Departures board */}
            <div className="border border-cobalt-700 bg-cobalt-700 p-5 text-white">
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-cobalt-200">
                Departures · {deadline.label}
              </p>
              <p className="mt-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-white">
                {displayText(deadline.program)} · Status: Boarding
              </p>
              <div className="mt-5 flex items-end justify-between gap-2">
                {[
                  { v: cd.d, l: "Days" },
                  { v: cd.h, l: "Hrs" },
                  { v: cd.m, l: "Min" },
                ].map((p) => (
                  <div key={p.l} className="text-center">
                    <Flap value={p.v} />
                    <p className="mt-2 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-cobalt-200">
                      {p.l}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href={deadline.href}
                className="mt-6 inline-flex w-full items-center justify-center border border-white bg-white px-4 py-2.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-cobalt-700 transition hover:bg-cobalt-50"
              >
                Apply now
              </a>
            </div>

            {/* Newspaper column */}
            <div className="border-l border-line-strong pl-4">
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                Latest news
              </p>
              <ul className="mt-3 space-y-4">
                {news.map((n) => (
                  <li key={n.id}>
                    <a href={n.href} className="group block">
                      <p className="font-[family-name:var(--font-display)] text-lg font-medium leading-snug text-heading group-hover:text-accent">
                        {displayText(n.title)}
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-fg-muted">
                        {n.date}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <a
          href="#events"
          className="mt-10 inline-block font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-accent ink-underline"
        >
          View all events →
        </a>
      </div>
    </section>
  );
}
