"use client";

import CurvedLoop from "@/components/ui/CurvedLoop";

/**
 * Editorial curved marquee between Impact and About —
 * reads like stamped airmail type on the journal page.
 */
export default function MarqueeRibbon() {
  return (
    <section
      aria-label="International Relations themes"
      className="surface-light overflow-hidden border-y border-line py-8 md:py-12"
    >
      {/* Reserve space under the arc — SVG overflow:visible dips below the viewBox */}
      <div className="pb-10 md:pb-14">
        <CurvedLoop
          marqueeText="International Relations"
          separator="✦"
          shape="arc"
          speed={1.4}
          curveAmount={140}
          direction="left"
          fontSize={64}
          fontWeight={500}
          letterSpacing={2}
          outline={false}
          scrollBoost={0.35}
          edgeFade={0.22}
          interactive
          pauseOnHover={false}
          color="var(--heading)"
          separatorColor="var(--cobalt-400)"
          className="font-[family-name:var(--font-display)]"
        />
      </div>
      <p className="sr-only">
        Exchange, research, dual degrees — start from Chennai.
      </p>
      <div className="pt-2 md:pt-4">
        <CurvedLoop
          marqueeText="Exchange  Research  Dual Degrees  Start from Chennai"
          separator="·"
          shape="line"
          speed={1.1}
          curveAmount={0}
          direction="right"
          fontSize={24}
          fontWeight={500}
          letterSpacing={4}
          scrollBoost={0.2}
          edgeFade={0.3}
          interactive={false}
          color="var(--muted)"
          separatorColor="var(--cobalt-300)"
          className="font-[family-name:var(--font-mono)]"
        />
      </div>
    </section>
  );
}
