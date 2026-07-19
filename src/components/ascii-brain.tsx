"use client";

import { useEffect, useRef, useState } from "react";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { NerveSignals } from "@/components/nerve-signals";

// --- ASCII brain tuning (restored from the original hero renderer) ----------
const ASCII_RAMP = " .:-=+*#%@";
const CELL_PX = 9;
const CONTRAST = 1.5;
const BRIGHTNESS = 1.3;
const THRESHOLD = 0.2;
const SCATTER = 0.4;

const INK: [number, number, number] = [10, 12, 16]; // #0a0c10

// --- hover "neural probe" lens ----------------------------------------------
// Cursor interaction over the glyph grid: a radius around the pointer deposits
// "heat" (painted along the pointer's path, so fast swipes leave an unbroken
// comet stroke) which decays exponentially into an afterglow trail. Heated
// glyphs recolor gray -> amber -> near-white core, brighten, and scramble-
// flicker through SCRAMBLE; heat also reveals a faint latent lattice in cells
// the brain leaves empty. Pointerdown fires an expanding ring pulse that
// ignites glyphs as it sweeps. Reduced motion keeps the color highlight but
// drops the flicker, pulses and reticle spin.
const LENS_RADIUS_FRAC = 0.11; // lens radius as a fraction of min(vw, vh)
const LENS_MIN_R = 88; // px floor so the lens stays usable on small screens
const HEAT_DECAY = 3.4; // 1/s exponential decay of the afterglow
const SCRAMBLE = "!<>-_\\/[]{}=+*^?#$%&01";
const ACCENT: [number, number, number] = [255, 91, 58]; // --df-orange
const ACCENT_HOT: [number, number, number] = [255, 238, 226]; // lens core
const PULSE_SPEED = 950; // px/s ring expansion on click/tap
const PULSE_BAND = 90; // px half-thickness of the igniting ring
const PULSE_LIFE = 1.15; // s until a pulse dies out
// base glyph color tiers as rgb (the string ternary's values, lerp-able)
const TIER_HI: [number, number, number] = [232, 228, 216]; // #e8e4d8
const TIER_MID: [number, number, number] = [168, 165, 160]; // #a8a5a0
const TIER_LO: [number, number, number] = [124, 122, 118]; // #7c7a76

// ===========================================================================
// BRAIN -> NERVE — now a SINGLE combined asset (public/brain-nerve.mp4).
// ---------------------------------------------------------------------------
// The clip itself is the whole handoff: it opens on a full glowing brain, then
// the brain drains downward and pours into a vertical nerve/spine strand. We no
// longer merge a brain video with a separately-drawn nerve — the ASCII engine
// just scrubs this one clip by scroll.
//
// Two scroll phases share ONE pinned viewport:
//   assembly phase (p 0..1)      : the hero zoom-out shreds away and the ASCII
//                                  brain assembles from scatter. The clip is
//                                  held on frame 0 (full brain) the whole time.
//   morph phase   (morphP 0..1)  : the clip's playhead scrubs 0 -> end, so the
//                                  assembled ASCII brain drains into the nerve
//                                  exactly as you scroll.
//
// MORPH_SCROLL_SVH : extra scroll length (svh) devoted to the brain->nerve
//                    scrub, appended after the 200svh brain section. Bigger =
//                    the morph plays out more slowly as you scroll.
const MORPH_SCROLL_SVH = 360;
// The combined brain -> nerve clip the ASCII engine samples + scrubs.
const BRAIN_NERVE_SRC = "/brain-nerve.mp4";
// Seconds of the clip's head that are still a full brain (before the morph
// begins ~0.9s in). The morph clip sits paused at BRAIN_IDLE_END (still a full
// side-view brain) while idle so the scroll scrub can run from there to the end
// (the morph proper) — and so the crossfade from the spin clip lands on a
// matching frame.
const BRAIN_IDLE_END = 0.85;

