"use client";

import { aboutContent } from "@/data/home";
import { displayText } from "@/lib/display-text";
import SectionHeading from "./SectionHeading";
import { Reveal, StampIn } from "./Reveal";

export default function About() {
  const { eyebrow, heading, paragraphs, pillars, director } = aboutContent;
  const p0 = displayText(paragraphs[0]);
  const drop = p0.charAt(0);
  const rest = p0.slice(1);

  return (
    <section id="about" className="surface-light py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            heading={[heading[0], heading[1].replace(/\.$/, "")]}
            align="left"
          />
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="font-[family-name:var(--font-inter)] text-base leading-[1.7] text-fg md:text-lg">
                <span className="float-left mr-3 font-[family-name:var(--font-display)] text-6xl font-medium leading-none text-heading md:text-7xl">
                  {drop}
                </span>
                {rest}
              </p>
              <p className="mt-6 font-[family-name:var(--font-inter)] text-base leading-[1.7] text-fg md:text-lg">
                {displayText(paragraphs[1])}
              </p>
            </Reveal>

            <ol className="mt-12 border-t border-line-strong/80">
              {pillars.map((p, i) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-line py-5"
                >
                  <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-xl font-medium text-heading">
                      {p.title}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {displayText(p.description)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-5 lg:pt-4">
            <StampIn>
              <figure className="relative rotate-[-1.5deg] border border-line bg-card-alt p-6 shadow-none sm:p-8">
                <div
                  aria-hidden
                  className="absolute -top-2 right-0 left-0 h-3"
                  style={{
                    background:
                      "radial-gradient(circle at 8px 0, transparent 6px, var(--card-alt) 6.5px) repeat-x",
                    backgroundSize: "16px 12px",
                  }}
                />
                <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                  Message from the Director
                </p>
                <blockquote className="mt-5 font-[family-name:var(--font-display)] text-xl leading-snug text-heading md:text-2xl">
                  “{displayText(director.quote)}”
                </blockquote>
                <figcaption className="mt-10">
                  <p className="font-[family-name:var(--font-script)] text-3xl text-heading">
                    {director.name.replace(/^Sample Director Name$/, "A. Director")}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {displayText(director.title)}
                  </p>
                </figcaption>

                <div
                  aria-hidden
                  className="absolute -right-2 bottom-6 rotate-[-12deg] rounded-full border-2 border-line-strong bg-accent px-3 py-4 text-center font-[family-name:var(--font-mono)] text-[9px] uppercase leading-tight tracking-[0.12em] text-on-accent opacity-90"
                >
                  IR Office
                  <br />
                  VIT Chennai
                </div>
              </figure>
            </StampIn>
          </div>
        </div>
      </div>
    </section>
  );
}
