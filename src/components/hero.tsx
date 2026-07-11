"use client";

import { useEffect, useRef, useState } from "react";
import { Cross, GridDots } from "@/components/glyphs";

// --- ASCII renderer tuning -------------------------------------------------
const ASCII_RAMP = " .:-=+*#%@";
// Cell size in CSS px. Smaller = more detail. ~9px reads the wireframe brain
// clearly without dissolving into noise.
const CELL_PX = 9;
// Push the mid-tones apart so the bright filaments separate from the haze.
const CONTRAST = 1.5;
const BRIGHTNESS = 1.3;
// Anything dimmer than this (after contrast) stays empty — black stays black,
// only the glowing filaments become characters.
const THRESHOLD = 0.2;
// One-time "pull together" intro, in ms.
const INTRO_MS = 1700;
// How far, as a fraction of the canvas, scattered characters start from home.
const SCATTER = 0.4;

// Deterministic per-cell pseudo-random in [0,1) — stable across frames so the
// scatter is a real position, not per-frame jitter.
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function getAsciiChar(t: number) {
  const index = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(Math.pow(t, 0.8) * (ASCII_RAMP.length - 1)))
  );
  return ASCII_RAMP[index];
}

function CornerLetter({
  letter,
  side,
}: {
  letter: string;
  side: "left" | "right";
}) {
  const mark = <Cross className="text-df-white/35 h-3 w-3" />;
  return (
    <div className="flex items-center gap-3 md:gap-4">
      {side === "left" && (
        <>
          <span className="font-serif-df text-2xl md:text-4xl leading-none text-df-white">
            {letter}
          </span>
          {mark}
        </>
      )}
      {side === "right" && (
        <>
          {mark}
          <span className="font-serif-df text-2xl md:text-4xl leading-none text-df-white">
            {letter}
          </span>
        </>
      )}
    </div>
  );
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<number | null>(null);
  // Live scroll state read inside the render loop via refs so the loop never
  // restarts on scroll.
  const exitRef = useRef(0);
  const introStartRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setIsReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const section = document.getElementById("home");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Scroll drives how much the brain disperses as the hero leaves the top.
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("home");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 while the hero fills the top of the screen, →1 as it scrolls away.
      exitRef.current = Math.max(0, Math.min(1, -rect.top / vh));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const render = () => {
      frameRef.current = window.requestAnimationFrame(render);

      if (!isVisible) return;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(cssW * dpr)) canvas.width = Math.round(cssW * dpr);
      if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // object-cover: fit the video to the canvas without distorting the brain.
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const canvasAR = cssW / cssH;
      const videoAR = vw / vh;
      let sx = 0;
      let sy = 0;
      let sw = vw;
      let sh = vh;
      if (videoAR > canvasAR) {
        sw = vh * canvasAR;
        sx = (vw - sw) / 2;
      } else {
        sh = vw / canvasAR;
        sy = (vh - sh) / 2;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cssW, cssH);

      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = img.data;
      const bw = canvas.width;

      ctx.clearRect(0, 0, cssW, cssH);

      const cols = Math.floor(cssW / CELL_PX);
      const rows = Math.floor(cssH / CELL_PX);
      const cellW = cssW / cols;
      const cellH = cssH / rows;
      const fontSize = Math.max(7, cellH * 1.05);
      ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Assembly amount: intro pulls it together on load, scroll disperses it
      // again as the hero leaves the viewport.
      let intro = 1;
      if (!isReducedMotion) {
        if (introStartRef.current == null) introStartRef.current = performance.now();
        intro = Math.min(1, (performance.now() - introStartRef.current) / INTRO_MS);
      }
      const assembly = isReducedMotion
        ? 1
        : easeOutCubic(intro) * (1 - 0.92 * exitRef.current);
      const scatterPx = SCATTER * Math.min(cssW, cssH) * (1 - assembly);

      // Sample offsets (in device px) used to catch thin filaments per cell.
      const sxo = [0.5, 0.25, 0.75, 0.5, 0.5];
      const syo = [0.5, 0.5, 0.5, 0.25, 0.75];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const cx = (col + 0.5) * cellW;
          const cy = (row + 0.5) * cellH;

          // Take the brightest of a few samples so a thin bright line inside
          // the cell still lights it up.
          let lum = 0;
          for (let s = 0; s < sxo.length; s += 1) {
            const px = Math.min(bw - 1, Math.round((col + sxo[s]) * cellW * dpr));
            const py = Math.round((row + syo[s]) * cellH * dpr);
            const i = (py * bw + px) * 4;
            const l =
              (0.2126 * (data[i] ?? 0) +
                0.7152 * (data[i + 1] ?? 0) +
                0.0722 * (data[i + 2] ?? 0)) /
              255;
            if (l > lum) lum = l;
          }

          const adjusted = Math.min(
            1,
            Math.max(0, (lum - 0.5) * CONTRAST + 0.5) * BRIGHTNESS
          );
          if (adjusted <= THRESHOLD) continue;
          const t = (adjusted - THRESHOLD) / (1 - THRESHOLD);

          // Stable per-cell scatter — a real displacement, eased to home.
          const h1 = hash(col, row);
          const h2 = hash(col + 41.7, row + 17.3);
          const angle = h1 * Math.PI * 2;
          const dist = (0.35 + 0.65 * h2) * scatterPx;
          const drawX = cx + Math.cos(angle) * dist;
          const drawY = cy + Math.sin(angle) * dist;

          // Progressive reveal: cells fade in as the brain assembles, so it
          // starts sparse and fills to the full brain.
          const reveal = Math.min(1, Math.max(0, (assembly - h2 * 0.55) / 0.45));
          if (reveal <= 0) continue;

          // Purely monochrome brain: off-white filaments -> grey on black.
          // No color at rest — the amber accent lives only on hover elsewhere.
          const color =
            adjusted > 0.6 ? "#e8e4d8" : adjusted > 0.38 ? "#a8a5a0" : "#7c7a76";
          ctx.fillStyle = color;
          ctx.globalAlpha = (0.4 + t * 0.6) * reveal;
          ctx.fillText(getAsciiChar(t), drawX, drawY);
        }
      }
      ctx.globalAlpha = 1;
    };

    if (video.readyState >= 2) video.play().catch(() => undefined);
    const onCanPlay = () => video.play().catch(() => undefined);
    video.addEventListener("canplay", onCanPlay);

    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isVisible, isReducedMotion]);

  return (
    <section
      id="home"
      className="relative min-h-[100svh] flex flex-col justify-between px-3 md:px-6 pt-16 md:pt-20 pb-6 overflow-hidden"
    >
      <video
        ref={videoRef}
        src="/brain-hero.mp4"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,228,216,0.05),transparent_55%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,16,0.25),rgba(10,12,16,0.55)_60%,rgba(10,12,16,0.9))]" />

      <div className="relative z-10 flex items-start justify-between">
        <CornerLetter letter="D" side="left" />
        <CornerLetter letter="F" side="right" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">
        <h1 className="hero-word font-grotesque text-df-white text-center leading-[0.8] tracking-[-0.03em] whitespace-nowrap text-[clamp(54px,15.5vw,280px)] [text-shadow:0_0_40px_rgba(10,12,16,0.55)]">
          BRINK
        </h1>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <CornerLetter letter="L" side="left" />

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-[3px] text-df-white/60">
            <span className="h-[3px] w-[3px] bg-current" />
            <span className="h-[3px] w-[3px] bg-current opacity-60" />
            <span className="h-[3px] w-[3px] bg-current" />
          </div>
          <div className="flex items-stretch border hairline bg-black/40 backdrop-blur-sm">
            <span className="px-3 flex items-center mono-label border-r hairline">
              GUI
            </span>
            <span className="px-4 flex items-center border-r hairline text-df-white/70">
              <GridDots />
            </span>
            <a
              href="#about"
              className="px-3 flex items-center mono-label !text-df-white hover:!text-df-orange transition-colors"
            >
              Open
            </a>
          </div>
        </div>

        <CornerLetter letter="Y" side="right" />
      </div>
    </section>
  );
}
