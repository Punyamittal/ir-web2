"use client";

import Image from "next/image";
import Link from "next/link";

const primaryLinks = [
  { href: "#about", label: "About" },
  { href: "#partners", label: "Partners" },
  { href: "#programs", label: "Programs" },
  { href: "#journey", label: "Journey" },
  { href: "#stories", label: "Stories" },
  { href: "#events", label: "Events" },
  { href: "#faq", label: "FAQ" },
];

const socials = [
  { href: "#", label: "Instagram" },
  { href: "#", label: "LinkedIn" },
  { href: "#", label: "YouTube" },
  { href: "mailto:ir.office@vit.ac.in", label: "Email" },
];

type FooterProps = {
  logoSrc?: string;
  teamName?: string;
  className?: string;
};

/**
 * Engraved gateway + surface-blue contact band (matches image edge).
 */
export default function Footer({
  teamName = "IR Studio",
  className = "",
}: FooterProps) {
  return (
    <footer
      id="contact"
      className={`relative overflow-hidden bg-white ${className}`}
    >
      <div className="relative w-full leading-none">
        <Image
          src="/engraved-vit-chennai-gateway.png"
          alt="Engraved illustration of the VIT Chennai campus gateway"
          width={2172}
          height={724}
          className="h-auto w-full select-none"
          sizes="100vw"
          priority={false}
        />
      </div>

      <div className="surface-blue relative">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] md:items-start md:gap-x-12 lg:gap-x-20">
            <div className="min-w-0">
              <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.01em] text-heading">
                <span className="block">Wherever you land,</span>
                <span className="block italic">start from Chennai</span>
              </h2>

              <p className="mt-6 max-w-[34rem] text-base leading-[1.65] text-fg/80 sm:text-[1.05rem] sm:leading-[1.7]">
                Exchanges, dual degrees, research visits and inbound arrivals —
                one desk for every chapter abroad.
              </p>

              <nav
                aria-label="Footer"
                className="mt-8 border-t border-line pt-5"
              >
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-2.5 sm:gap-x-6">
                  {primaryLinks.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="font-[family-name:var(--font-inter)] text-sm text-fg underline-offset-4 hover:underline focus-visible:underline"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="min-w-0 md:justify-self-end md:pt-1 lg:max-w-[17.5rem] lg:pr-2">
              <address className="not-italic font-[family-name:var(--font-mono)] text-[11px] uppercase leading-[1.75] tracking-[0.06em] text-fg-muted">
                <p className="whitespace-nowrap text-fg">
                  Vandalur–Kelambakkam Road
                </p>
                <p className="whitespace-nowrap">
                  Chennai 600127 · Tamil Nadu · India
                </p>
                <p className="mt-4 normal-case tracking-normal">
                  <a
                    href="mailto:ir.office@vit.ac.in"
                    className="text-fg underline underline-offset-4 decoration-line hover:decoration-fg focus-visible:decoration-fg"
                  >
                    ir.office@vit.ac.in
                  </a>
                </p>
                <p className="mt-1.5">
                  <a
                    href="tel:+914439931555"
                    className="text-fg-muted hover:text-fg focus-visible:text-fg"
                  >
                    +91 44 3993 1555
                  </a>
                </p>
                <p className="mt-1.5 whitespace-nowrap">
                  Mon–Fri · 09:00–17:00 IST
                </p>
              </address>

              <ul
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-dashed border-line pt-4 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em]"
                aria-label="Social links"
              >
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="text-fg underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-line pt-5 sm:mt-14 sm:pt-6">
            <div className="flex flex-col gap-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="min-w-0">
                © 2026 VIT Chennai — Office of International Relations
              </p>
              <p className="min-w-0 shrink-0 sm:text-right">
                Journal set by{" "}
                <span className="text-fg underline decoration-line underline-offset-4">
                  {teamName}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
