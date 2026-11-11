"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "#about", label: "About" },
  { href: "#partners", label: "Partners" },
  { href: "#programs", label: "Programs" },
  { href: "#events", label: "Events" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // One listener for the component's lifetime, batched to one check per frame
  useEffect(() => {
    lastY.current = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 24) setHidden(false);
      else if (delta > 6 && !openRef.current) setHidden(true);
      else if (delta < -6) setHidden(false);
      lastY.current = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-hairline bg-paper/95 transition-transform duration-300 ease-out will-change-transform ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight text-ink"
        >
          IR{" "}
          <span className="font-[family-name:var(--font-inter)] text-sm font-normal text-graphite">
            VIT Chennai
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-[family-name:var(--font-inter)] text-sm text-ink ink-underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="inline-flex items-center justify-center p-2 text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </nav>

      {/* Always mounted so it can slide open/closed instead of popping */}
      <div
        id="mobile-menu"
        className={`grid border-hairline bg-paper transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr]"
        }`}
        inert={!open}
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col gap-3 px-5 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-2 font-[family-name:var(--font-inter)] text-base text-ink"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
