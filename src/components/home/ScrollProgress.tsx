"use client";

import { chapters } from "@/data/home";
import { useEffect, useRef, useState } from "react";

type ChapterId = (typeof chapters)[number]["id"];

/**
 * Desktop chapter rail — switches to white track over surface-blue sections.
 *
 * Scroll work is batched into one requestAnimationFrame per frame. The fill bar is
 * driven directly through a ref (transform), so scrolling does not re-render React;
 * state only changes when the active chapter, visibility or surface colour changes.
 */
export default function ScrollProgress() {
  const [active, setActive] = useState<ChapterId>("about");
  const [visible, setVisible] = useState(false);
  const [onBlue, setOnBlue] = useState(false);
  const fillRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = doc.scrollHeight - vh;
      progressRef.current = max > 0 ? Math.min(1, y / max) : 0;
      if (fillRef.current)
        fillRef.current.style.transform = `scaleY(${progressRef.current})`;

      const hero = document.getElementById("hero");
      const footer = document.querySelector("footer");
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight - 80 : vh;
      const footerTop = footer
        ? footer.getBoundingClientRect().top + y
        : doc.scrollHeight;
      setVisible(y > heroBottom * 0.55 && y + vh < footerTop + 40);

      let current: ChapterId = chapters[0].id;
      let blue = false;
      for (const ch of chapters) {
        const el = document.getElementById(ch.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= vh * 0.35) {
          current = ch.id;
          blue = el.classList.contains("surface-blue");
        }
      }
      // Impact strip (no chapter id) — check mid viewport
      const mid = document.elementFromPoint(80, vh * 0.45);
      const surface = mid?.closest(".surface-blue, .surface-light");
      if (surface?.classList.contains("surface-blue")) blue = true;
      if (surface?.classList.contains("surface-light")) blue = false;

      setActive(current);
      setOnBlue(blue);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const track = onBlue ? "bg-white/25" : "bg-cobalt-100";
  const fill = onBlue ? "bg-white" : "bg-cobalt-700";
  const dotBorder = onBlue ? "border-white" : "border-cobalt-700";
  const chip = onBlue
    ? "border-white/40 bg-cobalt-700 text-white"
    : "border-cobalt-100 bg-white text-cobalt-700";

  // Kept mounted and faded (instead of unmounting) so it eases in and out
  return (
    <aside
      aria-label="Page chapters"
      aria-hidden={!visible}
      className={`fixed top-1/2 left-5 z-40 hidden h-[min(62vh,480px)] w-10 -translate-y-1/2 transition-opacity duration-300 xl:block ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className={`relative mx-auto h-full w-px transition-colors duration-300 ${track}`}>
        <div
          ref={fillRef}
          className={`absolute inset-0 w-px origin-top transition-colors duration-300 will-change-transform ${fill}`}
          // constant initial value: React never rewrites it, the scroll handler owns it
          style={{ transform: "scaleY(0)" }}
        />
        <ul className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {chapters.map((ch) => {
            const isActive = active === ch.id;
            return (
              <li key={ch.id} className="relative flex justify-center">
                <a
                  href={`#${ch.id}`}
                  tabIndex={visible ? undefined : -1}
                  className={`group absolute left-0 flex -translate-x-1/2 items-center gap-2 ${
                    visible ? "pointer-events-auto" : ""
                  }`}
                  title={`Chapter ${ch.label}: ${ch.title}`}
                >
                  <span
                    className={`block size-2 rounded-full border transition ${dotBorder} ${
                      isActive ? fill : onBlue ? "bg-cobalt-700" : "bg-white"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] transition ${chip} ${
                      isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                    }`}
                  >
                    Ch. {ch.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
