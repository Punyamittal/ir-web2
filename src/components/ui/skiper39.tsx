"use client";

import React, { useEffect, useRef } from "react";

// gsap is imported lazily inside the effect so it stays out of the first-load bundle;
// the hero headline is server-rendered and doesn't need it.
type Gsap = typeof import("gsap").gsap;

interface CrowdCanvasProps {
  src: string;
  rows?: number;
  cols?: number;
}

type Stage = { width: number; height: number };
type WalkProps = { startX: number; startY: number; endX: number };
type Peep = {
  image: HTMLImageElement;
  rect: number[];
  width: number;
  height: number;
  x: number;
  y: number;
  anchorY: number;
  scaleX: number;
  walk: gsap.core.Timeline | null;
  setRect: (rect: number[]) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
};

const CrowdCanvas = ({ src, rows = 15, cols = 7 }: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const start = (gsap: Gsap) => {
      const config = {
        src,
        rows,
        cols,
      };
      const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
        false;
      // Sharp enough on retina, without 3x/4x canvases on high-DPR phones
      const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

      // UTILS
      const randomRange = (min: number, max: number) =>
        min + Math.random() * (max - min);
      const randomIndex = <T,>(array: T[]) => randomRange(0, array.length) | 0;
      const removeFromArray = <T,>(array: T[], i: number) =>
        array.splice(i, 1)[0];
      const removeItemFromArray = <T,>(array: T[], item: T) =>
        removeFromArray(array, array.indexOf(item));
      const removeRandomFromArray = <T,>(array: T[]) =>
        removeFromArray(array, randomIndex(array));
      const getRandomFromArray = <T,>(array: T[]) =>
        array[randomIndex(array) | 0];

      // TWEEN FACTORIES
      const resetPeep = ({
        stage,
        peep,
      }: {
        stage: Stage;
        peep: Peep;
      }): WalkProps => {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const offsetY = 100 - 250 * gsap.parseEase("power2.in")(Math.random());
        const startY = stage.height - peep.height + offsetY;
        let startX: number;
        let endX: number;

        if (direction === 1) {
          startX = -peep.width;
          endX = stage.width;
          peep.scaleX = 1;
        } else {
          startX = stage.width + peep.width;
          endX = 0;
          peep.scaleX = -1;
        }

        peep.x = startX;
        peep.y = startY;
        peep.anchorY = startY;

        return {
          startX,
          startY,
          endX,
        };
      };

      const normalWalk = ({
        peep,
        props,
      }: {
        peep: Peep;
        props: WalkProps;
      }) => {
        const { startY, endX } = props;
        const xDuration = 10;
        const yDuration = 0.25;

        const tl = gsap.timeline();
        tl.timeScale(randomRange(0.5, 1.5));
        tl.to(
          peep,
          {
            duration: xDuration,
            x: endX,
            ease: "none",
          },
          0,
        );
        tl.to(
          peep,
          {
            duration: yDuration,
            repeat: xDuration / yDuration,
            yoyo: true,
            y: startY - 10,
          },
          0,
        );

        return tl;
      };

      const walks = [normalWalk];

      // FACTORY FUNCTIONS
      const createPeep = ({
        image,
        rect,
      }: {
        image: HTMLImageElement;
        rect: number[];
      }): Peep => {
        const peep: Peep = {
          image,
          rect: [],
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          anchorY: 0,
          scaleX: 1,
          walk: null,
          setRect: (rect: number[]) => {
            peep.rect = rect;
            peep.width = rect[2];
            peep.height = rect[3];
          },
          render: (ctx: CanvasRenderingContext2D) => {
            ctx.save();
            ctx.translate(peep.x, peep.y);
            ctx.scale(peep.scaleX, 1);
            ctx.drawImage(
              peep.image,
              peep.rect[0],
              peep.rect[1],
              peep.rect[2],
              peep.rect[3],
              0,
              0,
              peep.width,
              peep.height,
            );
            ctx.restore();
          },
        };

        peep.setRect(rect);
        return peep;
      };

      // MAIN
      const img = document.createElement("img");
      const stage: Stage = {
        width: 0,
        height: 0,
      };
      let ready = false;
      let running = false;
      let onScreen = true;
      let disposed = false;

      const allPeeps: Peep[] = [];
      const availablePeeps: Peep[] = [];
      const crowd: Peep[] = [];

      const createPeeps = () => {
        const { rows, cols } = config;
        const { naturalWidth: width, naturalHeight: height } = img;
        const total = rows * cols;
        const rectWidth = width / rows;
        const rectHeight = height / cols;

        for (let i = 0; i < total; i++) {
          allPeeps.push(
            createPeep({
              image: img,
              rect: [
                (i % rows) * rectWidth,
                ((i / rows) | 0) * rectHeight,
                rectWidth,
                rectHeight,
              ],
            }),
          );
        }
      };

      const initCrowd = () => {
        while (availablePeeps.length) {
          addPeepToCrowd().walk?.progress(Math.random());
        }
      };

      const addPeepToCrowd = () => {
        const peep = removeRandomFromArray(availablePeeps);
        const walk = getRandomFromArray(walks)({
          peep,
          props: resetPeep({
            peep,
            stage,
          }),
        });
        walk.eventCallback("onComplete", () => {
          removePeepFromCrowd(peep);
          addPeepToCrowd();
        });
        if (!running) walk.pause();

        peep.walk = walk;

        crowd.push(peep);
        crowd.sort((a, b) => a.anchorY - b.anchorY);

        return peep;
      };

      const removePeepFromCrowd = (peep: Peep) => {
        removeItemFromArray(crowd, peep);
        availablePeeps.push(peep);
      };

      const render = () => {
        if (!canvas) return;
        const scale = dpr();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);

        crowd.forEach((peep) => {
          peep.render(ctx);
        });

        ctx.restore();
      };

      const resize = () => {
        if (!canvas) return;
        stage.width = canvas.clientWidth;
        stage.height = canvas.clientHeight;
        canvas.width = stage.width * dpr();
        canvas.height = stage.height * dpr();

        crowd.forEach((peep) => {
          peep.walk?.kill();
        });

        crowd.length = 0;
        availablePeeps.length = 0;
        availablePeeps.push(...allPeeps);

        initCrowd();
        render();
      };

      // Only animate while the hero is on screen and the tab is visible — otherwise the
      // ticker kept redrawing ~100 sprites every frame for the whole visit.
      const setRunning = (next: boolean) => {
        if (!ready || reduceMotion || next === running) return;
        running = next;
        if (next) {
          crowd.forEach((peep) => peep.walk?.resume());
          gsap.ticker.add(render);
        } else {
          gsap.ticker.remove(render);
          crowd.forEach((peep) => peep.walk?.pause());
        }
      };
      const sync = () => setRunning(onScreen && !document.hidden);

      const init = () => {
        if (disposed) return;
        createPeeps();
        resize();
        ready = true;
        if (reduceMotion) {
          // A still crowd: one frame, no ticker
          crowd.forEach((peep) => peep.walk?.pause());
          render();
          return;
        }
        sync();
      };

      img.onload = init;
      img.src = config.src;

      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      io.observe(canvas);
      document.addEventListener("visibilitychange", sync);

      // Mobile browsers fire resize when the address bar shows/hides; rebuilding the crowd
      // then made everyone teleport mid-scroll. Rebuild only when the canvas size really changed.
      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (!ready) return;
          if (
            canvas.clientWidth === stage.width &&
            canvas.clientHeight === stage.height
          )
            return;
          resize();
        }, 150);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        disposed = true;
        clearTimeout(resizeTimer);
        io.disconnect();
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener("resize", handleResize);
        gsap.ticker.remove(render);
        img.onload = null;
        crowd.forEach((peep) => {
          peep.walk?.kill();
        });
      };
    };

    let teardown: (() => void) | undefined;
    let cancelled = false;
    void import("gsap").then(({ gsap }) => {
      if (!cancelled) teardown = start(gsap);
    });
    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [src, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute bottom-0 h-[90vh] w-full supports-[height:100svh]:h-[90svh]"
    />
  );
};

const Skiper39 = () => {
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper text-ink">
      {/* Soft fade so the headline stays readable above the walking figures */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[55%] bg-gradient-to-b from-paper via-paper/90 to-transparent"
      />

      <div className="absolute left-1/2 top-[28%] z-10 w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="mb-3 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.2em] text-graphite sm:text-xs">
          VIT Chennai
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.25rem,6vw,4.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
          International Relations
        </h1>
      </div>

      <div className="absolute bottom-0 z-0 h-full w-screen">
        <CrowdCanvas
          src="https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png"
          rows={15}
          cols={7}
        />
      </div>
    </div>
  );
};

export { CrowdCanvas, Skiper39 };
export default Skiper39;

/**
 * Skiper 39 Canvas_Landing_004 — React + Canvas
 * Inspired by and adapted from https://codepen.io/zadvorsky/pen/xxwbBQV
 * illustration by https://www.openpeeps.com/
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 * These animations aren’t associated with the codepen.io . They’re independent recreations meant to study interaction design
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 */
