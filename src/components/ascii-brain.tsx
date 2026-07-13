"use client";

import { useEffect, useRef, useState } from "react";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { BrainNerveScrub } from "@/components/brain-nerve-scrub";

// --- ASCII brain tuning (restored from the original hero renderer) ----------
const ASCII_RAMP = " .:-=+*#%@";
const CELL_PX = 9;
const CONTRAST = 1.5;
const BRIGHTNESS = 1.3;
const THRESHOLD = 0.2;
const SCATTER = 0.4;

const INK: [number, number, number] = [10, 12, 16]; // #0a0c10

// ===========================================================================
// BRAIN <-> NERVE CONNECTION — edit these to align the two.
// ---------------------------------------------------------------------------
// The rotating brain and the nerve share ONE pinned viewport. The brain
// assembles first (unchanged). Then, as you keep scrolling into the "nerve
// phase", the assembled brain settles UP and shrinks a little to free room
// below its stem, and the nerve (components/brain-nerve-scrub.tsx) draws from
// there. Tune the brain here; tune the nerve with the NERVE_* constants at the
// top of brain-nerve-scrub.tsx.
//
// BRAIN_REST_SCALE   : brain size once settled (1 = full-size, 0.6 = 60%).
// BRAIN_REST_SHIFT_VH: brain vertical shift once settled, in vh (negative = up).
// NERVE_SCROLL_SVH   : extra scroll length (svh) devoted to the nerve draw,
//                      appended after the 200svh brain section.
export const BRAIN_REST_SCALE = 0.58;
export const BRAIN_REST_SHIFT_VH = -20;
export const NERVE_SCROLL_SVH = 180;
// ===========================================================================

// The hero clip the canvas re-draws during the zoom-out. MUST match whatever
// <Hero> is actually playing, otherwise the handoff at scroll 0 would jump.
const HERO_SRC = "/hero-final.mp4";

// --- one continuous scroll-driven motion (progress 0..1 across #brain) ------
// The whole hero->brain transition is ONE eased zoom-out. These windows carve
// that single progress axis into overlapping, cross-blended phases so every
// scroll position looks intentional:
//   p 0.00 -> full-bleed hero video (real <Hero> shows through the canvas)
//   p ~.06 -> canvas has taken over the hero frame (fast, seamless handoff)
//   p 0->.62 -> video zooms out to a centered rect + edges shred into strips
//   p .32->1 -> ASCII brain assembles from scatter as the strips dissolve
//   p 1.00 -> ASCII brain, fully resolved (final resting state)
const WRAP_IN = 0.0; // canvas crossfades over the real hero this quickly...
const WRAP_FULL = 0.06;
const ZOOM_IN = 0.0; // ...so the zoom-out reads as continuous with the hero
const ZOOM_FULL = 0.62;
const STRIP_FADE_IN = 0.5; // strips start dissolving here...
const STRIP_FADE_FULL = 0.92;
const BRAIN_IN = 0.32; // ASCII assembly starts while strips are still scattering
const BRAIN_FULL = 1.0;

