"use client";

import { useEffect, useRef, useState } from "react";

// The nerve/stem cut out of the brain-scan clip (the brain was cropped away —
// only the spinal nerve remains). It hangs from the top, directly under the
// rotating ASCII brain above, so brain + nerve read as one continuous organism.
// As you scroll this pinned section the nerve scrubs frame-by-frame (scroll
// moves it, stop holds it); it is rendered in the SAME ASCII treatment as the
// brain (same ramp, cell size, off-white-on-ink palette).

// --- ASCII treatment: identical tuning to components/ascii-brain.tsx ---------
const ASCII_RAMP = " .:-=+*#%@";
const CELL_PX = 9;
const CONTRAST = 1.5;
const BRIGHTNESS = 1.3;
const THRESHOLD = 0.2;
const INK: [number, number, number] = [10, 12, 16]; // #0a0c10

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
// Fit source into the destination as object-cover (the canvas box already
// matches the frame aspect, so this is a clean 1:1 with no crop).
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

  useEffect(() => {
    const section = document.getElementById("brain-nerve-scrub");
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Scroll -> target frame. Driven by the existing Lenis window scroll.
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("brain-nerve-scrub");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total || 1);
      const p = total > 0 ? scrolled / total : 0;
      targetRef.current = p * (FRAME_COUNT - 1);
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
      let tries = 0;
      const drawStill = () => {
        if (paint(0) || tries > 120) return;
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
    // Tall section so the nerve pins and scrubs on scroll. The canvas box is a
    // narrow, top-anchored column matching the nerve frame aspect (340/420), so
    // the nerve hangs straight down from where the brain sits above it.
    <section id="brain-nerve-scrub" className="relative h-[300vh] bg-df-black">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-df-black">
        <canvas
          ref={canvasRef}
          className="absolute left-1/2 top-0 h-[100svh] aspect-[340/420] -translate-x-1/2"
        />
      </div>
    </section>
  );
}

export default BrainNerveScrub;
