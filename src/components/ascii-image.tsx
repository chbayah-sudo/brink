"use client";

import { useEffect, useRef } from "react";

/**
 * AsciiImage — renders a still image as dot-matrix ASCII on a canvas, using the
 * exact same ramp + sampling as the hero brain effect (see ascii-brain.tsx), so
 * a plain photo reads in the same style as the ASCII brain card.
 *
 * These constants MIRROR ascii-brain.tsx (kept in sync by value rather than
 * shared, to avoid importing the heavy hero component into a card). Same ramp,
 * same CELL_PX density, same contrast/brightness/threshold, same
 * brightest-of-2x2 luminance sampling, same getAsciiChar mapping and 3-tier
 * light-on-ink colouring. Static (assembled) — no scatter/scroll animation.
 */
export const ASCII_RAMP = " .:-=+*#%@";
export const CELL_PX = 9;
// Ramp + sampling mirror the hero exactly. Contrast/brightness/threshold are
// exposure-compensated vs the hero (1.5 / 1.3 / 0.2), because a photographed
// subject on black is darker than the brain video — without the lift the rider
// clips to just the helmet. The contrast pivot at 0.5 still keeps the black
// background empty (only lum > ~0.12 renders), so it reads dense like the brain.
const CONTRAST = 1.3;
const BRIGHTNESS = 2.0;
const THRESHOLD = 0.06;
export const INK: [number, number, number] = [10, 12, 16]; // #0a0c10

// Same 3-tier light-on-ink colouring as the hero brain, shared by the ASCII cards.
export function charColor(v: number) {
  return v > 0.6 ? "#e8e4d8" : v > 0.38 ? "#a8a5a0" : "#7c7a76";
}

export function getAsciiChar(t: number) {
  const index = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(Math.pow(t, 0.8) * (ASCII_RAMP.length - 1)))
  );
  return ASCII_RAMP[index];
}

// Fit a source image into a destination rect as object-cover, returning the
// source sub-rectangle to sample (mirrors coverRect in ascii-brain.tsx).
function coverRect(vw: number, vh: number, dw: number, dh: number) {
  const arD = dw / dh;
  const arS = vw / vh;
  let sw: number, sh: number, sx: number, sy: number;
  if (arS > arD) {
    sh = vh;
    sw = vh * arD;
    sx = (vw - sw) / 2;
    sy = 0;
  } else {
    sw = vw;
    sh = vw / arD;
    sx = 0;
    sy = (vh - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

export function AsciiImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d", { willReadFrequently: true });
    if (!bctx) return;

    const img = new Image();
    let disposed = false;

    const draw = () => {
      if (disposed || !img.complete || img.naturalWidth === 0) return;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW < 2 || cssH < 2) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ink background — same as the brain's resting field
      ctx.fillStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`;
      ctx.fillRect(0, 0, cssW, cssH);

      const cols = Math.floor(cssW / CELL_PX);
      const rows = Math.floor(cssH / CELL_PX);
      if (cols < 1 || rows < 1) return;

      // 2x supersample buffer, sampled object-cover from the source image
      const BBW = cols * 2;
      const BBH = rows * 2;
      buf.width = BBW;
      buf.height = BBH;
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
      ctx.globalCompositeOperation = "source-over";

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
          const adjusted = Math.min(
            1,
            Math.max(0, (lum - 0.5) * CONTRAST + 0.5) * BRIGHTNESS
          );
          if (adjusted <= THRESHOLD) continue;
          const t = (adjusted - THRESHOLD) / (1 - THRESHOLD);

          const cx = (col + 0.5) * cellW;
          const cy = (row + 0.5) * cellH;
          ctx.fillStyle =
            adjusted > 0.6 ? "#e8e4d8" : adjusted > 0.38 ? "#a8a5a0" : "#7c7a76";
          ctx.globalAlpha = 0.4 + t * 0.6;
          ctx.fillText(getAsciiChar(t), cx, cy);
        }
      }
      ctx.globalAlpha = 1;
    };

    img.onload = draw;
    img.src = src;
    if (img.complete && img.naturalWidth > 0) draw();

    // redraw once the mono font is ready (first paint may use a fallback)
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (!disposed) draw();
      });
    }

    // responsive: redraw at the card's current size
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);

    return () => {
      disposed = true;
      img.onload = null;
      ro.disconnect();
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
    />
  );
}
