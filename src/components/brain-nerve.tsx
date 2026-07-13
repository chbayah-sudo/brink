"use client";

import { useEffect, useRef, useState } from "react";

// A single nerve/stem that grows DOWN out of the rotating ASCII brain above
// (<AsciiBrain>). There is no second brain here — just the nerve. As you scroll
// through this pinned section, the nerve draws/extends frame-by-frame with
// scroll progress; stop scrolling and it holds; scroll back up and it retracts.
// Rendered in the SAME ASCII treatment as the brain (same ramp, cell size and
// off-white-on-ink palette) so it reads as one continuous ASCII organism.

// --- ASCII treatment: identical tuning to components/ascii-brain.tsx ---------
const ASCII_RAMP = " .:-=+*#%@";
const CELL_PX = 9;
const THRESHOLD = 0.2;
const INK: [number, number, number] = [10, 12, 16]; // #0a0c10

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

export function BrainNerve() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Float32Array | null>(null);
  const loopRef = useRef<number | null>(null);
  const targetRef = useRef(0); // scroll-driven target length 0..1
  const shownRef = useRef(-1); // eased length actually drawn (-1 = first paint)
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
    const section = document.getElementById("brain-nerve");
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Scroll progress -> target nerve length (0 at the top of the pinned section,
  // 1 once fully scrolled). Driven by the existing Lenis window scroll.
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("brain-nerve");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total || 1);
      targetRef.current = total > 0 ? scrolled / total : 0;
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

    // Add a radial dab of intensity into the ASCII cell grid at pixel (px,py).
    const stamp = (
      grid: Float32Array,
      cols: number,
      rows: number,
      cellW: number,
      cellH: number,
      px: number,
      py: number,
      rpx: number,
      strength: number
    ) => {
      const c0 = Math.max(0, Math.floor((px - rpx) / cellW));
      const c1 = Math.min(cols - 1, Math.ceil((px + rpx) / cellW));
      const r0 = Math.max(0, Math.floor((py - rpx) / cellH));
      const r1 = Math.min(rows - 1, Math.ceil((py + rpx) / cellH));
      for (let r = r0; r <= r1; r += 1) {
        const ccy = (r + 0.5) * cellH;
        for (let c = c0; c <= c1; c += 1) {
          const ccx = (c + 0.5) * cellW;
          const d = Math.hypot(ccx - px, ccy - py);
          if (d < rpx) grid[r * cols + c] += strength * (1 - d / rpx);
        }
      }
    };

    // Gentle organic wander of the nerve centreline.
    const wobble = (y: number, amp: number) =>
      Math.sin(y * 0.011) * amp + Math.sin(y * 0.028 + 1.3) * amp * 0.34;

    // Draw the nerve for a given length fraction (0..1).
    const paint = (lenFrac: number) => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (!cssW || !cssH) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
      if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`;
      ctx.fillRect(0, 0, cssW, cssH);

      const cols = Math.floor(cssW / CELL_PX);
      const rows = Math.floor(cssH / CELL_PX);
      if (cols < 1 || rows < 1) return;
      let grid = gridRef.current;
      if (!grid || grid.length !== cols * rows) {
        grid = new Float32Array(cols * rows);
        gridRef.current = grid;
      } else {
        grid.fill(0);
      }

      const cellW = cssW / cols;
      const cellH = cssH / rows;
      const centerX = cssW / 2;
      const amp = Math.min(cssW * 0.05, 52);
      const coreHalf = Math.max(cssW * 0.007, 6); // core column half-width (px)
      const vertSpacing = 24; // vertebra pitch (px)
      // The nerve starts a touch above the top edge so it reads as entering from
      // the brain above, and fully extends just past the bottom.
      const yStart = -cellH * 3;
      const yFull = cssH * 1.04;
      const yTip = yStart + (yFull - yStart) * lenFrac;

      // Core column: dense overlapping dabs down the centreline.
      for (let y = yStart; y <= yTip; y += 1.5) {
        const x = centerX + wobble(y, amp);
        const tipTaper = clamp((yTip - y) / 70, 0.28, 1);
        stamp(grid, cols, rows, cellW, cellH, x, y, coreHalf * (0.85 + 0.15 * tipTaper), 0.85);
      }

      // Vertebrae: knobby bodies + alternating lateral processes + bright nodes.
      let k = 0;
      for (let y = yStart; y <= yTip; y += vertSpacing) {
        const x = centerX + wobble(y, amp);
        const tipTaper = clamp((yTip - y) / 90, 0.32, 1);
        const bodyHalf = coreHalf * 2.0 * tipTaper;
        // vertebra body (wider dab)
        stamp(grid, cols, rows, cellW, cellH, x, y, bodyHalf, 0.7);
        // lateral process, alternating side
        const dir = k % 2 === 0 ? 1 : -1;
        stamp(grid, cols, rows, cellW, cellH, x + dir * bodyHalf * 1.15, y - 2, coreHalf * 1.1 * tipTaper, 0.6);
        // bright glow node at the centre (reads as the lit vertebra dots)
        stamp(grid, cols, rows, cellW, cellH, x, y, coreHalf * 0.7, 1.5);
        k += 1;
      }

      // Growing tip: a bright leading point where the nerve is currently drawing.
      const tipX = centerX + wobble(yTip, amp);
      stamp(grid, cols, rows, cellW, cellH, tipX, yTip, coreHalf * 1.0, 1.8);

      // --- render the intensity grid as ASCII, brain-style palette -----------
      const fontSize = Math.max(7, cellH * 1.05);
      ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const adjusted = grid[row * cols + col];
          if (adjusted <= THRESHOLD) continue;
          const a = Math.min(1, adjusted);
          const t = (a - THRESHOLD) / (1 - THRESHOLD);
          const color =
            adjusted > 1.0 ? "#e8e4d8" : adjusted > 0.5 ? "#a8a5a0" : "#7c7a76";
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.4 + t * 0.6;
          ctx.fillText(getAsciiChar(t), (col + 0.5) * cellW, (row + 0.5) * cellH);
        }
      }
      ctx.globalAlpha = 1;
    };

    if (isReduced) {
      let tries = 0;
      const drawStill = () => {
        paint(1);
        if (canvas.clientWidth || tries > 120) return;
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
      shown += (target - shown) * 0.16;
      if (Math.abs(target - shown) < 0.0008) shown = target;
      shownRef.current = shown;
      paint(clamp(shown, 0, 1));
    };
    loopRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (loopRef.current) window.cancelAnimationFrame(loopRef.current);
    };
  }, [isVisible, isReduced]);

  return (
    // Tall section so the nerve draws while it pins; scroll scrubs the length.
    <section id="brain-nerve" className="relative h-[300vh] bg-df-black">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-df-black">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  );
}

export default BrainNerve;
