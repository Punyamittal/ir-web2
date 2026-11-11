"use client";

import { storiesContent } from "@/data/home";
import { displayText } from "@/lib/display-text";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { InkBust } from "./doodles";
import SectionHeading from "./SectionHeading";
import { Reveal } from "./Reveal";

const rotations = [-2.5, 2, -1.5, 3, -3];

export default function StudentStories() {
  const { eyebrow, heading, items } = storiesContent;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [straight, setStraight] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-story-card]");
    const amount = card ? card.offsetWidth + 24 : 300;
    const end = el.scrollWidth - el.clientWidth;
    // Wrap around at either end instead of stalling on the last card
    if (dir === 1 && el.scrollLeft >= end - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && el.scrollLeft <= 4) {
      el.scrollTo({ left: end, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * amount, behavior: "smooth" });
    }
  }, []);

  /** Touch, keyboard or button use pauses autoplay, which resumes after a quiet period. */
  const holdAutoplay = useCallback(() => {
    setPaused(true);
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 8000);
  }, []);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  // Only auto-advance while the carousel is actually on screen
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || paused || !inView) return;
    const id = window.setInterval(() => scrollByCard(1), 5000);
    return () => window.clearInterval(id);
  }, [inView, paused, reduce, scrollByCard]);

  return (
    <section id="stories" className="surface-light py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHeading
              eyebrow={eyebrow}
              heading={[heading[0], heading[1].replace(/\.$/, "")]}
              align="left"
            />
          </Reveal>
          <div className="flex gap-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em]">
            <button
              type="button"
              onClick={() => {
                holdAutoplay();
                scrollByCard(-1);
              }}
              className="text-heading ink-underline"
              aria-label="Previous stories"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => {
                holdAutoplay();
                scrollByCard(1);
              }}
              className="text-heading ink-underline"
              aria-label="Next stories"
            >
              Next →
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            setPaused(false);
            setStraight(null);
          }}
          onTouchStart={holdAutoplay}
          onFocus={holdAutoplay}
          className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Student stories"
        >
          {items.map((story, i) => {
            const rot = rotations[i % rotations.length];
            const isStraight = straight === story.id;
            return (
              <motion.article
                key={story.id}
                data-story-card
                onPointerDown={() => setStraight(story.id)}
                onPointerUp={() => setStraight(null)}
                onPointerCancel={() => setStraight(null)}
                initial={false}
                animate={{ rotate: reduce || isStraight ? 0 : rot }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                style={{ boxShadow: "0 8px 24px var(--shadow-soft)" }}
                className="relative w-[min(80vw,280px)] shrink-0 snap-start border border-cobalt-100 bg-card p-3"
              >
                {/* Washi tape */}
                <span
                  aria-hidden
                  className="absolute -top-2 left-1/2 h-4 w-20 -translate-x-1/2 bg-cobalt-100"
                  style={{
                    clipPath:
                      "polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)",
                  }}
                />
                <div className="flex aspect-[4/5] items-center justify-center border border-line bg-accent-soft text-illustration">
                  <InkBust seed={i} className="h-36 w-36" />
                </div>
                <div className="mt-3 px-1 pb-2">
                  <p className="font-[family-name:var(--font-display)] text-lg font-medium text-heading">
                    {story.name.replace(/^Sample Student — /, "")}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-fg-muted">
                    MAA → {story.destination.split(" ")[0].toUpperCase()}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                    “{displayText(story.quote)}”
                  </p>
                  <a
                    href={story.href}
                    className="mt-3 inline-block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-accent ink-underline"
                  >
                    Read story
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
