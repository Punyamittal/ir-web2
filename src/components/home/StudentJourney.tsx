"use client";

import { journeyContent } from "@/data/home";
import { displayText } from "@/lib/display-text";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { DoodlePlaneGlyph } from "./doodles";
import SectionHeading from "./SectionHeading";
import { Reveal } from "./Reveal";

/** Shared route — plane and dashed line use this exact path */
const PATH =
  "M40 120 C 160 40, 280 200, 420 100 S 700 40, 900 130 S 1100 220, 1160 100";

/** Stop positions along the path (0–1), matched to journey steps */
const STOP_T = [0.04, 0.2, 0.38, 0.55, 0.74, 0.92];

const pathLengths = new WeakMap<SVGPathElement, number>();

function samplePath(
  path: SVGPathElement,
  t: number,
): { x: number; y: number; angle: number } {
  let len = pathLengths.get(path);
  if (len === undefined) {
    len = path.getTotalLength();
    pathLengths.set(path, len);
  }
  const d = Math.max(0, Math.min(1, t)) * len;
  const p = path.getPointAtLength(d);
  const p2 = path.getPointAtLength(Math.min(len, d + 1.5));
  const angle = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI;
  return { x: p.x, y: p.y, angle };
}

export default function StudentJourney() {
  const { eyebrow, heading, steps } = journeyContent;
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 35%"],
  });

  const [stops, setStops] = useState(
    STOP_T.map((t) => ({ x: 0, y: 0, t })),
  );

  // Stops live in viewBox units, so they never change with the window size: measure once.
  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    setStops(
      STOP_T.map((t) => {
        const s = samplePath(path, t);
        return { x: s.x, y: s.y, t };
      }),
    );
  }, []);

  return (
    <section
      id="journey"
      ref={ref}
      className="surface-light alt py-16 md:py-24"
      data-alt
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            heading={[heading[0], heading[1].replace(/\.$/, "")]}
            align="center"
          />
        </Reveal>

        <div className="relative mt-16 hidden md:block">
          <svg
            viewBox="0 0 1200 260"
            className="h-auto w-full overflow-visible text-illustration"
            aria-hidden
          >
            {/* Ghost full route */}
            <path
              d={PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="5 7"
              strokeLinecap="round"
              opacity={0.22}
            />
            {/* Drawn route (same stroke language as the plane) */}
            <motion.path
              ref={pathRef}
              d={PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="5 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                pathLength: reduce ? 1 : scrollYProgress,
              }}
            />

            {steps.map((step, i) => {
              const s = stops[i];
              if (!s?.x) return null;
              return (
                <g key={step.id}>
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r="11"
                    fill="var(--bg)"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <text
                    x={s.x}
                    y={s.y + 4}
                    textAnchor="middle"
                    fill="var(--heading)"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </text>
                </g>
              );
            })}

            {!reduce && (
              <PlaneOnPath pathRef={pathRef} progress={scrollYProgress} />
            )}
          </svg>

          <ol className="mt-4 grid grid-cols-6 gap-3">
            {steps.map((step) => (
              <li key={step.id} className="text-center">
                <p className="font-[family-name:var(--font-display)] text-base font-medium text-heading">
                  {step.title}
                </p>
                <p className="mt-2 font-[family-name:var(--font-script)] text-lg leading-snug text-fg">
                  {displayText(step.description)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <ol className="relative mt-12 space-y-8 border-l border-dashed border-line-strong pl-6 md:hidden">
          {steps.map((step, i) => (
            <li key={step.id} className="relative">
              <span className="absolute top-0 -left-[1.85rem] flex size-6 items-center justify-center rounded-full border border-line-strong bg-bg font-[family-name:var(--font-mono)] text-[10px] text-heading">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-heading">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-fg">
                {displayText(step.description)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PlaneOnPath({
  pathRef,
  progress,
}: {
  pathRef: React.RefObject<SVGPathElement | null>;
  progress: MotionValue<number>;
}) {
  const planeRef = useRef<SVGGElement>(null);
  const opacity = useTransform(progress, [0, 0.02, 0.98, 1], [0, 1, 1, 0.85]);

  // Written straight to the DOM: re-rendering React on every scroll frame made the plane stutter.
  const update = (t: number) => {
    const path = pathRef.current;
    const plane = planeRef.current;
    if (!path || !plane) return;
    const pose = samplePath(path, t);
    plane.setAttribute(
      "transform",
      `translate(${pose.x} ${pose.y}) rotate(${pose.angle}) translate(-10 -20) scale(0.9)`,
    );
  };

  useLayoutEffect(() => {
    update(progress.get());
  });

  useMotionValueEvent(progress, "change", update);

  return (
    <motion.g style={{ opacity }}>
      <g ref={planeRef} transform="translate(40 120) translate(-10 -20) scale(0.9)">
        <DoodlePlaneGlyph trail={false} />
      </g>
    </motion.g>
  );
}
