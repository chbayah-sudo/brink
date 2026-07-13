"use client";

import { useEffect, useRef, useState } from "react";

// The nerve/stem cut out of the brain-scan clip (the brain was cropped away —
// only the spinal nerve remains). It is drawn as a transparent overlay INSIDE
// the brain's pinned viewport (mounted by components/ascii-brain.tsx), directly
// under the rotating brain, so brain + nerve read as one continuous organism.
// It scrubs frame-by-frame over the brain's "nerve phase" scroll (scroll moves
// it, stop holds it), in the SAME ASCII treatment as the brain.

// ===========================================================================
// NERVE POSITION / SIZE — edit these to align the nerve to the brain stem.
// (Brain size/position is tuned by BRAIN_REST_* in components/ascii-brain.tsx.)
// ---------------------------------------------------------------------------
// NERVE_X_PCT     : horizontal offset of the nerve's centre from the viewport
//                   centre, in % of viewport width (+ = right, - = left).
// NERVE_TOP_VH    : nerve column top edge, in vh from the top of the viewport.
// NERVE_HEIGHT_VH : nerve column height in vh (width follows the 340/420 aspect).
// NERVE_DRAW_END  : nerve-phase progress (0..1) by which the nerve has fully
//                   drawn/extended downward (it reveals top->bottom as you
//                   scroll, so it draws in as the brain fades out).
export const NERVE_X_PCT = 0;
export const NERVE_TOP_VH = 10;
export const NERVE_HEIGHT_VH = 86;
export const NERVE_DRAW_END = 0.92;
// ===========================================================================

// --- ASCII treatment: identical tuning to components/ascii-brain.tsx ---------
const ASCII_RAMP = " .:-=+*#%@";
const CELL_PX = 9;
const CONTRAST = 1.5;
const BRIGHTNESS = 1.3;
const THRESHOLD = 0.2;

// Cropped nerve frame sequence. Keep in sync with /public/nerve-frames.
const FRAME_COUNT = 75;
const FRAME_SRC = (i: number) =>
  `/nerve-frames/${String(i + 1).padStart(4, "0")}.jpg`;

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
function getAsciiChar(t: number) {
  const index = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(Math.pow(t, 0.8) * (ASCII_RAMP.length - 1)))
  );
  return ASCII_RAMP[index];
}
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

export function BrainNerveScrub() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const loopRef = useRef<number | null>(null);
  const targetRef = useRef(0);
  const shownRef = useRef(-1);
  const lastPaintedRef = useRef(-1);
  const nervePRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i += 1) {
      const img = new Image();
      img.decoding = "async";
      img.src = FRAME_SRC(i);
      imgs[i] = img;
    }
    framesRef.current = imgs;
  }, []);

  // Pause while the brain scene is off-screen.
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

  // Scroll -> target nerve frame, driven by the brain section's "nerve phase"
  // (everything scrolled beyond the first viewport of assembly). This matches
  // the same math AsciiBrain uses to settle the brain, so they stay in sync.
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("brain");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total || 1);
      const assembly = window.innerHeight;
      const nerveP = clamp((scrolled - assembly) / (total - assembly || 1), 0, 1);
      nervePRef.current = nerveP;
      targetRef.current = nerveP * (FRAME_COUNT - 1);
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
    const buf = (bufRef.current ??= document.createElement("canvas"));
    const bctx = buf.getContext("2d", { willReadFrequently: true })!;

    const paint = (frameIndex: number) => {
      const img = framesRef.current[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return false;

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (!cssW || !cssH) return false;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
      if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Transparent overlay — the brain shows through around the nerve.
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, cssW, cssH);

      const cols = Math.floor(cssW / CELL_PX);
      const rows = Math.floor(cssH / CELL_PX);
      if (cols < 1 || rows < 1) return false;
      const BBW = cols * 2;
      const BBH = rows * 2;
      if (buf.width !== BBW || buf.height !== BBH) {
        buf.width = BBW;
        buf.height = BBH;
      }
      const { sx, sy, sw, sh } = coverRect(img.naturalWidth, img.naturalHeight, BBW, BBH);
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.imageSmoothingEnabled = true;
      bctx.clearRect(0, 0, BBW, BBH);
      bctx.drawImage(img, sx, sy, sw, sh, 0, 0, BBW, BBH);
      const bd = bctx.getImageData(0, 0, BBW, BBH).data;

      const cellW = cssW / cols;
      const cellH = cssH / rows;
      const fontSize = Math.max(7, cellH * 1.05);
      ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          let lum = 0;
          for (let dyy = 0; dyy < 2; dyy += 1) {
            for (let dxx = 0; dxx < 2; dxx += 1) {
              const bx = Math.min(BBW - 1, col * 2 + dxx);
              const by = Math.min(BBH - 1, row * 2 + dyy);
              const i = (by * BBW + bx) * 4;
              const l = (0.2126 * bd[i] + 0.7152 * bd[i + 1] + 0.0722 * bd[i + 2]) / 255;
              if (l > lum) lum = l;
            }
          }
          const adjusted = Math.min(1, Math.max(0, (lum - 0.5) * CONTRAST + 0.5) * BRIGHTNESS);
          if (adjusted <= THRESHOLD) continue;
          const t = (adjusted - THRESHOLD) / (1 - THRESHOLD);
          const color =
            adjusted > 0.6 ? "#e8e4d8" : adjusted > 0.38 ? "#a8a5a0" : "#7c7a76";
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.4 + t * 0.6;
          ctx.fillText(getAsciiChar(t), (col + 0.5) * cellW, (row + 0.5) * cellH);
        }
      }
      ctx.globalAlpha = 1;
      return true;
    };

    if (isReduced) {
      // Static: show a representative, fully-drawn nerve, no scrubbing/reveal.
      canvas.style.clipPath = "none";
      let tries = 0;
      const drawStill = () => {
        if (paint(Math.round((FRAME_COUNT - 1) * 0.6)) || tries > 120) return;
        tries += 1;
        loopRef.current = window.requestAnimationFrame(drawStill);
      };
      drawStill();
      return () => {
        if (loopRef.current) window.cancelAnimationFrame(loopRef.current);
      };
    }

    const loop = () => {
      loopRef.current = window.requestAnimationFrame(loop);
      if (!isVisible) return;
      const target = targetRef.current;
      let shown = shownRef.current;
      if (shown < 0) shown = target;
      shown += (target - shown) * 0.18;
      if (Math.abs(target - shown) < 0.01) shown = target;
      shownRef.current = shown;

      // Top-anchored reveal so the nerve DRAWS downward as you scroll (eased via
      // `shown`, so it holds when scrolling stops).
      const shownP = FRAME_COUNT > 1 ? shown / (FRAME_COUNT - 1) : 0;
      const reveal = clamp(shownP / NERVE_DRAW_END, 0, 1);
      canvas.style.clipPath = `inset(0 0 ${(1 - reveal) * 100}% 0)`;

      const idx = clamp(Math.round(shown), 0, FRAME_COUNT - 1);
      if (idx !== lastPaintedRef.current) {
        if (paint(idx)) lastPaintedRef.current = idx;
      }
    };
    loopRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (loopRef.current) window.cancelAnimationFrame(loopRef.current);
    };
  }, [isVisible, isReduced]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute aspect-[340/420]"
      style={{
        left: `calc(50% + ${NERVE_X_PCT}vw)`,
        top: `${NERVE_TOP_VH}svh`,
        height: `${NERVE_HEIGHT_VH}svh`,
        transform: "translateX(-50%)",
      }}
    />
  );
}

export default BrainNerveScrub;
