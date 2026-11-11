"use client";

import {
  programsContent,
  type ProgramAudience,
} from "@/data/home";
import { displayText } from "@/lib/display-text";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { DoodleBarcode } from "./doodles";
import SectionHeading from "./SectionHeading";
import { Reveal } from "./Reveal";

export default function Programs() {
  const { eyebrow, heading, filters, items } = programsContent;
  const [filter, setFilter] = useState<ProgramAudience>("all");
  const reduce = useReducedMotion();

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.audience.includes(filter));
  }, [filter, items]);

  return (
    <section id="programs" className="surface-light py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            heading={[heading[0], heading[1].replace(/\.$/, "")]}
            align="offset"
          />
        </Reveal>

        <div
          className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-3"
          role="tablist"
          aria-label="Program filters"
        >
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(f.id)}
                className={`font-[family-name:var(--font-inter)] text-sm ${
                  on
                    ? "text-accent underline decoration-1 underline-offset-8"
                    : "text-fg-muted ink-underline"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <LayoutGroup>
          <motion.ul layout className="mt-10 grid gap-6 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {visible.map((item, idx) => (
                <motion.li
                  key={item.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  className={idx % 2 === 1 ? "md:mt-8" : ""}
                >
                  {/* Boarding pass */}
                  <article className="group relative flex overflow-hidden border border-line-strong bg-card">
                    {/* Half-circle notches */}
                    <span
                      aria-hidden
                      className="absolute top-1/2 -left-2 z-10 size-4 -translate-y-1/2 rounded-full border border-line-strong bg-bg"
                    />
                    <span
                      aria-hidden
                      className="absolute top-1/2 -right-[calc(5.5rem+0.25rem)] z-10 hidden size-4 -translate-y-1/2 rounded-full border border-line-strong bg-bg sm:block"
                    />

                    <div className="min-w-0 flex-1 p-5 pr-4">
                      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-fg-muted">
                        From MAA Chennai → Partner University
                      </p>
                      <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-medium leading-tight text-heading">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                        {displayText(item.description)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-heading">
                        {item.tags.map((t) => (
                          <span key={t}>
                            {t.includes("sem") || t.includes("week") || t.includes("visit") || t.includes("Ongoing") || t.includes("2+")
                              ? `Duration ${t}`
                              : t.includes("UG") || t.includes("Faculty") || t.includes("Research") || t.includes("Degree") || t.includes("Open")
                                ? `Class ${t}`
                                : t}
                          </span>
                        ))}
                        <span>Gate {item.audience[0] === "faculty" ? "Faculty" : item.audience[0] === "research" ? "Research" : "Students"}</span>
                      </div>
                    </div>

                    {/* Stub */}
                    <div className="relative hidden w-[5.5rem] shrink-0 flex-col items-center justify-between border-l border-dashed border-cobalt-100 py-4 transition-colors group-hover:border-transparent group-hover:bg-accent sm:flex">
                      <DoodleBarcode className="h-8 w-10 text-illustration group-hover:text-on-accent" />
                      <a
                        href={item.href}
                        className="px-1 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-accent transition-colors group-hover:text-on-accent"
                      >
                        Learn
                        <br />
                        more
                      </a>
                    </div>
                  </article>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </LayoutGroup>
      </div>
    </section>
  );
}