// Zoom-out target: the video shrinks to this fraction of the viewport before it
// fully dissolves into the brain.
const ZOOM_END_SCALE = 0.3;
// Vertical strips the shredding edges break into. Lower this first if heavy.
const STRIPS = 56;
// How far edge strips fly outward (fraction of viewport width) at full zoom.
const EDGE_SCATTER = 0.55;
// Extra outward push per strip brightness (fraction of viewport width).
const BRIGHT_SCATTER = 0.1;

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
  const textRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroRef = useRef<HTMLVideoElement | null>(null); // copy of the hero clip
  const brainRef = useRef<HTMLVideoElement | null>(null); // /brain-hero.mp4
  const heroBufRef = useRef<HTMLCanvasElement | null>(null);
  const brainBufRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  // Eased scroll progress 0..1 for this section, read in the render loop.
  const pRef = useRef(0);
  // Progress 0..1 through the extra "nerve phase" that follows brain assembly.
  const nervePRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isReduced, setIsReduced] = useState(false);
  // Fires the headline's text-generate reveal once the brain scene is
  // actually surfacing (scroll progress), not merely in the DOM viewport.
  const [headlineIn, setHeadlineIn] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Track whether the brain scene is on screen (pause the loop + videos off it).
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

  // Pause both source videos while the scene is off-screen (perf). The hero
  // copy runs at 2x to match the real hero, so the zoom-out handoff stays in
  // sync.
  useEffect(() => {
    const hero = heroRef.current;
    const brain = brainRef.current;
    if (isVisible) {
      if (hero) hero.playbackRate = 2;
      hero?.play().catch(() => undefined);
      brain?.play().catch(() => undefined);
    } else {
      hero?.pause();
      brain?.pause();
    }
  }, [isVisible]);

  // Scroll progress for the pinned section: 0 at top, 1 once fully scrolled.
  // Driven by the existing Lenis smooth scroll (window scroll on the root).
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("brain");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total || 1);
      // Brain assembles over the FIRST viewport of scroll — identical pacing to
      // the original 200svh section (where total was exactly one viewport). The
      // section is now taller only to add scroll room for the nerve phase.
      const assembly = window.innerHeight;
      pRef.current = clamp(scrolled / (assembly || 1), 0, 1);
      // Nerve phase: everything scrolled beyond assembly, normalised 0..1.
      nervePRef.current = clamp((scrolled - assembly) / (total - assembly || 1), 0, 1);
      // Reveal the headline as the brain assembles (idempotent; React bails
      // after the first true).
      if (pRef.current > 0.6) setHeadlineIn(true);
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
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hbuf = (heroBufRef.current ??= document.createElement("canvas"));
    const hbctx = hbuf.getContext("2d", { willReadFrequently: true })!;
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
      const nerveP = nervePRef.current;
      const hero = heroRef.current;
      const brain = brainRef.current;

      // Brain settle: once assembled, ease the brain UP + smaller as the nerve
      // phase begins, freeing room below its stem for the nerve. Identity while
      // p < 1 (hero + assembly untouched); only engages once nerveP > 0.
      const settle = smoothstep(0, 0.16, nerveP);
      const brainScale = 1 - (1 - BRAIN_REST_SCALE) * settle;
      const brainShift = (BRAIN_REST_SHIFT_VH / 100) * cssH * settle;
      canvas.style.transformOrigin = "50% 42%";
      canvas.style.transform = `translateY(${brainShift}px) scale(${brainScale})`;

      // --- wrapper crossfade: real hero shows through -> canvas owns the frame
      // Reduced motion uses a gentle plain crossfade instead of the fast handoff.
      const wrapFade = isReduced
        ? smoothstep(0.05, 0.5, p)
        : smoothstep(WRAP_IN, WRAP_FULL, p);
      if (wrapRef.current) wrapRef.current.style.opacity = String(wrapFade);

      // Thesis labels resolve in with the brain, not during the shred.
      const brainIn = isReduced
        ? smoothstep(0.1, 0.5, p)
        : smoothstep(BRAIN_IN, BRAIN_FULL, p);
      if (textRef.current) textRef.current.style.opacity = String(brainIn);

      // --- ink background -------------------------------------------------
      // Non-reduced: solid ink behind everything (hero strips cover it while
      // full-bleed, then reveal it as they scatter). Reduced: ink itself
      // crossfades in over the real hero as the plain fallback.
      const inkAlpha = isReduced ? smoothstep(0.1, 0.5, p) : 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = inkAlpha;
      ctx.fillStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.globalAlpha = 1;

      // ---------------- hero video: zoom-out + edge shred -----------------
      // Skipped entirely under reduced motion (that path is a pure crossfade).
      const heroReady = !!hero && hero.readyState >= 2 && hero.videoWidth > 0;
      const stripFade = 1 - smoothstep(STRIP_FADE_IN, STRIP_FADE_FULL, p);
      if (!isReduced && heroReady && stripFade > 0.001) {
        // 0 = full-bleed hero, 1 = tiny centered rect (fully dissolved).
        const zoom = easeInOutCubic(smoothstep(ZOOM_IN, ZOOM_FULL, p));

        // Sample per-strip brightness from a tiny STRIPS x HB_H buffer so the
        // displacement can be brightness-weighted without per-pixel work.
        const HB_H = 6;
        if (hbuf.width !== STRIPS || hbuf.height !== HB_H) {
          hbuf.width = STRIPS;
          hbuf.height = HB_H;
        }
        const cover = coverRect(hero!.videoWidth, hero!.videoHeight, cssW, cssH);
        hbctx.setTransform(1, 0, 0, 1, 0, 0);
        hbctx.imageSmoothingEnabled = true;
        hbctx.clearRect(0, 0, STRIPS, HB_H);
        hbctx.drawImage(hero!, cover.sx, cover.sy, cover.sw, cover.sh, 0, 0, STRIPS, HB_H);
        const hd = hbctx.getImageData(0, 0, STRIPS, HB_H).data;

        // Centered destination rectangle the whole frame shrinks toward.
        const s = 1 - (1 - ZOOM_END_SCALE) * zoom;
        const destW = cssW * s;
        const destH = cssH * s;
        const destLeft = (cssW - destW) / 2;
        const destTop = (cssH - destH) / 2;
        const stripDW = destW / STRIPS;
        const stripSW = cover.sw / STRIPS;
        const centerX = cssW / 2;

        ctx.globalCompositeOperation = "source-over";
        for (let i = 0; i < STRIPS; i += 1) {
          // average luminance down this strip column
          let lum = 0;
          for (let yy = 0; yy < HB_H; yy += 1) {
            const idx = (yy * STRIPS + i) * 4;
            lum += (0.2126 * hd[idx] + 0.7152 * hd[idx + 1] + 0.0722 * hd[idx + 2]) / 255;
          }
          lum /= HB_H;

          const baseX = destLeft + i * stripDW;
          const stripCX = baseX + stripDW / 2;
          const distNorm = (stripCX - centerX) / (cssW / 2); // -1..1, edges = +-1

          // Edges fly outward most; brighter strips fly a touch further. All
          // scaled by the same eased zoom so it's one coherent motion.
          const disp =
            distNorm * (EDGE_SCATTER * cssW * 0.5) * zoom +
            Math.sign(distNorm) * lum * (BRIGHT_SCATTER * cssW) * zoom;
          const jitterY = (hash(i, 3.1) - 0.5) * 0.08 * cssH * zoom;

          // Edge strips dissolve a hair sooner than the surviving center.
          const a = stripFade * (1 - 0.45 * Math.abs(distNorm) * zoom);
          if (a <= 0.001) continue;

          const srcX = cover.sx + i * stripSW;
          const drawX = baseX + disp;
          ctx.globalAlpha = a;
          // +0.6 overlaps neighbours so contiguous strips show no seams at p~0.
          ctx.drawImage(
            hero!,
            srcX,
            cover.sy,
            stripSW,
            cover.sh,
            drawX,
            destTop + jitterY,
            stripDW + 0.6,
            destH
          );
        }
        ctx.globalAlpha = 1;
      }

      // ---------------- ASCII brain (scatter -> assembled) ----------------
      const brainReady = !!brain && brain.readyState >= 2 && brain.videoWidth > 0;
      if (brainIn > 0.001 && brainReady) {
        const cols = Math.floor(cssW / CELL_PX);
        const rows = Math.floor(cssH / CELL_PX);
        const BBW = cols * 2;
        const BBH = rows * 2;
        if (bbuf.width !== BBW || bbuf.height !== BBH) {
          bbuf.width = BBW;
          bbuf.height = BBH;
        }
        const { sx, sy, sw, sh } = coverRect(brain!.videoWidth, brain!.videoHeight, BBW, BBH);
        bbctx.setTransform(1, 0, 0, 1, 0, 0);
        bbctx.imageSmoothingEnabled = true;
        bbctx.clearRect(0, 0, BBW, BBH);
        bbctx.drawImage(brain!, sx, sy, sw, sh, 0, 0, BBW, BBH);
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
    // -mt-[100svh] overlaps the hero so the zoom-out plays over the still-
    // playing hero video; the sticky child pins while the scene resolves.
    <section
      id="brain"
      className="relative -mt-[100svh]"
      // 200svh brain (100svh overlap + 100svh assembly) + NERVE_SCROLL_SVH for
      // the nerve draw. Driven by the constant so the two stay in sync.
      style={{ height: `${200 + NERVE_SCROLL_SVH}svh` }}
    >
      <div
        ref={wrapRef}
        className="pointer-events-none sticky top-0 h-[100svh] overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Off-screen copies the canvas samples. Kept in sync by playing the
            same clips as <Hero> / the brain — never shown directly. */}
        <video
          ref={heroRef}
          src={HERO_SRC}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          loop
          playsInline
          preload="auto"
        />
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

        {/* Nerve drawn in the SAME pinned viewport, below the brain stem, so
            brain + nerve read as one organism. Scrubs over the nerve phase. */}
        <BrainNerveScrub />

        {/* Thesis labels overlaid on the brain: big headline bottom-left,
            small labeled paragraph bottom-right (resolve in with the scene). */}
        <div ref={textRef} className="absolute inset-0 flex items-end" style={{ opacity: 0 }}>
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 pb-14 md:pb-20">
            <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-16">
              <TextGenerateEffect
                as="h2"
                words={"Your brain\nquits first"}
                filter={true}
                duration={0.8}
                start={headlineIn}
                className="font-mono-df uppercase leading-[1.05] tracking-[0.02em] text-df-white text-3xl md:text-5xl lg:text-6xl"
              />
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
