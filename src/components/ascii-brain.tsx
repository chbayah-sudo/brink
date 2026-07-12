"use client";

import { useEffect, useRef, useState } from "react";

// --- ASCII brain tuning (restored from the original hero renderer) ----------
const ASCII_RAMP = " .:-=+*#%@";
const CELL_PX = 9;
const CONTRAST = 1.5;
const BRIGHTNESS = 1.3;
const THRESHOLD = 0.2;
const SCATTER = 0.4;

const INK: [number, number, number] = [10, 12, 16]; // #0a0c10

// --- scroll-linked handoff windows (progress 0..1 across #brain) ------------
// Wrapper opacity crossfades the whole scene in over the hero video.
const FADE_IN = 0.02;
const FADE_FULL = 0.44;
// Glyph assembly (scatter -> resolved) runs slightly wider than the fade.
const ASSEMBLE_IN = 0.0;
const ASSEMBLE_FULL = 0.52;

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
// Deterministic per-index pseudo-random, stable across frames.
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function getAsciiChar(t: number) {
  const index = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(Math.pow(t, 0.8) * (ASCII_RAMP.length - 1)))
  );
  return ASCII_RAMP[index];
}

// Fit a source video into a destination rect as object-cover, returning the
// source sub-rectangle to sample.
function coverRect(vw: number, vh: number, dw: number, dh: number) {
  const arD = dw / dh;
  const arV = vw / vh;
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;
  if (arV > arD) {
    sw = vh * arD;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / arD;
    sy = (vh - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

export function AsciiBrain() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const brainRef = useRef<HTMLVideoElement | null>(null); // /brain-hero.mp4
  const brainBufRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  // Eased scroll progress 0..1 for this section, read in the render loop.
  const pRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Track whether the brain scene is on screen (pause the loop + video off it).
  useEffect(() => {
    const section = document.getElementById("brain");
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Pause the brain video while the scene is off-screen (perf).
  useEffect(() => {
    const brain = brainRef.current;
    if (!brain) return;
    if (isVisible) {
      brain.play().catch(() => undefined);
    } else {
      brain.pause();
    }
  }, [isVisible]);

  // Scroll progress for the pinned section: 0 at top, 1 once fully scrolled.
  // Driven by the existing Lenis scroll (window scroll on the root scroller).
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("brain");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total || 1);
      pRef.current = total > 0 ? scrolled / total : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const brain = brainRef.current;
    if (!canvas || !brain) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bbuf = (brainBufRef.current ??= document.createElement("canvas"));
    const bbctx = bbuf.getContext("2d", { willReadFrequently: true })!;

    const render = () => {
      frameRef.current = window.requestAnimationFrame(render);
      if (!isVisible) return;

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (!cssW || !cssH) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
      if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const p = pRef.current;

      // --- scroll-linked crossfade: transparent (hero shows through) -> ink ---
      // Reduced motion keeps the same opacity crossfade but skips the scatter.
      const fade = smoothstep(FADE_IN, FADE_FULL, p);
      if (wrapRef.current) wrapRef.current.style.opacity = String(fade);

      const brainIn = smoothstep(ASSEMBLE_IN, ASSEMBLE_FULL, p);

      // Ink background fills the whole canvas; the wrapper opacity does the
      // crossfade over the still-playing hero video underneath.
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`;
      ctx.fillRect(0, 0, cssW, cssH);

      // ---------------- ASCII brain (scatter -> assembled) ----------------
      const brainReady = brain.readyState >= 2 && brain.videoWidth > 0;
      if (brainIn > 0.001 && brainReady) {
        const cols = Math.floor(cssW / CELL_PX);
        const rows = Math.floor(cssH / CELL_PX);
        const BBW = cols * 2;
        const BBH = rows * 2;
        if (bbuf.width !== BBW || bbuf.height !== BBH) {
          bbuf.width = BBW;
          bbuf.height = BBH;
        }
        const { sx, sy, sw, sh } = coverRect(brain.videoWidth, brain.videoHeight, BBW, BBH);
        bbctx.setTransform(1, 0, 0, 1, 0, 0);
        bbctx.imageSmoothingEnabled = true;
        bbctx.clearRect(0, 0, BBW, BBH);
        bbctx.drawImage(brain, sx, sy, sw, sh, 0, 0, BBW, BBH);
        const bd = bbctx.getImageData(0, 0, BBW, BBH).data;

        const cellW = cssW / cols;
        const cellH = cssH / rows;
        const fontSize = Math.max(7, cellH * 1.05);
        ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.globalCompositeOperation = "source-over";

        const assembly = isReduced ? 1 : easeInOutCubic(brainIn);
        const scatterPx = SCATTER * Math.min(cssW, cssH) * (1 - assembly);

        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            // brightest of the cell's 2x2 block so thin filaments survive
            let lum = 0;
            for (let dyy = 0; dyy < 2; dyy += 1) {
              for (let dxx = 0; dxx < 2; dxx += 1) {
                const bx = Math.min(BBW - 1, col * 2 + dxx);
                const by = Math.min(BBH - 1, row * 2 + dyy);
                const i = (by * BBW + bx) * 4;
                const l =
                  (0.2126 * bd[i] + 0.7152 * bd[i + 1] + 0.0722 * bd[i + 2]) / 255;
                if (l > lum) lum = l;
              }
            }
            const adjusted = Math.min(1, Math.max(0, (lum - 0.5) * CONTRAST + 0.5) * BRIGHTNESS);
            if (adjusted <= THRESHOLD) continue;
            const t = (adjusted - THRESHOLD) / (1 - THRESHOLD);

            const h1 = hash(col, row);
            const h2 = hash(col + 41.7, row + 17.3);
            const angle = h1 * Math.PI * 2;
            const dist = (0.35 + 0.65 * h2) * scatterPx;
            const cx = (col + 0.5) * cellW;
            const cy = (row + 0.5) * cellH;
            const drawX = cx + Math.cos(angle) * dist;
            const drawY = cy + Math.sin(angle) * dist;

            const reveal = Math.min(1, Math.max(0, (assembly - h2 * 0.55) / 0.45));
            if (reveal <= 0) continue;

            const color =
              adjusted > 0.6 ? "#e8e4d8" : adjusted > 0.38 ? "#a8a5a0" : "#7c7a76";
            ctx.fillStyle = color;
            ctx.globalAlpha = (0.4 + t * 0.6) * reveal * brainIn;
            ctx.fillText(getAsciiChar(t), drawX, drawY);
          }
        }
        ctx.globalAlpha = 1;
      }
    };

    frameRef.current = window.requestAnimationFrame(render);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isVisible, isReduced]);

  return (
    // -mt-[100svh] overlaps the hero so the crossfade plays over the still-
    // playing hero video; the sticky child pins while the scene resolves.
    <section id="brain" className="relative h-[200svh] -mt-[100svh]">
      <div
        ref={wrapRef}
        className="pointer-events-none sticky top-0 h-[100svh] overflow-hidden"
        style={{ opacity: 0 }}
      >
        <video
          ref={brainRef}
          src="/brain-hero.mp4"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          loop
          playsInline
          preload="auto"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* Thesis labels overlaid on the brain: big headline bottom-left,
            small labeled paragraph bottom-right (fades in with the scene). */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 pb-14 md:pb-20">
            <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-16">
              <h2 className="font-mono-df uppercase leading-[1.05] tracking-[0.02em] text-df-white text-3xl md:text-5xl lg:text-6xl">
                Your brain
                <br />
                quits first
              </h2>
              <div className="max-w-[22rem] md:pb-1.5">
                <p className="font-mono-df text-df-gray text-sm md:text-[15px] leading-[1.5]">
                  <span className="text-df-orange">&bull;</span> Fatigue is a
                  decision, not a limit. Your prefrontal cortex calls it before
                  your body is actually done. Brink reads that signal — and hands
                  the reserve back.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