// Idle 360: a separate spin clip (seamless ping-pong of a real rotating brain)
// autoplay-loops while parked on the brain, giving a genuine turn. When you
// scroll, it crossfades into the morph clip (BRAIN_NERVE_SRC) over the first
// sliver of scroll (HANDOFF window) and the morph scrub takes over.
const SPIN_SRC = "/brain-360.mp4";
const SPIN_HANDOFF = 0.12; // morphP over which spin -> morph crossfade completes
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroRef = useRef<HTMLVideoElement | null>(null); // copy of the hero clip
  const brainRef = useRef<HTMLVideoElement | null>(null); // /brain-nerve.mp4 (scrubbed)
  const spinRef = useRef<HTMLVideoElement | null>(null); // /brain-360.mp4 (idle spin)
  const heroBufRef = useRef<HTMLCanvasElement | null>(null);
  const brainBufRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  // Eased scroll progress 0..1 for this section, read in the render loop.
  const pRef = useRef(0);
  // Progress 0..1 through the brain->nerve scrub that follows brain assembly.
  const morphPRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isReduced, setIsReduced] = useState(false);
  // Fires the headline's text-generate reveal once the brain scene is
  // actually surfacing (scroll progress), not merely in the DOM viewport.
  const [headlineIn, setHeadlineIn] = useState(false);

  // --- neural probe lens state (client coords; converted per frame) ---------
  const pointerRef = useRef({ x: -1e4, y: -1e4, px: -1e4, py: -1e4, active: false });
  const heatRef = useRef({ arr: new Float32Array(0), cols: 0, rows: 0 });
  const pulsesRef = useRef<{ x: number; y: number; t0: number }[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Neural probe lens: window-level pointer tracking. The pinned wrapper is
  // pointer-events-none, so the lens listens globally and converts client
  // coords to canvas space inside the render loop.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pt = pointerRef.current;
      pt.x = e.clientX;
      pt.y = e.clientY;
      pt.active = true;
    };
    const onDown = (e: PointerEvent) => {
      const pulses = pulsesRef.current;
      pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      if (pulses.length > 6) pulses.shift();
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
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

  // Hero copy autoplays (at 2x, to match the real hero) so the zoom-out shred
  // stays in sync. The brain->nerve clip is NEVER played — it is scrubbed by
  // scroll in the render loop — so we only pause it when off-screen.
  useEffect(() => {
    const hero = heroRef.current;
    const brain = brainRef.current;
    const spin = spinRef.current;
    if (isVisible) {
      if (hero) hero.playbackRate = 2;
      hero?.play().catch(() => undefined);
      // The spin clip drives the idle rotation; the render loop starts/stops it
      // per scroll, but kick it off here so it's already running when parked.
      spin?.play().catch(() => undefined);
    } else {
      hero?.pause();
      brain?.pause();
      spin?.pause();
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
      // section is now taller only to add scroll room for the nerve morph.
      const assembly = window.innerHeight;
      pRef.current = clamp(scrolled / (assembly || 1), 0, 1);
      // Morph phase: everything scrolled beyond assembly, normalised 0..1. This
      // is the value the brain->nerve clip's playhead is scrubbed against.
      morphPRef.current = clamp((scrolled - assembly) / (total - assembly || 1), 0, 1);
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

    let lastNow = 0;
    const render = (now: number) => {
      frameRef.current = window.requestAnimationFrame(render);
      if (!isVisible) return;
      // dt for the lens heat decay (clamped so tab-switches don't jump it)
      const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
      lastNow = now;

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (!cssW || !cssH) return;

      // 1.5 (not 2) — ASCII glyphs stay crisp enough on retina and the canvas
      // rasterizes ~2x fewer pixels per frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
      if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const p = pRef.current;
      const morphP = morphPRef.current;
      const hero = heroRef.current;
      const brain = brainRef.current;
      const spin = spinRef.current;

      // The canvas never fades — the brain->nerve handoff lives INSIDE the clip,
      // so the ASCII layer stays fully opaque and simply tracks the scrubbed
      // frame all the way from brain to nerve.
      canvas.style.opacity = "1";

      // --- wrapper crossfade: real hero shows through -> canvas owns the frame
      // Reduced motion uses a gentle plain crossfade instead of the fast handoff.
      const wrapFade = isReduced
        ? smoothstep(0.05, 0.5, p)
        : smoothstep(WRAP_IN, WRAP_FULL, p);
      if (wrapRef.current) wrapRef.current.style.opacity = String(wrapFade);

      // Parked on the hero: the whole wrapper is opacity-0, so every bit of
      // sampling/drawing below would be invisible work. Skip the frame (and
      // idle the spin clip — it resumes via the wantSpin logic on scroll,
      // long before the ASCII brain fades in at p≈0.32).
      if (wrapFade < 0.001) {
        if (spin && !spin.paused) spin.pause();
        return;
      }

      // Thesis labels resolve in with the brain, then fade back out as you
      // scroll into the nerve so the SIGNAL PATH beats own the stage.
      const brainIn = isReduced
        ? smoothstep(0.1, 0.5, p)
        : smoothstep(BRAIN_IN, BRAIN_FULL, p);
      const thesisOut = 1 - smoothstep(0.02, 0.14, morphP);
      if (textRef.current) textRef.current.style.opacity = String(brainIn * thesisOut);

      // --- ink background -------------------------------------------------
      // Ink veil: fully opaque through the hero shred + brain assembly, then
      // eased down across the morph so the dithered page background bleeds in
      // behind the nerve + signal beats (one dithered world). Clear first so the
      // semi-transparent veil never ghosts the previous frame. Reduced: ink
      // crossfades in over the real hero as the plain fallback.
      const inkFade = 1 - 0.45 * smoothstep(0.14, 0.62, morphP);
      const inkAlpha = isReduced ? smoothstep(0.1, 0.5, p) : inkFade;
      ctx.clearRect(0, 0, cssW, cssH);
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

      // ---- ASCII brain: idle 360 spin -> crossfade -> scroll-scrub the morph
      const brainReady = !!brain && brain.readyState >= 2 && brain.videoWidth > 0;
      const spinReady = !!spin && spin.readyState >= 2 && spin.videoWidth > 0;
      // 0 = pure spin (idle), 1 = pure morph clip. The spin dissolves into the
      // morph over the first SPIN_HANDOFF of scroll so the turning brain lands on
      // the morph's side-view instead of popping. Reduced motion skips the spin.
      const morphBlend = isReduced ? 1 : smoothstep(0, SPIN_HANDOFF, morphP);

      // Spin clip: autoplay-loops the idle rotation; pause it once fully crossed
      // into the morph (nothing of it is visible then) to save decode.
      if (spin) {
        const wantSpin = isVisible && !isReduced && morphBlend < 0.999;
        if (wantSpin) {
          if (spin.paused) spin.play().catch(() => undefined);
        } else if (!spin.paused) {
          spin.pause();
        }
      }

      // Morph clip: always paused and seek-scrubbed. Held at BRAIN_IDLE_END (the
      // side-view brain the spin crossfades into) while idle, then advances to
      // the final nerve frame as you scroll.
      if (brainReady) {
        if (!brain.paused) brain.pause();
        const dur = brain.duration;
        if (Number.isFinite(dur) && dur > 0) {
          const target = BRAIN_IDLE_END + clamp(morphP, 0, 1) * (dur - BRAIN_IDLE_END);
          if (Math.abs(brain.currentTime - target) > 0.02) {
            try {
              brain.currentTime = target;
            } catch {
              /* seek can throw mid-load; ignore and retry next frame */
            }
          }
        }
      }

      if (brainIn > 0.001 && (brainReady || spinReady)) {
        const cols = Math.floor(cssW / CELL_PX);
        const rows = Math.floor(cssH / CELL_PX);
        const BBW = cols * 2;
        const BBH = rows * 2;
        if (bbuf.width !== BBW || bbuf.height !== BBH) {
          bbuf.width = BBW;
          bbuf.height = BBH;
        }
        // Crossfade spin -> morph into the sample buffer: draw the spin frame
        // opaque as the base, then the morph frame over it at morphBlend. Both
        // are opaque brain-on-black, so this is an exact dissolve. Whichever the
        // luminance sampler reads below then becomes ASCII.
        bbctx.setTransform(1, 0, 0, 1, 0, 0);
        bbctx.imageSmoothingEnabled = true;
        bbctx.globalCompositeOperation = "source-over";
        bbctx.clearRect(0, 0, BBW, BBH);
        let drewBase = false;
        if (spinReady && morphBlend < 1) {
          const c = coverRect(spin!.videoWidth, spin!.videoHeight, BBW, BBH);
          bbctx.globalAlpha = 1;
          bbctx.drawImage(spin!, c.sx, c.sy, c.sw, c.sh, 0, 0, BBW, BBH);
          drewBase = true;
        }
        if (brainReady && (morphBlend > 0 || !drewBase)) {
          const c = coverRect(brain!.videoWidth, brain!.videoHeight, BBW, BBH);
          bbctx.globalAlpha = drewBase ? morphBlend : 1;
          bbctx.drawImage(brain!, c.sx, c.sy, c.sw, c.sh, 0, 0, BBW, BBH);
        }
        bbctx.globalAlpha = 1;
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

        // ---- neural probe lens: update the heat field over the char grid ----
        let heat = heatRef.current;
        if (heat.cols !== cols || heat.rows !== rows) {
          heat = heatRef.current = { arr: new Float32Array(cols * rows), cols, rows };
        }
        const H = heat.arr;
        const heatFade = Math.exp(-HEAT_DECAY * dt);
        for (let i = 0; i < H.length; i += 1) {
          const v = H[i] * heatFade;
          H[i] = v < 0.004 ? 0 : v;
        }

        // max-blend a smooth radial falloff into the grid around (cx, cy)
        const deposit = (dcx: number, dcy: number, r: number, strength: number) => {
          const c0 = Math.max(0, Math.floor((dcx - r) / cellW));
          const c1 = Math.min(cols - 1, Math.ceil((dcx + r) / cellW));
          const r0 = Math.max(0, Math.floor((dcy - r) / cellH));
          const r1 = Math.min(rows - 1, Math.ceil((dcy + r) / cellH));
          for (let rr = r0; rr <= r1; rr += 1) {
            for (let cc = c0; cc <= c1; cc += 1) {
              const ddx = (cc + 0.5) * cellW - dcx;
              const ddy = (rr + 0.5) * cellH - dcy;
              const dd = Math.sqrt(ddx * ddx + ddy * ddy);
              if (dd >= r) continue;
              const f = 1 - dd / r;
              const v = f * f * (3 - 2 * f) * strength;
              const ii = rr * cols + cc;
              if (v > H[ii]) H[ii] = v;
            }
          }
        };

        const rect = canvas.getBoundingClientRect();
        const lensR = Math.max(LENS_MIN_R, Math.min(cssW, cssH) * LENS_RADIUS_FRAC);
        const pt = pointerRef.current;
        const mx = pt.x - rect.left;
        const my = pt.y - rect.top;
        const lensOn =
          pt.active && mx > -lensR && my > -lensR && mx < cssW + lensR && my < cssH + lensR;
        if (lensOn) {
          // paint along the pointer's path so fast swipes leave an unbroken
          // stroke; a huge jump (re-entry after being away) is a teleport, not
          // a stroke, so it deposits only at the new position
          const pmx = pt.px - rect.left;
          const pmy = pt.py - rect.top;
          const segLen = pt.px > -9e3 ? Math.hypot(mx - pmx, my - pmy) : Infinity;
          if (segLen > 1 && segLen < lensR * 5) {
            const steps = Math.min(8, Math.max(1, Math.ceil(segLen / (lensR * 0.35))));
            for (let s = 1; s <= steps; s += 1) {
              const tt = s / steps;
              deposit(pmx + (mx - pmx) * tt, pmy + (my - pmy) * tt, lensR, 1);
            }
          } else {
            deposit(mx, my, lensR, 1);
          }
        }
        pt.px = pt.x;
        pt.py = pt.y;

        // click/tap pulses: an expanding ring band that ignites glyphs
        if (!isReduced) {
          const pulses = pulsesRef.current;
          for (let i = pulses.length - 1; i >= 0; i -= 1) {
            const pu = pulses[i];
            const age = (now - pu.t0) / 1000;
            const life = 1 - age / PULSE_LIFE;
            const ringR = age * PULSE_SPEED;
            if (life <= 0 || ringR - PULSE_BAND > Math.hypot(cssW, cssH)) {
              pulses.splice(i, 1);
              continue;
            }
            const pux = pu.x - rect.left;
            const puy = pu.y - rect.top;
            const rOut = ringR + PULSE_BAND;
            const c0 = Math.max(0, Math.floor((pux - rOut) / cellW));
            const c1 = Math.min(cols - 1, Math.ceil((pux + rOut) / cellW));
            const r0 = Math.max(0, Math.floor((puy - rOut) / cellH));
            const r1 = Math.min(rows - 1, Math.ceil((puy + rOut) / cellH));
            for (let rr = r0; rr <= r1; rr += 1) {
              for (let cc = c0; cc <= c1; cc += 1) {
                const dd = Math.hypot((cc + 0.5) * cellW - pux, (rr + 0.5) * cellH - puy);
                const f = 1 - Math.abs(dd - ringR) / PULSE_BAND;
                if (f <= 0) continue;
                const v = f * f * life * 0.9;
                const ii = rr * cols + cc;
                if (v > H[ii]) H[ii] = v;
              }
            }
          }
        }

        // lens atmosphere under the glyphs: soft amber glow + rotating reticle
        if (lensOn && brainIn > 0.2) {
          const glow = ctx.createRadialGradient(mx, my, 0, mx, my, lensR);
          glow.addColorStop(0, `rgba(255,91,58,${(0.09 * brainIn).toFixed(3)})`);
          glow.addColorStop(0.65, `rgba(255,91,58,${(0.028 * brainIn).toFixed(3)})`);
          glow.addColorStop(1, "rgba(255,91,58,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(mx, my, lensR, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(255,91,58,${(0.3 * brainIn).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 8]);
          ctx.lineDashOffset = isReduced ? 0 : -(now % 100000) / 36;
          ctx.beginPath();
          ctx.arc(mx, my, lensR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(mx - 5, my);
          ctx.lineTo(mx + 5, my);
          ctx.moveTo(mx, my - 5);
          ctx.lineTo(mx, my + 5);
          ctx.stroke();
        }

        // quantized clock for the scramble flicker (~12Hz, fps-independent)
        const tick = isReduced ? 0 : Math.floor(now / 80);

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
            const hv = H[row * cols + col]; // lens heat at this cell
            if (adjusted <= THRESHOLD) {
              // latent lattice: the lens scans "empty" cortex and finds faint
              // noise glyphs where the brain draws nothing
              if (hv > 0.04) {
                const fl = hash(col * 3.7 + tick, row * 9.1);
                ctx.fillStyle = "#ff5b3a";
                ctx.globalAlpha = Math.min(0.3, hv * 0.32) * brainIn;
                ctx.fillText(
                  SCRAMBLE[(fl * SCRAMBLE.length) | 0],
                  (col + 0.5) * cellW,
                  (row + 0.5) * cellH
                );
              }
              continue;
            }
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

            const alpha = (0.4 + t * 0.6) * reveal * brainIn;
            if (hv > 0.012) {
              // heated glyph: gray -> amber (sparse deviant cells go straight
              // to white-hot), then everything blows out near the lens core
              const base = adjusted > 0.6 ? TIER_HI : adjusted > 0.38 ? TIER_MID : TIER_LO;
              const deviant = hash(col * 0.53, row * 1.71) > 0.93;
              const target = deviant ? ACCENT_HOT : ACCENT;
              const mixA = Math.min(1, hv / 0.7);
              let cr = base[0] + (target[0] - base[0]) * mixA;
              let cg = base[1] + (target[1] - base[1]) * mixA;
              let cb = base[2] + (target[2] - base[2]) * mixA;
              if (!deviant && hv > 0.7) {
                const toHot = (hv - 0.7) / 0.3;
                cr += (ACCENT_HOT[0] - cr) * toHot;
                cg += (ACCENT_HOT[1] - cg) * toHot;
                cb += (ACCENT_HOT[2] - cb) * toHot;
              }
              let ch = getAsciiChar(t);
              if (!isReduced && hv > 0.2 && hash(col * 12.9 + tick * 7.3, row * 5.7) < hv * 0.8) {
                ch = SCRAMBLE[(hash(col + tick, row * 1.7 + tick) * SCRAMBLE.length) | 0];
              }
              ctx.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
              ctx.globalAlpha = Math.min(1, alpha + hv * 0.85);
              ctx.fillText(ch, drawX, drawY);
              continue;
            }
            const color =
              adjusted > 0.6 ? "#e8e4d8" : adjusted > 0.38 ? "#a8a5a0" : "#7c7a76";
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
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
      ref={sectionRef}
      id="brain"
      className="relative -mt-[100svh]"
      // 200svh brain (100svh overlap + 100svh assembly) + MORPH_SCROLL_SVH for
      // the brain->nerve scrub. Driven by the constant so the two stay in sync.
      style={{ height: `${200 + MORPH_SCROLL_SVH}svh` }}
    >
      <div
        ref={wrapRef}
        className="pointer-events-none sticky top-0 h-[100svh] overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Off-screen copies the canvas samples. The hero copy plays to stay in
            sync with <Hero>; the brain->nerve clip is scrubbed, not played.
            Neither is ever shown directly. */}
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
          src={BRAIN_NERVE_SRC}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          playsInline
          preload="auto"
        />
        {/* Idle 360 spin — autoplay-loops a seamless ping-pong of the rotating
            brain. Sampled by the canvas, never shown directly. */}
        <video
          ref={spinRef}
          src={SPIN_SRC}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          loop
          playsInline
          preload="auto"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* THE SIGNAL PATH — scroll-revealed beats alongside the nerve. */}
        <NerveSignals sectionRef={sectionRef} />

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
