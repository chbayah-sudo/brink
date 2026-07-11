"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Cross, GridDots } from "@/components/glyphs";

const ASCII_RAMP = " .:-=+*#%@";
const GRID_COLS = 92;
const GRID_ROWS = 48;
const CONTRAST = 1.35;
const BRIGHTNESS = 1.02;
const SCATTER_INTENSITY = 0.8;

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

function getAsciiChar(brightness: number) {
  const index = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(brightness * (ASCII_RAMP.length - 1)))
  );
  return ASCII_RAMP[index];
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const heroMeta = useMemo(
    () => ({
      width: GRID_COLS,
      height: GRID_ROWS,
    }),
    []
  );

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
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isReducedMotion) return;

    const onScroll = () => {
      const section = document.getElementById("home");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, 1 - rect.bottom / viewportHeight));
      setScrollProgress(progress);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (!isVisible || isReducedMotion) {
        frameRef.current = window.requestAnimationFrame(render);
        return;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) {
        frameRef.current = window.requestAnimationFrame(render);
        return;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(video, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;

      ctx.clearRect(0, 0, width, height);
      ctx.font = "10px IBM Plex Mono";
      ctx.textBaseline = "top";

      const cellW = width / heroMeta.width;
      const cellH = height / heroMeta.height;

      const scatterAmount = (1 - scrollProgress) * SCATTER_INTENSITY;
      const displayProgress = Math.max(0, Math.min(1, scrollProgress));

      for (let y = 0; y < heroMeta.height; y += 1) {
        for (let x = 0; x < heroMeta.width; x += 1) {
          const px = Math.floor(x * cellW);
          const py = Math.floor(y * cellH);
          const srcIndex = (py * width + px) * 4;
          const r = data[srcIndex] ?? 0;
          const g = data[srcIndex + 1] ?? 0;
          const b = data[srcIndex + 2] ?? 0;
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const adjusted = Math.min(1, Math.max(0, (luminance * CONTRAST - 0.15) * BRIGHTNESS));
          const shouldRender = displayProgress > 0 ? adjusted > 0.02 + (1 - displayProgress) * 0.18 : adjusted > 0.04 + scatterAmount;
          if (!shouldRender) continue;

          const char = getAsciiChar(adjusted);
          const offsetX = (Math.random() - 0.5) * scatterAmount * cellW * 1.8;
          const offsetY = (Math.random() - 0.5) * scatterAmount * cellH * 1.8;
          const drawX = x * cellW + offsetX;
          const drawY = y * cellH + offsetY;
          const tint = adjusted > 0.8 ? "#38e1ff" : "#e8e4d8";
          const alpha = 0.72 + adjusted * 0.28;

          ctx.fillStyle = tint;
          ctx.globalAlpha = alpha;
          ctx.fillText(char, drawX, drawY);
          ctx.globalAlpha = 1;
        }
      }

      frameRef.current = window.requestAnimationFrame(render);
    };

    if (video.readyState >= 2) {
      video.play().catch(() => undefined);
    }

    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [heroMeta, isVisible, isReducedMotion, scrollProgress]);

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
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,225,255,0.08),transparent_55%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,16,0.2),rgba(10,12,16,0.85))]" />

      <div className="relative z-10 flex items-start justify-between">
        <CornerLetter letter="D" side="left" />
        <CornerLetter letter="F" side="right" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">
        <h1 className="hero-word font-grotesque text-df-orange text-center leading-[0.8] tracking-[-0.03em] whitespace-nowrap text-[clamp(54px,15.5vw,280px)]">
          BRINK
        </h1>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <CornerLetter letter="L" side="left" />

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-[3px] text-df-orange">
            <span className="h-[3px] w-[3px] bg-current" />
            <span className="h-[3px] w-[3px] bg-current opacity-60" />
            <span className="h-[3px] w-[3px] bg-current" />
          </div>
          <div className="flex items-stretch border hairline bg-black/40 backdrop-blur-sm">
            <span className="px-3 flex items-center mono-label border-r hairline">
              GUI
            </span>
            <span className="px-4 flex items-center border-r hairline text-df-orange">
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
