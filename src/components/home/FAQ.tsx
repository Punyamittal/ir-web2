"use client";

import { faqContent } from "@/data/home";
import { displayText } from "@/lib/display-text";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { DoodlePlus } from "./doodles";
import SectionHeading from "./SectionHeading";
import { Reveal } from "./Reveal";

export default function FAQ() {
  const { eyebrow, heading, items } = faqContent;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="surface-light py-16 md:py-24">
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
        {/* Cobalt notebook margin */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 left-[2.25rem] w-px bg-cobalt-200 sm:left-[3rem]"
        />

        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            heading={[heading[0], heading[1].replace(/\.$/, "")]}
            align="left"
            className="pl-8 sm:pl-10"
          />
        </Reveal>

        <ul className="relative mt-10 pl-8 sm:pl-10">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-start justify-between gap-4 py-5 text-left"
                  >
                    <span className="font-[family-name:var(--font-display)] text-xl font-medium leading-snug text-heading md:text-2xl">
                      {displayText(item.question)}
                    </span>
                    <DoodlePlus
                      open={open}
                      className="mt-1 size-5 shrink-0 text-heading"
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm leading-relaxed text-fg/80 md:text-base">
                        {displayText(item.answer)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
